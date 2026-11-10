import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Private proof photos are only served through here, after a session check:
// admin, or the employee the task is assigned to.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "admin" && user.role !== "staff") return new Response("Forbidden", { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });

  const proof = await prisma.workProof.findUnique({
    where: { id_proof: id },
    select: { photo_url: true, assignment: { select: { id_staff: true } } },
  });
  if (!proof || (user.role === "staff" && proof.assignment.id_staff !== user.id_user)) return new Response("Not found", { status: 404 });

  const blob = await get(proof.photo_url, { access: "private" });
  if (!blob || blob.statusCode !== 200) return new Response("Not found", { status: 404 });

  return new Response(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
