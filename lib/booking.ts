import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { activeStaffCount, nowWib, parseDate } from "./availability";
import { checkRoomCount, computePackagePrice, slotLengthMinutes } from "./harga";
import { expireOverdue } from "./kedaluwarsa";
import { prisma } from "./prisma";

export type BookingInput = {
  userId: number;
  serviceId: number;
  roomCount: number; // chosen by the customer; validated against the package's min_rooms..max_rooms
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm, must match an active operating_hour
  address: string;
  notes?: string;
};

export type BookingResult =
  | { ok: true; code: string }
  | { ok: false; error: string; field?: "date" | "slot" | "service" | "room" };

class Rejected extends Error {
  constructor(
    message: string,
    public field?: "date" | "slot" | "service" | "room",
  ) {
    super(message);
  }
}

const PAYMENT_WINDOW_MS = 60 * 60 * 1000;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function newCode() {
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

/**
 * Creates a PENDING_PAYMENT booking and reserves one unit of slot quota in
 * a single transaction. Price and duration are computed here from the package
 * (base_price + price_per_room × room_count); the caller only supplies the
 * room count, which is range-checked. The booking keeps a snapshot of the prices. Quota is taken with a conditional UPDATE (filled < effective capacity), which
 * Postgres serialises per row, so two requests can't both take the last slot.
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const date = parseDate(input.date);
  if (!date) return { ok: false, error: "Tanggal tidak valid", field: "date" };

  const today = nowWib();
  if (input.date < today.date) {
    return { ok: false, error: "Tanggal yang sudah lewat tidak bisa dipilih", field: "date" };
  }
  if (input.date === today.date && input.startTime <= today.time) {
    return { ok: false, error: "Jam tersebut sudah lewat", field: "slot" };
  }

  await expireOverdue();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const code = await prisma.$transaction(async (tx) => {
        const service = await tx.service.findFirst({
          where: { id_service: input.serviceId, is_active: true },
        });
        if (!service) throw new Rejected("Paket tidak tersedia", "service");

        const roomError = checkRoomCount(service, input.roomCount);
        if (roomError) throw new Rejected(roomError, "room");
        const { total, duration } = computePackagePrice(service, input.roomCount);

        const timeSlot = await tx.operatingHour.findFirst({
          where: { start_time: input.startTime, active: true },
        });
        if (!timeSlot) throw new Rejected("Jam tidak tersedia", "slot");
        if (duration > slotLengthMinutes(timeSlot.start_time, timeSlot.end_time)) {
          throw new Rejected("Durasi pengerjaan melebihi panjang slot. Kurangi jumlah kamar atau pilih jam lain", "slot");
        }

        // Create the slot row on first use; a concurrent insert is ignored.
        await tx.scheduleSlot.createMany({
          data: [{ date, start_time: timeSlot.start_time, end_time: timeSlot.end_time, quota: timeSlot.quota }],
          skipDuplicates: true,
        });
        const slot = await tx.scheduleSlot.findUniqueOrThrow({
          where: { date_start_time: { date, start_time: timeSlot.start_time } },
        });

        // Effective capacity = min(template quota, active employees) (SPEC 5.1); the
        // template is the source of truth (see availability.ts).
        const capacity = Math.min(timeSlot.quota, await activeStaffCount(tx));
        const taken = await tx.scheduleSlot.updateMany({
          where: { id_slot: slot.id_slot, filled: { lt: capacity } },
          data: { filled: { increment: 1 }, quota: timeSlot.quota },
        });
        if (taken.count === 0) throw new Rejected("Slot sudah penuh, pilih jam lain", "slot");

        const booking = await tx.booking.create({
          data: {
            booking_code: newCode(),
            id_customer: input.userId,
            id_service: service.id_service,
            id_slot: slot.id_slot,
            service_address: input.address,
            notes: input.notes || null,
            room_count: input.roomCount,
            base_price: service.base_price,
            price_per_room: service.price_per_room,
            duration_minutes: duration,
            total_price: total,
            payment_deadline: new Date(Date.now() + PAYMENT_WINDOW_MS),
          },
          select: { booking_code: true },
        });
        return booking.booking_code;
      });
      return { ok: true, code };
    } catch (e) {
      if (e instanceof Rejected) return { ok: false, error: e.message, field: e.field };
      // booking_code collision: extremely unlikely, just retry with a new code.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { ok: false, error: "Gagal membuat booking, coba lagi" };
}
