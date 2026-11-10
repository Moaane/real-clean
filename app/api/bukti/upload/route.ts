import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { slotSudahMulai } from "@/lib/availability";
import { BUKTI_MAKS_BYTE, BUKTI_TIPE, prefixBukti, tugasMilik } from "@/lib/tugas";

// Client-upload token endpoint. Only the employee who owns the task, while it is
// DIKERJAKAN, gets a token, restricted to this task's path, image types, 5 MB.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum login" }, { status: 401 });
  if (user.role !== "karyawan") return Response.json({ error: "Dilarang" }, { status: 403 });

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  try {
    const res = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let id = NaN;
        try {
          id = Number((JSON.parse(clientPayload ?? "{}") as { idPenugasan?: unknown }).idPenugasan);
        } catch {
          // falls through to the validity check below
        }
        if (!Number.isInteger(id) || id < 1) throw new Error("Tugas tidak valid");

        const tugas = await tugasMilik(id, user.id_user);
        if (!tugas) throw new Error("Tugas tidak ditemukan");
        if (tugas.booking.status !== "DIKERJAKAN") throw new Error("Bukti hanya bisa diunggah saat status Sedang dikerjakan");
        if (!slotSudahMulai(tugas.booking.slot.tanggal, tugas.booking.slot.jam_mulai)) throw new Error("Pekerjaan belum bisa diselesaikan sebelum jadwal dimulai");
        if (!pathname.startsWith(prefixBukti(id)) || pathname.includes("..")) throw new Error("Path tidak valid");

        return { allowedContentTypes: BUKTI_TIPE, maximumSizeInBytes: BUKTI_MAKS_BYTE, addRandomSuffix: true };
      },
    });
    return Response.json(res);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Gagal" }, { status: 400 });
  }
}
