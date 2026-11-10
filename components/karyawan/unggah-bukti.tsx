"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { kirimBukti } from "@/lib/actions/tugas";
import { Alert, Button, Textarea } from "@/components/ui";

const TIPE = ["image/jpeg", "image/png", "image/webp"];
const MAKS_BYTE = 5 * 1024 * 1024;
const MAKS_FILE = 5;

/** Foto diunggah langsung dari browser ke Vercel Blob (private), lalu pathname-nya dikirim ke server. */
export function UnggahBukti({ idPenugasan }: { idPenugasan: number }) {
  const [files, setFiles] = useState<File[]>([]);
  const [keterangan, setKeterangan] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function pilih(list: FileList | null) {
    const arr = Array.from(list ?? []);
    setError(undefined);
    if (arr.length > MAKS_FILE) return setError(`Maksimal ${MAKS_FILE} foto`);
    if (arr.some((f) => !TIPE.includes(f.type))) return setError("Hanya JPG, PNG, atau WebP");
    if (arr.some((f) => f.size > MAKS_BYTE)) return setError("Ukuran tiap foto maksimal 5 MB");
    setFiles(arr);
  }

  async function kirim() {
    if (files.length === 0) return setError("Pilih minimal 1 foto");
    setPending(true);
    setError(undefined);
    try {
      const pathnames: string[] = [];
      for (const f of files) {
        const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
        const blob = await upload(`bukti/${idPenugasan}/foto.${ext}`, f, {
          access: "private",
          handleUploadUrl: "/api/bukti/upload",
          clientPayload: JSON.stringify({ idPenugasan }),
        });
        pathnames.push(blob.pathname);
      }
      const res = await kirimBukti({ idPenugasan, pathnames, keterangan: keterangan.trim() || undefined });
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
        Foto bukti (JPG/PNG/WebP, maks 5 MB, hingga {MAKS_FILE} foto)
        <input
          type="file"
          accept={TIPE.join(",")}
          multiple
          disabled={pending}
          onChange={(e) => pilih(e.target.files)}
          className="block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-semibold file:text-on-primary-soft"
        />
      </label>
      {files.length > 0 && <p className="text-sm text-muted">{files.length} foto dipilih</p>}
      <Textarea label="Keterangan (opsional)" rows={3} maxLength={500} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
      <Button onClick={kirim} loading={pending} disabled={files.length === 0}>
        Unggah dan tandai selesai
      </Button>
    </div>
  );
}
