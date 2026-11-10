import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Private proof photos are only served through here, after a session check:
// admin, or the employee the task is assigned to.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "admin" && user.role !== "karyawan") return new Response("Forbidden", { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });

  const bukti = await prisma.buktiKerja.findUnique({
    where: { id_bukti: id },
    select: { foto_url: true, penugasan: { select: { id_karyawan: true } } },
  });
  if (!bukti || (user.role === "karyawan" && bukti.penugasan.id_karyawan !== user.id_user)) return new Response("Not found", { status: 404 });

  const blob = await get(bukti.foto_url, { access: "private" });
  if (!blob || blob.statusCode !== 200) return new Response("Not found", { status: 404 });

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
