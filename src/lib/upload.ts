/**
 * Güvenli dosya yükleme: tür, imza (magic bytes) ve boyut kontrolü. Dosya adları kullanıcıdan alınmaz;
 * dosyalar public klasörü dışında saklanır ve yalnızca sahibine yetkili bir uç noktadan sunulur.
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "./api";

export const ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type AllowedMime = keyof typeof ALLOWED_TYPES;
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

export function maxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB || 8);
  return Math.max(1, Math.min(20, mb)) * 1024 * 1024;
}

/** Dosya içeriğinin ilk baytlarına bakarak gerçek türü belirler (uzantı/başlık taklidine karşı). */
export function sniffImageType(buf: Uint8Array): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "image/png";
  const riff = String.fromCharCode(...buf.slice(0, 4)), webp = String.fromCharCode(...buf.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";
  return null;
}

export async function validateImageFile(file: File | null): Promise<{ buffer: Buffer; mimeType: AllowedMime; originalName: string }> {
  if (!file || typeof file === "string") throw new ApiError(400, "Lütfen bir fotoğraf seçin.", "NO_FILE");
  if (file.size === 0) throw new ApiError(400, "Dosya boş.", "EMPTY_FILE");
  if (file.size > maxUploadBytes()) {
    throw new ApiError(413, `Dosya boyutu en fazla ${maxUploadBytes() / 1024 / 1024} MB olabilir.`, "FILE_TOO_LARGE");
  }
  const ext = path.extname(file.name || "").toLowerCase();
  if (ext && !ALLOWED_EXT.includes(ext)) throw new ApiError(415, "Yalnızca JPG, JPEG, PNG ve WEBP dosyaları desteklenir.", "BAD_TYPE");
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffImageType(buffer);
  if (!mimeType) throw new ApiError(415, "Dosya geçerli bir JPG, PNG veya WEBP görseli değil.", "BAD_TYPE");
  const originalName = (file.name || "foto").replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 100) || "foto";
  return { buffer, mimeType, originalName };
}

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

function filePath(userId: string, analysisId: string, mime: string) {
  const ext = ALLOWED_TYPES[mime as AllowedMime] ?? "bin";
  // Kimlikler cuid/uuid biçimindedir; yine de yol enjeksiyonuna karşı temizlenir
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(uploadRoot(), safe(userId), `${safe(analysisId)}.${ext}`);
}

export async function saveUpload(userId: string, analysisId: string, mime: string, buffer: Buffer) {
  const p = filePath(userId, analysisId, mime);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, buffer, { mode: 0o600 });
}

export async function readUpload(userId: string, analysisId: string, mime: string) {
  return readFile(filePath(userId, analysisId, mime));
}

/** Kullanıcının yüklediği tüm dosyaları siler (hesap silindiğinde). */
export async function deleteUserUploads(userId: string) {
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) return;
  await rm(path.join(uploadRoot(), safe), { recursive: true, force: true });
}
