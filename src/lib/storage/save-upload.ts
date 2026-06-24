import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface SavedUpload {
  name: string;
  size: number;
  url: string;
}

export interface UploadPayload {
  name: string;
  size: number;
  dataBase64: string;
}

export async function saveBase64Upload(
  name: string,
  size: number,
  dataBase64: string,
): Promise<SavedUpload> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
  const key = `${Date.now()}-${randomBytes(4).toString("hex")}-${safe}`;
  const buf = Buffer.from(dataBase64, "base64");
  await writeFile(path.join(dir, key), buf);
  return { name, size: size || buf.length, url: `/uploads/${key}` };
}

export async function saveUploadBatch(uploads: UploadPayload[]): Promise<SavedUpload[]> {
  if (!uploads.length) return [];
  return Promise.all(uploads.map((u) => saveBase64Upload(u.name, u.size, u.dataBase64)));
}
