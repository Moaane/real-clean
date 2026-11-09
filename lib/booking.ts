import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { jumlahKaryawanAktif, nowWib, parseDate } from "./availability";
import { cekJumlahKamar, hitungPaket, panjangSlotMenit } from "./harga";
import { kedaluwarsakanLewatBatas } from "./kedaluwarsa";
import { prisma } from "./prisma";

export type BookingInput = {
  userId: number;
  layananId: number;
  jumlahKamar: number; // dipilih pelanggan; divalidasi terhadap min_kamar..max_kamar paket
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm, must match an active jam_operasional
  alamat: string;
  catatan?: string;
};

export type BookingResult =
  | { ok: true; kode: string }
  | { ok: false; error: string; field?: "tanggal" | "slot" | "layanan" | "kamar" };

class Rejected extends Error {
  constructor(
    message: string,
    public field?: "tanggal" | "slot" | "layanan" | "kamar",
  ) {
    super(message);
  }
}

const BAYAR_WINDOW_MS = 60 * 60 * 1000;
const KODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function newKode() {
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => KODE_CHARS[b % KODE_CHARS.length]).join("");
}

/**
 * Creates a MENUNGGU_PEMBAYARAN booking and reserves one unit of slot quota in
 * a single transaction. Price and duration are computed here from the package
 * (harga_dasar + harga_per_kamar × jumlah_kamar); the caller only supplies the
 * room count, which is range-checked. The booking keeps a snapshot of the prices. Quota is taken with a conditional UPDATE (terisi < effective capacity), which
 * Postgres serialises per row, so two requests can't both take the last slot.
 */
export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const tanggal = parseDate(input.tanggal);
  if (!tanggal) return { ok: false, error: "Tanggal tidak valid", field: "tanggal" };

  const today = nowWib();
  if (input.tanggal < today.date) {
    return { ok: false, error: "Tanggal yang sudah lewat tidak bisa dipilih", field: "tanggal" };
  }
  if (input.tanggal === today.date && input.jamMulai <= today.time) {
    return { ok: false, error: "Jam tersebut sudah lewat", field: "slot" };
  }

  await kedaluwarsakanLewatBatas();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const kode = await prisma.$transaction(async (tx) => {
        const layanan = await tx.layanan.findFirst({
          where: { id_layanan: input.layananId, status_aktif: true },
        });
        if (!layanan) throw new Rejected("Paket tidak tersedia", "layanan");

        const salahKamar = cekJumlahKamar(layanan, input.jumlahKamar);
        if (salahKamar) throw new Rejected(salahKamar, "kamar");
        const { total, durasi } = hitungPaket(layanan, input.jumlahKamar);

        const jam = await tx.jamOperasional.findFirst({
          where: { jam_mulai: input.jamMulai, aktif: true },
        });
        if (!jam) throw new Rejected("Jam tidak tersedia", "slot");
        if (durasi > panjangSlotMenit(jam.jam_mulai, jam.jam_selesai)) {
          throw new Rejected("Durasi pengerjaan melebihi panjang slot. Kurangi jumlah kamar atau pilih jam lain", "slot");
        }

        // Create the slot row on first use; a concurrent insert is ignored.
        await tx.jadwalSlot.createMany({
          data: [{ tanggal, jam_mulai: jam.jam_mulai, jam_selesai: jam.jam_selesai, kuota: jam.kuota }],
          skipDuplicates: true,
        });
        const slot = await tx.jadwalSlot.findUniqueOrThrow({
          where: { tanggal_jam_mulai: { tanggal, jam_mulai: jam.jam_mulai } },
        });

        // Effective capacity = min(template quota, active employees) (SPEC 5.1); the
        // template is the source of truth (see availability.ts).
        const kapasitas = Math.min(jam.kuota, await jumlahKaryawanAktif(tx));
        const taken = await tx.jadwalSlot.updateMany({
          where: { id_slot: slot.id_slot, terisi: { lt: kapasitas } },
          data: { terisi: { increment: 1 }, kuota: jam.kuota },
        });
        if (taken.count === 0) throw new Rejected("Slot sudah penuh, pilih jam lain", "slot");

        const booking = await tx.booking.create({
          data: {
            kode_booking: newKode(),
            id_pelanggan: input.userId,
            id_layanan: layanan.id_layanan,
            id_slot: slot.id_slot,
            alamat_layanan: input.alamat,
            catatan: input.catatan || null,
            jumlah_kamar: input.jumlahKamar,
            harga_dasar: layanan.harga_dasar,
            harga_per_kamar: layanan.harga_per_kamar,
            durasi_menit: durasi,
            total_harga: total,
            batas_bayar: new Date(Date.now() + BAYAR_WINDOW_MS),
          },
          select: { kode_booking: true },
        });
        return booking.kode_booking;
      });
      return { ok: true, kode };
    } catch (e) {
      if (e instanceof Rejected) return { ok: false, error: e.message, field: e.field };
      // kode_booking collision: extremely unlikely, just retry with a new code.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { ok: false, error: "Gagal membuat booking, coba lagi" };
}
