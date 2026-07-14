import { existsSync, readFileSync } from "node:fs";
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

function option(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

loadLocalEnv();

const reference = process.argv[2];
const functionUrl = process.env.VIDEO_VISIT_FUNCTION_URL;
const adminSecret = process.env.VIDEO_VISIT_ADMIN_SECRET;

if (!reference) {
  console.error("Usage: npm run video-invite -- 979");
  console.error("Option nominative: npm run video-invite -- 979 --name=\"Prenom Nom\" --email=\"client@email.com\" --phone=\"+689...\"");
  process.exit(1);
}

if (!functionUrl || !adminSecret) {
  console.error("Variables manquantes: VIDEO_VISIT_FUNCTION_URL, VIDEO_VISIT_ADMIN_SECRET");
  process.exit(1);
}

const response = await fetch(functionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-secret": adminSecret
  },
  body: JSON.stringify({
    action: "admin-create-invitation",
    reference,
    fullName: option("name"),
    email: option("email"),
    phone: option("phone")
  })
});

const data = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(data.error || "Impossible de creer l'invitation.");
  process.exit(1);
}

console.log("Invitation privee creee.");
console.log(`Expire le: ${data.expiresAt}`);
console.log(data.invitationUrl);
