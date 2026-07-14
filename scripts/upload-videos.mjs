import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function loadLocalEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const name = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (name && process.env[name] === undefined) process.env[name] = value;
  }
}

loadLocalEnv();

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_VIDEO_BUCKET"];
const missing = requiredEnv.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Variables manquantes: ${missing.join(", ")}`);
  console.error("Renseigne-les dans ton terminal ou dans les secrets de ton environnement.");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_VIDEO_BUCKET;
const sourceDir = process.env.VIDEO_SOURCE_DIR || join(root, "private-videos");
const upsert = process.env.SUPABASE_UPLOAD_UPSERT !== "false";

const videos = [
  {
    reference: "979",
    label: "T2 Punaauia",
    files: [
      { source: "979-t2-punaauia.mp4.mov", destination: "979/visite-video.mov" },
      { source: "979-t2-punaauia.mov", destination: "979/visite-video.mov" },
      { source: "979-t2-punaauia.m4v", destination: "979/video-6d8f3c9a.m4v" },
      { source: "979-t2-punaauia.mp4", destination: "979/visite-video.mp4" }
    ]
  },
  {
    reference: "971",
    label: "T3 Punaauia",
    files: [
      { source: "971-t3-punaauia.mp4.mov", destination: "971/visite-video.mov" },
      { source: "971-t3-punaauia.mov", destination: "971/visite-video.mov" },
      { source: "971-t3-punaauia.m4v", destination: "971/video-b4e2a917.m4v" },
      { source: "971-t3-punaauia.mp4", destination: "971/visite-video.mp4" }
    ]
  },
  {
    reference: "888",
    label: "T2 Paofai",
    files: [
      { source: "888-t2-paofai.mp4.mov", destination: "888/visite-video.mov" },
      { source: "888-t2-paofai.mov", destination: "888/visite-video.mov" },
      { source: "888-t2-paofai.m4v", destination: "888/video-91c7ad35.m4v" },
      { source: "888-t2-paofai.mp4", destination: "888/visite-video.mp4" }
    ]
  }
];

function contentTypeFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".m4v") return "video/x-m4v";
  if (ext === ".webm") return "video/webm";
  return "video/mp4";
}

function directStorageEndpoint() {
  const projectId = new URL(supabaseUrl).hostname.split(".")[0];
  return `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
}

function uploadMetadata(metadata) {
  return Object.entries(metadata)
    .map(([key, value]) => `${key} ${Buffer.from(String(value)).toString("base64")}`)
    .join(",");
}

async function createResumableUpload(destination, contentType, size) {
  const response = await fetch(directStorageEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(size),
      "Upload-Metadata": uploadMetadata({
        bucketName: bucket,
        objectName: destination,
        contentType,
        cacheControl: "3600"
      }),
      "x-upsert": String(upsert)
    }
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Creation upload resumable impossible (${response.status}): ${details}`);
  }

  const location = response.headers.get("location");
  if (!location) throw new Error("Supabase n'a pas renvoye d'URL resumable.");

  return location.startsWith("http") ? location : new URL(location, directStorageEndpoint()).href;
}

async function uploadResumable(filePath, destination, contentType, size) {
  const uploadUrl = await createResumableUpload(destination, contentType, size);
  const chunkSize = 6 * 1024 * 1024;
  const fd = openSync(filePath, "r");
  let offset = 0;

  try {
    while (offset < size) {
      const length = Math.min(chunkSize, size - offset);
      const buffer = Buffer.allocUnsafe(length);
      const bytesRead = readSync(fd, buffer, 0, length, offset);
      const chunk = bytesRead === buffer.length ? buffer : buffer.subarray(0, bytesRead);

      const response = await fetch(uploadUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(offset),
          "Content-Type": "application/offset+octet-stream"
        },
        body: chunk
      });

      if (!response.ok) {
        const details = await response.text().catch(() => "");
        throw new Error(`Chunk refuse a ${offset} octets (${response.status}): ${details}`);
      }

      const nextOffset = Number(response.headers.get("upload-offset"));
      offset = Number.isFinite(nextOffset) && nextOffset > offset ? nextOffset : offset + bytesRead;
      const percent = ((offset / size) * 100).toFixed(1);
      process.stdout.write(`\r  ${percent}%`);
    }

    process.stdout.write("\n");
  } finally {
    closeSync(fd);
  }
}

async function upload(video) {
  const pickedFile = video.files.find((file) => existsSync(join(sourceDir, file.source)));

  if (!pickedFile) {
    console.warn(`Fichier absent pour ${video.reference}: ${video.files.map((file) => file.source).join(", ")}`);
    return { skipped: true, video };
  }

  const filePath = join(sourceDir, pickedFile.source);
  const size = statSync(filePath).size;

  console.log(`Upload ${video.reference} - ${video.label}: ${basename(filePath)} (${Math.round(size / 1024 / 1024)} Mo)`);

  await uploadResumable(filePath, pickedFile.destination, contentTypeFor(filePath), size);

  console.log(`OK ${video.reference} -> ${bucket}/${pickedFile.destination}`);
  return { skipped: false, video };
}

console.log(`Bucket: ${bucket}`);
console.log(`Dossier local: ${sourceDir}`);
console.log(`Upsert: ${upsert ? "oui" : "non"}`);

let uploaded = 0;
let skipped = 0;

for (const video of videos) {
  const result = await upload(video);
  if (result.skipped) skipped += 1;
  else uploaded += 1;
}

console.log(`Termine: ${uploaded} upload(s), ${skipped} fichier(s) absent(s).`);
