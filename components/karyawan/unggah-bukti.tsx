"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { submitProof } from "@/lib/actions/tugas";
import { Alert, Button, Textarea } from "@/components/ui";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

/** Photos are uploaded straight from the browser to Vercel Blob (private), then their pathname is sent to the server. */
export function UploadProof({ idAssignment }: { idAssignment: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [remarks, setRemarks] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function choose(list: FileList | null) {
    const arr = Array.from(list ?? []);
    setError(undefined);
    if (arr.length > MAX_FILES) return setError(`Maksimal ${MAX_FILES} foto`);
    if (arr.some((f) => !ALLOWED_TYPES.includes(f.type))) return setError("Hanya JPG, PNG, atau WebP");
    if (arr.some((f) => f.size > MAX_BYTES)) return setError("Ukuran tiap foto maksimal 5 MB");
    setFiles(arr);
  }

  async function submit() {
    if (files.length === 0) return setError("Pilih minimal 1 foto");
    setPending(true);
    setError(undefined);
    try {
      const pathnames: string[] = [];
      for (const f of files) {
        const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const blob = await upload(`bukti/${idAssignment}/foto.${ext}`, f, {
          access: "private",
          handleUploadUrl: "/api/bukti/upload",
          clientPayload: JSON.stringify({ idAssignment }),
        });
        pathnames.push(blob.pathname);
      }
      const res = await submitProof({ idAssignment, pathnames, remarks: remarks.trim() || undefined });
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <label className="flex flex-col gap-2 text-sm font-medium">
        Foto bukti (JPG/PNG/WebP, maks 5 MB, hingga {MAX_FILES} foto)
        <input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          disabled={pending}
          onChange={(e) => choose(e.target.files)}
          className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-on-primary-soft"
        />
      </label>
      {files.length > 0 && <p className="text-sm text-muted">{files.length} foto dipilih</p>}
      <Textarea label="Keterangan (opsional)" rows={3} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      <Button onClick={submit} loading={pending} disabled={files.length === 0}>
        Unggah dan tandai selesai
      </Button>
    </div>
  );
}
