import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Octokit } from "@octokit/rest";
import ExcelJS from "exceljs";
import nodemailer from "nodemailer";

// Excel is the application database. GitHub is the private persistent store.
// IMPORTANT: use a PRIVATE repository. Never put GITHUB_TOKEN in React/Vite code.

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const EXCEL_PATH = "data/candidatures-gala-2027.xlsx";
const DOCUMENT_ROOT = "data/documents";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "gala@mirs.qc.ca";

if (!OWNER || !REPO || !TOKEN || !ADMIN_PASSWORD) {
  console.warn("Configuration incomplète: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN et ADMIN_PASSWORD sont requis.");
}

const octokit = new Octokit({ auth: TOKEN });
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : true }));
app.use(express.json({ limit: "60mb" }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "..", "dist");


function mailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

function escHtml(v) {
  return String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
}

async function sendSubmissionEmails(body, ref) {
  const transport = mailer();
  if (!transport) return { sent: false, reason: "SMTP non configuré" };
  const subject = `Gala Black Excellence Noire — candidature ${ref}`;
  const html = `
    <h2>Candidature reçue — ${escHtml(ref)}</h2>
    <p><strong>Nom :</strong> ${escHtml(body.name)}</p>
    <p><strong>Prix :</strong> ${escHtml(body.prize)}</p>
    <p><strong>Organisation :</strong> ${escHtml(body.org)}</p>
    <p><strong>Ville :</strong> ${escHtml(body.city)}</p>
    <p><strong>Courriel :</strong> ${escHtml(body.email)}</p>
    <p><strong>Téléphone :</strong> ${escHtml(body.tel)}</p>
    <p><strong>Documents :</strong> ${(body.files || []).length}</p>
    <p>Le dossier complet est enregistré dans le fichier Excel sécurisé et les documents dans le dépôt GitHub privé.</p>`;

  await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: CONTACT_EMAIL, subject, html });
  if (body.email) {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER, to: body.email,
      subject: `Votre candidature ${ref} — Gala Black Excellence Noire`,
      html: `<p>Nous confirmons la réception de votre candidature.</p><p><strong>Numéro de référence : ${escHtml(ref)}</strong></p><p>Conservez ce numéro pour toute communication.</p>`
    });
  }
  return { sent: true };
}

function b64ToBuffer(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl || "");
  if (!match) throw new Error("Fichier encodé invalide");
  return Buffer.from(match[2], "base64");
}

function safeName(name) {
  return String(name || "document").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

function makeToken() {
  const payload = Buffer.from(JSON.stringify({
    exp: Date.now() + 8 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString("hex")
  })).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const [payload, sig] = String(token || "").split(".");
    if (!payload || !sig) return false;
    const expected = crypto.createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch { return false; }
}

function requireAdmin(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!verifyToken(token)) return res.status(401).json({ error: "Non autorisé" });
  next();
}

async function getFile(filePath) {
  const r = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: filePath, ref: BRANCH });
  if (Array.isArray(r.data) || !r.data.content) throw new Error(`Fichier GitHub introuvable: ${filePath}`);
  return { sha: r.data.sha, buffer: Buffer.from(r.data.content, "base64") };
}

async function putFile(filePath, buffer, message, sha) {
  const params = {
    owner: OWNER, repo: REPO, path: filePath, branch: BRANCH,
    message, content: buffer.toString("base64")
  };
  if (sha) params.sha = sha;
  return octokit.repos.createOrUpdateFileContents(params);
}

async function ensureWorkbook() {
  try { return await getFile(EXCEL_PATH); }
  catch (e) {
    if (e.status !== 404) throw e;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Candidatures");
    ws.columns = [
      { header: "Référence", key: "ref", width: 18 },
      { header: "Date", key: "at", width: 24 },
      { header: "Langue", key: "lang", width: 10 },
      { header: "Prix", key: "prize", width: 18 },
      { header: "Nom", key: "name", width: 28 },
      { header: "Organisation", key: "org", width: 28 },
      { header: "Ville", key: "city", width: 20 },
      { header: "Courriel", key: "email", width: 30 },
      { header: "Téléphone", key: "tel", width: 20 },
      { header: "Lien", key: "link", width: 45 },
      { header: "Âge", key: "age", width: 10 },
      { header: "Déposé par", key: "self", width: 20 },
      { header: "Nom proposant", key: "propName", width: 28 },
      { header: "Courriel proposant", key: "propEmail", width: 30 },
      { header: "Parcours", key: "path", width: 60 },
      { header: "Racines", key: "root", width: 60 },
      { header: "Audace", key: "bold", width: 60 },
      { header: "Liens supplémentaires", key: "links", width: 45 },
      { header: "Références", key: "refs", width: 45 },
      { header: "Documents", key: "documents", width: 60 }
    ];
    const docs = wb.addWorksheet("Documents");
    docs.columns = [
      { header: "Référence", key: "ref", width: 18 },
      { header: "Nom", key: "name", width: 35 },
      { header: "Type", key: "type", width: 35 },
      { header: "Taille", key: "size", width: 15 },
      { header: "Chemin GitHub", key: "path", width: 80 },
      { header: "Date", key: "at", width: 24 }
    ];
    ws.getRow(1).font = { bold: true };
    docs.getRow(1).font = { bold: true };
    const out = Buffer.from(await wb.xlsx.writeBuffer());
    await putFile(EXCEL_PATH, out, "Initialiser la base Excel du Gala", undefined);
    return await getFile(EXCEL_PATH);
  }
}

async function readWorkbook() {
  const f = await ensureWorkbook();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(f.buffer);
  return { wb, sha: f.sha };
}

function rowToObject(row, headers) {
  const o = {};
  headers.forEach((h, i) => { o[h] = row.getCell(i + 1).value ?? ""; });
  return o;
}

async function listCandidatures() {
  const { wb } = await readWorkbook();
  const ws = wb.getWorksheet("Candidatures");
  const headers = ws.getRow(1).values.slice(1).map(v => String(v || ""));
  const rows = [];
  ws.eachRow((row, n) => {
    if (n === 1 || !row.getCell(1).value) return;
    const x = rowToObject(row, headers);
    const docs = String(x.Documents || "").split(" || ").filter(Boolean).map(s => {
      const [name, type, size, filePath] = s.split("@@");
      return { name, type, size: Number(size || 0), path: filePath };
    });
    rows.push({
      ref: x.Référence, at: x.Date, lang: x.Langue, prize: x.Prix, name: x.Nom,
      org: x.Organisation, city: x.Ville, email: x.Courriel, tel: x.Téléphone,
      link: x.Lien, age: x.Âge, self: x["Déposé par"] === "soi-meme", propName: x["Nom proposant"],
      propEmail: x["Courriel proposant"], path: x.Parcours, root: x.Racines, bold: x.Audace,
      links: x["Liens supplémentaires"], refs: x.Références, files: docs
    });
  });
  rows.sort((a, b) => String(a.at) < String(b.at) ? 1 : -1);
  return rows;
}

function nextRef(wb) {
  const ws = wb.getWorksheet("Candidatures");
  let max = 0;
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const m = String(row.getCell(1).value || "").match(/^GBE2027-(\d{6})$/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `GBE2027-${String(max + 1).padStart(6, "0")}`;
}

async function saveSubmission(body) {
  // Retry on GitHub SHA conflicts caused by two submissions arriving close together.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { wb, sha } = await readWorkbook();
    const ref = nextRef(wb);
    const ws = wb.getWorksheet("Candidatures");
    const docs = wb.getWorksheet("Documents");
    const at = new Date().toISOString();
    const storedDocs = [];

    for (const f of body.files || []) {
      const data = b64ToBuffer(f.data);
      const filePath = `${DOCUMENT_ROOT}/${ref}/${safeName(f.name)}`;
      await putFile(filePath, data, `Ajouter document ${ref} - ${safeName(f.name)}`, undefined);
      storedDocs.push({ name: f.name, type: f.type, size: f.size, path: filePath });
      docs.addRow({ ref, name: f.name, type: f.type, size: f.size, path: filePath, at });
    }

    ws.addRow({
      ref, at, lang: body.lang || "fr", prize: body.prize || "", name: body.name || "",
      org: body.org || "", city: body.city || "", email: body.email || "", tel: body.tel || "",
      link: body.link ? `${body.link}${body.linkP ? ` - ${body.linkP}` : ""}` : "", age: body.age || "",
      self: body.self ? "soi-meme" : "proposant", propName: body.propName || "", propEmail: body.propEmail || "",
      path: body.path || "", root: body.root || "", bold: body.bold || "", links: body.links || "",
      refs: body.refs || "", documents: storedDocs.map(f => [f.name, f.type, f.size, f.path].join("@@")).join(" || ")
    });

    const out = Buffer.from(await wb.xlsx.writeBuffer());
    try {
      await putFile(EXCEL_PATH, out, `Enregistrer candidature ${ref}`, sha);
      return { ref };
    } catch (e) {
      if (e.status === 409 || e.status === 422) continue;
      throw e;
    }
  }
  throw new Error("Conflit GitHub: plusieurs soumissions simultanées. Réessayez.");
}

app.get("/api/health", (_req, res) => res.json({ ok: true, excel: EXCEL_PATH }));

app.post("/api/submit", async (req, res) => {
  try {
    if (!req.body?.name || !req.body?.prize) return res.status(400).json({ error: "Données de candidature incomplètes" });
    const result = await saveSubmission(req.body);
    let email = { sent: false };
    try { email = await sendSubmissionEmails(req.body, result.ref); } catch (mailError) { console.error("Email error", mailError); }
    res.json({ ...result, email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible d'enregistrer la candidature" });
  }
});

app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD || req.body?.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Code incorrect" });
  res.json({ token: makeToken() });
});

app.get("/api/admin/candidatures", requireAdmin, async (_req, res) => {
  try { res.json(await listCandidatures()); }
  catch (e) { console.error(e); res.status(500).json({ error: "Lecture Excel impossible" }); }
});

app.get("/api/admin/document", requireAdmin, async (req, res) => {
  try {
    const filePath = String(req.query.path || "");
    if (!filePath.startsWith(`${DOCUMENT_ROOT}/`) || filePath.includes("..")) return res.status(400).end();
    const f = await getFile(filePath);
    const name = path.basename(filePath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.send(f.buffer);
  } catch (e) { console.error(e); res.status(404).end(); }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => console.log(`Gala server listening on port ${PORT}`));
