import { getSlotRange, nowWib } from "@/lib/availability";
import { slotLengthMinutes } from "@/lib/harga";

const DAYS = 60;

export type ScheduleResponse = {
  today: string;
  days: { date: string; slots: { start_time: string; end_time: string; span: number; remaining: number }[] }[];
};

/**
 * Raw availability for the next 60 days, independent of package and room count.
 * The client decides which slots fit a given duration, so changing the room count needs no new request.
 * The server still validates everything again when the booking is created.
 */
export async function GET() {
  const today = nowWib().date;
  const range = await getSlotRange(today, DAYS);
  const body: ScheduleResponse = {
    today,
    days: [...range].map(([date, slots]) => ({
      date,
      slots: slots.map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
        span: slotLengthMinutes(s.start_time, s.end_time),
        remaining: s.remaining,
      })),
    })),
  };
  return Response.json(body, { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } });
}
