import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_VIDEO_BUCKET;
const expiresIn = Number(process.env.VIDEO_LINK_EXPIRES_SECONDS || 604800);

const videos = {
  "979": {
    label: "T2 Punaauia",
    path: "979/video-6d8f3c9a.m4v"
  },
  "971": {
    label: "T3 Punaauia",
    path: "971/video-b4e2a917.m4v"
  },
  "888": {
    label: "T2 Paofai",
    path: "888/video-91c7ad35.m4v"
  }
};

const requested = process.argv[2];
const signatureConfirmed = process.argv.includes("--signed-confirmed");

if (!requested || (!videos[requested] && requested !== "all")) {
  console.error("Usage: npm run video-link -- 979 --signed-confirmed");
  console.error("Refs disponibles: 979, 971, 888, all");
  process.exit(1);
}

if (!signatureConfirmed) {
  console.error("SECURITE: lien video refuse.");
  console.error("Genere ce lien uniquement APRES signature du bon de visite Documenso.");
  console.error("Quand la signature est verifiee, relance avec: --signed-confirmed");
  process.exit(1);
}

function signUrl(path) {
  return `${supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function createSignedLink(reference, video) {
  const response = await fetch(signUrl(video.path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Impossible de signer ${reference} (${response.status}): ${details}`);
  }

  const result = await response.json();
  const signedPath = result.signedURL || result.signedUrl || result.signed_url;
  if (!signedPath) throw new Error(`Reponse Supabase inattendue pour ${reference}: ${JSON.stringify(result)}`);

  const signedUrl = signedPath.startsWith("http") ? signedPath : `${supabaseUrl}/storage/v1${signedPath}`;
  return { reference, label: video.label, path: video.path, signedUrl };
}

const references = requested === "all" ? Object.keys(videos) : [requested];
const createdAt = new Date();
const expiresAt = new Date(createdAt.getTime() + expiresIn * 1000);
const links = [];

for (const reference of references) {
  links.push(await createSignedLink(reference, videos[reference]));
}

const output = [
  `Liens video prives generes le ${createdAt.toISOString()}`,
  `Expiration: ${expiresAt.toISOString()}`,
  ""
];

for (const link of links) {
  output.push(`${link.reference} - ${link.label}`);
  output.push(link.signedUrl);
  output.push("");
}

const privateDir = join(root, "private-links");
mkdirSync(privateDir, { recursive: true });
const outputPath = join(privateDir, `video-links-${createdAt.toISOString().replace(/[:.]/g, "-")}.txt`);
writeFileSync(outputPath, output.join("\n"));

console.log(output.join("\n"));
console.log(`Copie locale: ${outputPath}`);
