import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { slotStarted } from "@/lib/availability";
import { PROOF_MAX_BYTES, PROOF_TYPES, proofPrefix, ownTask } from "@/lib/tugas";

// Client-upload token endpoint. Only the employee who owns the task, while it is
// IN_PROGRESS, gets a token, restricted to this task's path, image types, 5 MB.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum login" }, { status: 401 });
  if (user.role !== "staff") return Response.json({ error: "Dilarang" }, { status: 403 });

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
          id = Number((JSON.parse(clientPayload ?? "{}") as { idAssignment?: unknown }).idAssignment);
        } catch {
          // falls through to the validity check below
        }
        if (!Number.isInteger(id) || id < 1) throw new Error("Tugas tidak valid");

        const task = await ownTask(id, user.id_user);
        if (!task) throw new Error("Tugas tidak ditemukan");
        if (task.booking.status !== "IN_PROGRESS") throw new Error("Bukti hanya bisa diunggah saat status Sedang dikerjakan");
        if (!slotStarted(task.booking.slot.date, task.booking.slot.start_time)) throw new Error("Pekerjaan belum bisa diselesaikan sebelum jadwal dimulai");
        if (!pathname.startsWith(proofPrefix(id)) || pathname.includes("..")) throw new Error("Path tidak valid");

        return { allowedContentTypes: PROOF_TYPES, maximumSizeInBytes: PROOF_MAX_BYTES, addRandomSuffix: true };
      },
    });
    return Response.json(res);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Gagal" }, { status: 400 });
  }
}
