import { useState, useEffect, useRef, createContext, useContext } from "react";

/* ==================================================================
   Gala Black Excellence Noire — 4e édition
   Formulaire de mise en candidature · prototype fonctionnel
   Charte : cahier de communication bilingue 2027
   Palette bleu nuit / bleu royal / orange / vert / champagne / ivoire
   Police unique Times New Roman
   Bandeau de marque bilingue apparié, formulaire au choix de la langue
   ================================================================== */

const CONTACT = "gala@mirs.qc.ca";
const PARTNERS = "SSBCA · ESEA · VIC · MDJ LPO · MIRS";

const C = {
  nuit: "#0D1B3D",
  royal: "#1F4E9A",
  orange: "#C45A1A",
  vert: "#2C7A4B",
  champagne: "#C7A84A",
  ivoire: "#F7F1E4",
  blanc: "#FFFFFF",
  trait: "#DCD3C0",
  second: "#4A5060",
  alerte: "#8E2A22",
};

const CSS = `
*{box-sizing:border-box}
.g{font-family:"Times New Roman",Times,Georgia,serif;color:${C.nuit};background:${C.ivoire};min-height:100%;font-size:17px;line-height:1.55}
.g button{font-family:inherit;cursor:pointer;border:none}
.g button:focus-visible,.g input:focus-visible,.g textarea:focus-visible{outline:3px solid ${C.champagne};outline-offset:2px}
.wrap{max-width:1060px;margin:0 auto;padding:0 22px}
.fld{width:100%;padding:10px 12px;border:1px solid ${C.trait};border-radius:2px;font:inherit;font-size:17px;background:${C.blanc};color:${C.nuit}}
.fld:focus{border-color:${C.royal}}
.fld[aria-invalid="true"]{border-color:${C.alerte};background:#FCF4F2}
.muted{color:${C.second}}
.hint{font-size:15px;color:${C.second};margin-top:5px;line-height:1.5}
.err{font-size:15px;color:${C.alerte};margin-top:5px}
.row{margin-bottom:22px}
.card{background:${C.blanc};border:1px solid ${C.trait}}
.pick{display:block;width:100%;text-align:left;background:${C.blanc};border:1px solid ${C.trait};padding:16px 18px;margin-bottom:11px}
.pick:hover{border-color:${C.royal}}
.pick[data-on="1"]{border-color:${C.royal};box-shadow:inset 4px 0 0 ${C.royal}}
.btn{padding:11px 24px;font-size:17px;border-radius:2px}
.btnP{background:${C.nuit};color:${C.ivoire}}
.btnP:hover{background:${C.royal}}
.btnP:disabled{background:#9A9DA8;cursor:not-allowed}
.btnS{background:transparent;color:${C.nuit};border:1px solid ${C.trait}}
.btnS:hover{border-color:${C.nuit}}
.lnk{background:none;color:${C.royal};text-decoration:underline;padding:0;font-size:inherit}
.railI{display:flex;gap:11px;padding:9px 0;color:${C.second};align-items:flex-start;font-size:16px}
.railI[data-on="1"]{color:${C.nuit}}
.dot{width:8px;height:8px;background:${C.trait};margin-top:7px;flex:none}
.railI[data-on="1"] .dot{background:${C.orange}}
.railI[data-done="1"] .dot{background:${C.vert}}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.tbl{width:100%;border-collapse:collapse;font-size:16px}
.tbl th{text-align:left;padding:9px 11px;background:${C.nuit};color:${C.ivoire};font-weight:normal}
.tbl td{padding:9px 11px;border-bottom:1px solid ${C.trait};vertical-align:top}
.rule{height:3px;background:${C.orange}}
.note{border-left:3px solid ${C.champagne};padding:11px 14px;font-size:16px;line-height:1.5}
.warn{border-left:3px solid ${C.alerte};background:#FCF4F2;padding:12px 15px;font-size:16px;line-height:1.5}
@media(max-width:820px){.grid2{grid-template-columns:1fr}.cols{grid-template-columns:1fr!important;gap:26px!important}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;

/* ------------------------ langue d'affichage ---------------------- */
const Lang = createContext("fr");
const useLang = () => useContext(Lang);
/* p = pick : renvoie la version de la langue choisie */
function usePick() { const l = useLang(); return (o) => (o && o[l] !== undefined ? o[l] : ""); }

/* ---------------------------- contenu ----------------------------- */

const PRIZES = [
  {
    id: "resilience", fr: "Résilience", en: "Resilience", color: C.vert, target: 10,
    d: {
      fr: "Une personne ou une organisation qui a surmonté des défis importants tout en restant déterminée et engagée envers sa communauté.",
      en: "A person or organization that has overcome significant challenges while remaining determined and committed to their community.",
    },
  },
  {
    id: "impact", fr: "Impact", en: "Impact", color: C.royal, target: 18,
    d: {
      fr: "Une personne ou une organisation dont les actions ont eu un effet social, économique ou culturel marquant et durable sur la Rive-Sud.",
      en: "A person or organization whose actions have had a lasting social, economic or cultural effect on the South Shore.",
    },
  },
  {
    id: "prospect", fr: "Prospect", en: "Prospect", color: C.orange, target: 12,
    d: {
      fr: "Une personne de 15 à 30 ans qui, par son engagement et ses actions, incarne l'avenir de la communauté afrodescendante.",
      en: "A person aged 15 to 30 who, through their commitment and actions, embodies the future of the Afrodescendant community.",
    },
  },
];

const STEPS = [
  { fr: "Catégorie", en: "Award" },
  { fr: "La personne", en: "The person" },
  { fr: "Le récit", en: "The story" },
  { fr: "Appuis et consentement", en: "Support and consent" },
  { fr: "Révision", en: "Review" },
];

const LINKS = [
  { fr: "Elle y réside", en: "They live there" },
  { fr: "Elle y travaille", en: "They work there" },
  { fr: "Elle y mène son action", en: "Their work happens there" },
  { fr: "Autre lien", en: "Another connection" },
];
const AWARE = [
  { fr: "Oui", en: "Yes" },
  { fr: "Non, ce serait une surprise", en: "No, it would be a surprise" },
  { fr: "Je dépose ma propre candidature", en: "I am nominating myself" },
];
const YESNO = [{ fr: "Non", en: "No" }, { fr: "Oui", en: "Yes" }];

const D = {
  switch: { fr: "English", en: "Français" },
  committee: { fr: "Accès comité", en: "Committee access" },
  edition: { fr: "4e édition — samedi 30 janvier 2027, Centre socioculturel Alphonse-Lepage", en: "4th edition — Saturday, January 30, 2027, Centre socioculturel Alphonse-Lepage" },
  homeT: { fr: "Proposez une personne dont le parcours mérite d'être reconnu", en: "Nominate someone whose journey deserves recognition" },
  homeP: { fr: "Le dépôt prend une vingtaine de minutes. Vous pouvez interrompre et reprendre plus tard : votre texte et vos documents sont conservés.", en: "It takes about twenty minutes. You can stop and come back later: your text and documents are kept." },
  period: { fr: "Candidatures du 15 septembre au 30 novembre 2026.", en: "Nominations from September 15 to November 30, 2026." },
  start: { fr: "Commencer", en: "Start" },
  resumeB: { fr: "Reprendre mon brouillon", en: "Resume my draft" },
  byPhone: { fr: `Vous préférez déposer par téléphone ? Écrivez à ${CONTACT} et une personne du comité remplira le formulaire avec vous.`, en: `Prefer to do this by phone? Write to ${CONTACT} and someone from the committee will fill out the form with you.` },
  prizesT: { fr: "Les prix compétitifs", en: "The competitive awards" },
  hommage: { fr: `Le prix Hommage est une reconnaissance non compétitive du comité. Il ne fait pas l'objet d'un appel public; les suggestions se transmettent à ${CONTACT}.`, en: `The Hommage award is a non-competitive recognition by the committee. It is not open to public nomination; suggestions go to ${CONTACT}.` },
  s0: { fr: "Pour quel prix proposez-vous cette candidature ?", en: "Which award are you nominating this person for?" },
  s1: { fr: "La personne mise en candidature", en: "The person being nominated" },
  s2: { fr: "Le récit", en: "The story" },
  s2p: { fr: "Écrivez simplement, comme vous le raconteriez à quelqu'un. Le jury cherche des faits concrets, pas de belles phrases.", en: "Write plainly, the way you would tell it to someone. The jury is looking for concrete facts, not fine phrases." },
  s3: { fr: "Appuis et consentement", en: "Support and consent" },
  s4: { fr: "Révision", en: "Review" },
  s4p: { fr: "Relisez avant d'envoyer. La candidature ne pourra plus être modifiée.", en: "Read it over before sending. The nomination cannot be edited afterwards." },
  fName: { fr: "Nom complet", en: "Full name" },
  fOrg: { fr: "Organisation, s'il y a lieu", en: "Organization, if applicable" },
  fEmail: { fr: "Courriel", en: "Email" },
  fEmailH: { fr: "Indiquez au moins un moyen de joindre la personne.", en: "Give at least one way to reach the person." },
  fTel: { fr: "Téléphone", en: "Phone" },
  fCity: { fr: "Ville", en: "City" },
  fLink: { fr: "Lien avec la Rive-Sud", en: "Connection to the South Shore" },
  fLinkP: { fr: "Précisez le lien", en: "Describe the connection" },
  fAge: { fr: "Âge de la personne", en: "The person's age" },
  fAgeH: { fr: "Le prix Prospect s'adresse aux personnes de 15 à 30 ans.", en: "The Prospect award is for people aged 15 to 30." },
  fAware: { fr: "La personne sait-elle qu'elle est mise en candidature ?", en: "Does the person know they are being nominated?" },
  fExcl: { fr: "Est-elle membre du personnel ou du conseil d'administration de la SSBCA, l'ESEA, VIC, la MDJ LPO ou la MIRS ?", en: "Is this person a staff or board member of SSBCA, ESEA, VIC, MDJ LPO or MIRS?" },
  exclMsg: { fr: `Les membres du personnel et des conseils d'administration des cinq organismes porteurs ne sont pas admissibles. C'est une règle d'intégrité du processus, pas un jugement sur la contribution de la personne. Écrivez à ${CONTACT} si vous croyez qu'il y a erreur.`, en: `Staff and board members of the five partner organizations are not eligible. This protects the integrity of the process and is not a judgment on the person's contribution. Write to ${CONTACT} if you think this is a mistake.` },
  qPath: { fr: "Le parcours et la contribution", en: "Their journey and contribution" },
  qPathH: { fr: "Que fait cette personne, depuis combien de temps, et qu'est-ce que cela a changé pour d'autres ?", en: "What does this person do, for how long, and what has changed for others because of it?" },
  qRoot: { fr: "Racines", en: "Roots" },
  qRootH: { fr: "En quoi ce parcours s'inscrit-il dans un héritage, une communauté ou une transmission ?", en: "How does this journey connect to a heritage, a community, or passing something on?" },
  qBold: { fr: "Audace", en: "Daring" },
  qBoldH: { fr: "Quelle prise de risque cette personne a-t-elle assumée, et quel effet a-t-elle eu sur d'autres qu'elle-même ?", en: "What risk did this person take, and what effect did it have on people other than themselves?" },
  selfB: { fr: "Je dépose ma propre candidature.", en: "I am nominating myself." },
  pName: { fr: "Votre nom", en: "Your name" },
  pEmail: { fr: "Votre courriel", en: "Your email" },
  pTel: { fr: "Votre téléphone", en: "Your phone" },
  pRel: { fr: "Votre lien avec la personne", en: "Your connection to the person" },
  fLinks: { fr: "Liens vers des réalisations, articles ou œuvres", en: "Links to work, articles or projects" },
  fLinksH: { fr: "Un lien par ligne. Facultatif.", en: "One link per line. Optional." },
  fRefs: { fr: "Personnes pouvant témoigner", en: "People who can speak to this" },
  fRefsH: { fr: "Nom et moyen de les joindre, deux au maximum. Le jury ne les contacte que si la candidature avance.", en: "Name and contact, two at most. The jury contacts them only if the nomination advances." },
  fFiles: { fr: "Documents à joindre", en: "Documents to attach" },
  fFilesH: { fr: "Lettre d'appui, curriculum vitæ, coupure de presse, photographie.", en: "Letter of support, résumé, press clipping, photograph." },
  consT: { fr: "Consentements", en: "Consent" },
  c1: { fr: "J'atteste que les renseignements fournis sont exacts à ma connaissance.", en: "I confirm the information given is accurate to the best of my knowledge." },
  c2: { fr: "J'autorise les cinq organismes porteurs à recueillir et à utiliser ces renseignements aux seules fins d'évaluer la candidature. Ils sont conservés de façon restreinte et détruits au plus tard le 31 mai 2027.", en: "I allow the five partner organizations to collect and use this information solely to assess the nomination. It is kept with restricted access and destroyed by May 31, 2027." },
  c3: { fr: "Si la candidature est retenue, j'accepte que le nom, le récit et une photographie soient diffusés publiquement, après validation avec la personne.", en: "If the nomination is selected, I agree the name, story and a photograph may be shared publicly, after checking with the person." },
  back: { fr: "Retour", en: "Back" },
  next: { fr: "Continuer", en: "Continue" },
  send: { fr: "Envoyer la candidature", en: "Send the nomination" },
  sending: { fr: "Envoi en cours…", en: "Sending…" },
  savedD: { fr: "Brouillon enregistré", en: "Draft saved" },
  okT: { fr: "Candidature reçue", en: "Nomination received" },
  okRef: { fr: "Votre numéro de référence", en: "Your reference number" },
  okB: { fr: `Conservez ce numéro. Le comité vérifie l'admissibilité des dossiers au début de décembre et communique ensuite avec vous. Pour toute question, écrivez à ${CONTACT} en citant le numéro.`, en: `Keep this number. The committee checks eligibility in early December and will contact you afterwards. For any question, write to ${CONTACT} and quote the number.` },
  again: { fr: "Déposer une autre candidature", en: "Submit another nomination" },
  rPrize: { fr: "Prix", en: "Award" },
  rContact: { fr: "Coordonnées", en: "Contact" },
  rBy: { fr: "Déposée par", en: "Submitted by" },
  rSelf: { fr: "La personne elle-même", en: "The person themselves" },
  rDocs: { fr: "Documents", en: "Documents" },
  rNone: { fr: "Aucun", en: "None" },
  wordsU: { fr: "mots", en: "words" },
  over: { fr: "mots de trop", en: "words over" },
  req: { fr: "Ce champ est requis.", en: "This field is required." },
  reqOne: { fr: "Indiquez un courriel ou un téléphone.", en: "Give an email or a phone number." },
  reqAge: { fr: "Le prix Prospect s'adresse aux 15 à 30 ans.", en: "The Prospect award is for ages 15 to 30." },
  reqCons: { fr: "Les trois consentements sont requis.", en: "All three consents are required." },
  sendFail: { fr: "L'envoi a échoué. Réessayez dans un instant, votre texte est conservé.", en: "Sending failed. Try again shortly, your text is kept." },
  draftFail: { fr: "Le brouillon n'a pas pu être chargé.", en: "The draft could not be loaded." },
  close: { fr: "Fermer", en: "Close" },
  /* téléversement */
  uDrop: { fr: "Glissez vos documents ici, ou", en: "Drag your documents here, or" },
  uBrowse: { fr: "parcourir", en: "browse" },
  uLimit: { fr: "maximum", en: "maximum" },
  uEach: { fr: "chacun", en: "each" },
  uCheck: { fr: "Vérification des fichiers…", en: "Checking files…" },
  uRemove: { fr: "Retirer", en: "Remove" },
  uTotal: { fr: "Total", en: "Total" },
  uMax5: { fr: "Cinq documents au maximum.", en: "Five documents at most." },
  uOverTotal: { fr: "L'ensemble des documents dépasse la limite.", en: "The documents together exceed the limit." },
  uNotice: { fr: "Les documents sont vérifiés à l'envoi : structure réelle du fichier, refus des exécutables, détection des macros Word et du contenu actif des PDF. Les photographies sont réencodées, ce qui retire aussi les métadonnées de localisation. Ce contrôle n'est pas une analyse antivirus.", en: "Documents are checked on upload: real file structure, executables refused, Word macros and active PDF content detected. Photographs are re-encoded, which also removes location metadata. This is not a virus scan." },
  /* comité */
  admT: { fr: "Suivi des candidatures", en: "Nomination tracking" },
  admCode: { fr: "Code du comité", en: "Committee code" },
  admBad: { fr: "Code non reconnu.", en: "Code not recognized." },
  admOpen: { fr: "Ouvrir", en: "Open" },
  admExport: { fr: "Exporter en CSV", en: "Export as CSV" },
  admEmpty: { fr: "Aucune candidature déposée pour le moment. Le suivi hebdomadaire par catégorie commence dès la première.", en: "No nominations yet. Weekly tracking by category begins with the first one." },
  admAll: { fr: "Toutes", en: "All" },
  admAim: { fr: "visés", en: "target" },
  admDocs: { fr: "Documents joints et contrôles effectués", en: "Attached documents and checks performed" },
  admNoDocs: { fr: "Aucun document.", en: "No documents." },
  admDl: { fr: "Télécharger", en: "Download" },
  admMissing: { fr: "Fichier introuvable", en: "File not found" },
  admWarn: { fr: "Les contrôles ci-dessus portent sur la structure des fichiers, pas sur la présence de maliciels. N'ouvrez un document qu'après l'avoir déposé dans un environnement analysé, par exemple SharePoint ou OneDrive de la MIRS.", en: "The checks above cover file structure, not the presence of malware. Only open a document after placing it in a scanned environment, such as the MIRS SharePoint or OneDrive." },
};

const LIMITS = { path: 500, root: 300, bold: 300 };
const BLANK = {
  prize: "", name: "", org: "", email: "", tel: "", city: "",
  link: "", linkP: "", age: "", aware: "", excl: "",
  path: "", root: "", bold: "",
  self: false, propName: "", propEmail: "", propTel: "", propRel: "",
  links: "", refs: "", c1: false, c2: false, c3: false,
};

const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const ref = () => "BEN-2027-" + Math.random().toString(36).slice(2, 6).toUpperCase();

/* ==================================================================
   CONTRÔLE DES FICHIERS — vérification de structure, pas un antivirus
   ================================================================== */

const MAX_FILES = 5;
const MAX_RAW = 3 * 1024 * 1024;
const MAX_TOTAL = 12 * 1024 * 1024;
const IMG_EDGE = 1600;
const IMG_Q = 0.82;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx";

const humanSize = (b) =>
  b < 1024 ? b + " o" : b < 1048576 ? (b / 1024).toFixed(0) + " ko" : (b / 1048576).toFixed(1) + " Mo";
const b64len = (s) => Math.round((s.length - (s.indexOf(",") + 1)) * 0.75);

function str(b, o, n) {
  let s = "";
  for (let i = o; i < o + n && i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}
function bytesToLatin(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  return s;
}

const SIGS = [
  { ext: ["pdf"], kind: "pdf", test: (b) => str(b, 0, 4) === "%PDF" },
  { ext: ["jpg", "jpeg"], kind: "image", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: ["png"], kind: "image", test: (b) => b[0] === 0x89 && str(b, 1, 3) === "PNG" },
  { ext: ["webp"], kind: "image", test: (b) => str(b, 0, 4) === "RIFF" && str(b, 8, 4) === "WEBP" },
  { ext: ["heic", "heif"], kind: "image", test: (b) => str(b, 4, 4) === "ftyp" },
  { ext: ["docx"], kind: "ooxml", test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
  { ext: ["doc"], kind: "ole", test: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },
];

const EXEC = [
  { fr: "exécutable Windows", en: "Windows executable", test: (b) => b[0] === 0x4d && b[1] === 0x5a },
  { fr: "exécutable Linux", en: "Linux executable", test: (b) => b[0] === 0x7f && str(b, 1, 3) === "ELF" },
  { fr: "exécutable macOS", en: "macOS executable", test: (b) => b[0] === 0xca && b[1] === 0xfe && b[2] === 0xba && b[3] === 0xbe },
  { fr: "script", en: "script", test: (b) => str(b, 0, 2) === "#!" || /^<\?php|^<script/i.test(str(b, 0, 8)) },
  { fr: "archive compressée", en: "compressed archive", test: (b) => str(b, 0, 3) === "Rar" || (b[0] === 0x37 && b[1] === 0x7a) },
];

const PDF_ACTIVE = ["/JavaScript", "/JS", "/Launch", "/OpenAction", "/EmbeddedFile", "/RichMedia"];

const NOTE_NOMACRO = { fr: "Aucune macro détectée", en: "No macros found" };
const NOTE_OLE = { fr: "Ancien format Word, macros non vérifiables", en: "Legacy Word format, macros not verifiable", warn: true };
const NOTE_NOACTIVE = { fr: "Aucun contenu actif détecté", en: "No active content found" };
const NOTE_REENC = { fr: "Image réencodée, métadonnées retirées", en: "Image re-encoded, metadata stripped" };
const NOTE_ASIS = { fr: "Image conservée telle quelle", en: "Image kept as is", warn: true };

async function inspect(file) {
  const notes = [];
  const lower = file.name.toLowerCase();
  const parts = lower.split(".");
  const ext = parts.pop();
  if (!ACCEPT.replace(/\./g, "").split(",").includes(ext))
    return { ok: false, why: { fr: `Type de fichier refusé (.${ext}).`, en: `File type refused (.${ext}).` } };

  const risky = ["exe", "js", "bat", "cmd", "scr", "vbs", "jar", "com", "ps1", "sh", "msi", "apk", "dll"];
  if (parts.some((p) => risky.includes(p)))
    return { ok: false, why: { fr: "Nom de fichier à double extension.", en: "Double file extension." } };

  const buf = new Uint8Array(await file.arrayBuffer());
  for (const e of EXEC)
    if (e.test(buf)) return { ok: false, why: { fr: `Contenu de type ${e.fr}.`, en: `Content is a ${e.en}.` } };

  const sig = SIGS.find((s) => s.ext.includes(ext));
  if (!sig || !sig.test(buf))
    return { ok: false, why: { fr: "Le contenu ne correspond pas à l'extension.", en: "Content does not match the extension." } };

  const raw = bytesToLatin(buf);
  if (sig.kind === "ooxml") {
    if (raw.includes("vbaProject.bin") || raw.includes("macroEnabled"))
      return { ok: false, why: { fr: "Document Word contenant des macros.", en: "Word document contains macros." } };
    notes.push(NOTE_NOMACRO);
  }
  if (sig.kind === "ole") notes.push(NOTE_OLE);
  if (sig.kind === "pdf") {
    const bad = PDF_ACTIVE.filter((k) => raw.includes(k));
    if (bad.length)
      return { ok: false, why: { fr: `PDF contenant du contenu actif (${bad.join(", ")}).`, en: `PDF contains active content (${bad.join(", ")}).` } };
    notes.push(NOTE_NOACTIVE);
  }
  return { ok: true, kind: sig.kind, notes };
}

function compressImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(1, IMG_EDGE / Math.max(w, h));
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const x = cv.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
      x.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { res(cv.toDataURL("image/jpeg", IMG_Q)); } catch (e) { rej(new Error("encode")); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("decode")); };
    img.src = url;
  });
}
function readDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("read"));
    r.readAsDataURL(file);
  });
}

/* lève un objet {fr,en} en cas de refus */
async function processFile(file) {
  const v = await inspect(file);
  if (!v.ok) throw v.why;
  const notes = v.notes.slice();
  let data, type = file.type || "application/octet-stream", name = file.name;
  const tooBig = {
    fr: `Fichier trop lourd, maximum ${humanSize(MAX_RAW)}.`,
    en: `File too large, maximum ${humanSize(MAX_RAW)}.`,
  };
  if (v.kind === "image") {
    try {
      data = await compressImage(file);
      type = "image/jpeg";
      if (!/\.jpe?g$/i.test(name)) name = name.replace(/\.[^.]+$/, "") + ".jpg";
      notes.push(NOTE_REENC);
    } catch (e) {
      if (file.size > MAX_RAW)
        throw { fr: "Image illisible par le navigateur. Enregistrez-la en JPG.", en: "Image unreadable by the browser. Save it as JPG." };
      data = await readDataURL(file);
      notes.push(NOTE_ASIS);
    }
  } else {
    if (file.size > MAX_RAW) throw tooBig;
    data = await readDataURL(file);
  }
  const size = b64len(data);
  if (size > MAX_RAW) throw tooBig;
  return { id: Math.random().toString(36).slice(2, 9), name, type, size, data, notes };
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function download(f) {
  const a = document.createElement("a");
  a.href = f.data || f.url; a.download = f.name; a.click();
}

/* ------------------------------ UI -------------------------------- */

function Field({ label, hint, error, children }) {
  const p = usePick();
  return (
    <div className="row">
      <label style={{ display: "block", marginBottom: 6 }}>{p(label)}</label>
      {children}
      {error ? <div className="err">{p(error)}</div> : hint ? <div className="hint">{p(hint)}</div> : null}
    </div>
  );
}

function Text({ value, onChange, invalid, ...rest }) {
  return <input className="fld" value={value} aria-invalid={invalid ? "true" : "false"}
    onChange={(e) => onChange(e.target.value)} {...rest} />;
}

function Choice({ options, value, onChange }) {
  const p = usePick();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {options.map((o) => {
        const on = value === o.fr;
        return (
          <button key={o.fr} type="button" onClick={() => onChange(o.fr)}
            style={{
              padding: "8px 16px", border: `1px solid ${on ? C.royal : C.trait}`,
              background: on ? C.blanc : "transparent", color: C.nuit, borderRadius: 2,
              boxShadow: on ? `inset 3px 0 0 ${C.royal}` : "none", fontSize: 16,
            }}>{p(o)}</button>
        );
      })}
    </div>
  );
}

function Long({ value, onChange, max, rows }) {
  const p = usePick();
  const n = words(value), over = n > max;
  return (
    <>
      <textarea className="fld" rows={rows} value={value} style={{ resize: "vertical", lineHeight: 1.6 }}
        onChange={(e) => onChange(e.target.value)} />
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 6 }}>
        <div style={{ flex: 1, height: 2, background: C.trait }}>
          <div style={{ width: Math.min(100, (n / max) * 100) + "%", height: "100%", background: over ? C.alerte : n > max * 0.85 ? C.champagne : C.vert }} />
        </div>
        <span style={{ fontSize: 15, color: over ? C.alerte : C.second, whiteSpace: "nowrap" }}>
          {over ? `${n - max} ${p(D.over)}` : `${n} / ${max} ${p(D.wordsU)}`}
        </span>
      </div>
    </>
  );
}

function Check({ on, onChange, label }) {
  const p = usePick();
  return (
    <label style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 15, cursor: "pointer" }}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 5, width: 17, height: 17, accentColor: C.royal, flex: "none" }} />
      <span style={{ fontSize: 16 }}>{p(label)}</span>
    </label>
  );
}

function Badge({ note }) {
  const p = usePick();
  const col = note.warn ? C.champagne : C.vert;
  return (
    <span style={{ fontSize: 14, color: col, border: `1px solid ${col}`, padding: "1px 7px", borderRadius: 2 }}>{p(note)}</span>
  );
}

function FileMark({ type }) {
  const pdf = /pdf/.test(type), doc = /word|officedocument|msword/.test(type);
  return (
    <span style={{
      width: 40, height: 40, background: pdf ? C.alerte : doc ? C.royal : C.vert, color: C.ivoire,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flex: "none",
    }}>{pdf ? "PDF" : doc ? "DOC" : "IMG"}</span>
  );
}

function H({ label, sub }) {
  const p = usePick();
  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: "normal", margin: sub ? "0 0 6px" : "0 0 20px" }}>{p(label)}</h2>
      {sub && <p className="muted" style={{ margin: "0 0 20px" }}>{p(sub)}</p>}
    </>
  );
}

/* ------------------------ téléversement --------------------------- */

function Uploader({ files, setFiles, onError }) {
  const p = usePick();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState([]);
  const input = useRef(null);
  const total = files.reduce((s, f) => s + f.size, 0);

  async function add(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    if (files.length + arr.length > MAX_FILES) { onError(D.uMax5); return; }
    setBusy(true); setRefused([]);
    const out = [], no = []; let running = total;
    for (const f of arr) {
      try {
        const r = await processFile(f);
        if (running + r.size > MAX_TOTAL) { no.push({ name: f.name, why: D.uOverTotal }); continue; }
        running += r.size; out.push(r);
      } catch (e) { no.push({ name: f.name, why: e && e.fr ? e : { fr: "Fichier refusé.", en: "File refused." } }); }
    }
    setBusy(false); setRefused(no);
    if (out.length) setFiles(files.concat(out));
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        style={{ border: `1px dashed ${over ? C.royal : C.trait}`, background: over ? C.blanc : "transparent", padding: "28px 20px", textAlign: "center" }}>
        <div>
          {p(D.uDrop)}{" "}
          <button type="button" className="lnk" onClick={() => input.current && input.current.click()}>{p(D.uBrowse)}</button>
        </div>
        <div style={{ fontSize: 15, color: C.second, marginTop: 9 }}>
          PDF · JPG · PNG · Word — {MAX_FILES} {p(D.uLimit)}, {humanSize(MAX_RAW)} {p(D.uEach)}
        </div>
        <input ref={input} type="file" accept={ACCEPT} multiple hidden
          onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>

      {busy && <div style={{ fontSize: 15, color: C.second, marginTop: 11 }}>{p(D.uCheck)}</div>}

      {refused.map((r, i) => (
        <div key={i} className="warn" style={{ marginTop: 10 }}><strong>{r.name}</strong> — {p(r.why)}</div>
      ))}

      {files.map((f) => (
        <div key={f.id} style={{ display: "flex", gap: 13, padding: "11px 13px", border: `1px solid ${C.trait}`, background: C.blanc, marginTop: 10 }}>
          {/^image\//.test(f.type)
            ? <img src={f.data} alt="" style={{ width: 40, height: 40, objectFit: "cover", flex: "none" }} />
            : <FileMark type={f.type} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
            <div style={{ fontSize: 15, color: C.second, marginTop: 4, display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              <span>{humanSize(f.size)}</span>
              {f.notes.map((n, i) => <Badge key={i} note={n} />)}
            </div>
          </div>
          <button type="button" className="lnk" style={{ fontSize: 16, alignSelf: "center" }}
            onClick={() => setFiles(files.filter((x) => x.id !== f.id))}>{p(D.uRemove)}</button>
        </div>
      ))}

      {files.length > 0 && (
        <div style={{ fontSize: 15, color: C.second, marginTop: 8 }}>
          {p(D.uTotal)} : {humanSize(total)} / {humanSize(MAX_TOTAL)}
        </div>
      )}

      <div className="note" style={{ marginTop: 16, fontSize: 15 }}>{p(D.uNotice)}</div>
    </div>
  );
}

/* ============================== APP =============================== */

export default function App() {
  const [lang, setLang] = useState("fr");
  const [view, setView] = useState("home");
  const [step, setStep] = useState(0);
  const [d, setD] = useState(BLANK);
  const [files, setFiles] = useState([]);
  const [errs, setErrs] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [note, setNote] = useState(null);
  const first = useRef(true);
  const p = (o) => (o && o[lang] !== undefined ? o[lang] : "");

  useEffect(() => {
    try { if (localStorage.getItem("gala2027:draft")) setHasDraft(true); }
    catch (e) { /* aucun brouillon */ }
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (view !== "form") return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem("gala2027:draft", JSON.stringify({ ...d, _files: files }));
        setSaved(true);
      } catch (e) { /* silencieux */ }
    }, 900);
    return () => clearTimeout(id);
  }, [d, files, view]);

  const set = (k) => (v) => { setD((x) => ({ ...x, [k]: v })); setErrs((x) => ({ ...x, [k]: null })); };
  const blocked = d.excl === "Oui";

  async function resume() {
    try {
      const raw = localStorage.getItem("gala2027:draft");
      if (!raw) return;
      const o = JSON.parse(raw);
      const back = o._files || [];
      delete o._files;
      setD({ ...BLANK, ...o });
      setFiles(back); setView("form"); setStep(1);
    } catch (e) { setNote(D.draftFail); }
  }

  function validate(s) {
    const e = {};
    if (s === 1) {
      if (!d.name.trim()) e.name = D.req;
      if (!d.email.trim() && !d.tel.trim()) e.email = D.reqOne;
      if (!d.city.trim()) e.city = D.req;
      if (!d.link) e.link = D.req;
      if (!d.aware) e.aware = D.req;
      if (!d.excl) e.excl = D.req;
      if (d.prize === "prospect") {
        const a = parseInt(d.age, 10);
        if (!a || a < 15 || a > 30) e.age = D.reqAge;
      }
    }
    if (s === 2) {
      if (!d.path.trim()) e.path = D.req;
      for (const [k, m] of [["path", LIMITS.path], ["root", LIMITS.root], ["bold", LIMITS.bold]]) {
        const n = words(d[k]) - m;
        if (n > 0) e[k] = { fr: `${n} mots de trop.`, en: `${n} words over.` };
      }
    }
    if (s === 3) {
      if (!d.self) {
        if (!d.propName.trim()) e.propName = D.req;
        if (!d.propEmail.trim()) e.propEmail = D.req;
      }
      if (!d.c1 || !d.c2 || !d.c3) e.cons = D.reqCons;
    }
    setErrs(e);
    return !Object.keys(e).length;
  }

  const go = (n) => { if (n > step && !validate(step)) return; setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  async function submit() {
    if (!validate(3)) { setStep(3); return; }
    setBusy(true);
    try {
      // The browser sends the candidature to the server. The GitHub token never reaches the browser.
      const result = await api("/api/submit", {
        method: "POST",
        body: JSON.stringify({ ...d, lang, files: files.map(({ id, ...f }) => f) }),
      });
      try {
        localStorage.removeItem("gala2027:draft");
      } catch (e) { /* passe */ }
      setRefNo(result.ref); setFiles([]); setHasDraft(false); setView("done"); window.scrollTo({ top: 0 });
    } catch (e) { setNote(D.sendFail); }
    setBusy(false);
  }

  const prize = PRIZES.find((x) => x.id === d.prize);

  return (
    <Lang.Provider value={lang}>
      <div className="g">
        <style>{CSS}</style>

        {/* Bandeau de marque : bilingue apparié, français d'abord */}
        <header style={{ background: C.nuit, color: C.ivoire }}>
          <div className="wrap" style={{ padding: "24px 22px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28 }}>Gala Black Excellence Noire</div>
              <div style={{ color: C.champagne, fontSize: 20, fontStyle: "italic", marginTop: 2 }}>
                De racines et d'audace <span style={{ opacity: 0.75 }}>· Rooted and bold</span>
              </div>
              <div style={{ fontSize: 16, marginTop: 10, opacity: 0.9 }}>{p(D.edition)}</div>
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <button className="btn" style={{ background: C.ivoire, color: C.nuit, fontSize: 16, padding: "7px 15px" }}
                onClick={() => setLang(lang === "fr" ? "en" : "fr")}>{p(D.switch)}</button>
              {view !== "admin" && (
                <button className="btn" style={{ background: "transparent", color: C.ivoire, border: "1px solid rgba(247,241,228,.35)", fontSize: 16, padding: "7px 15px" }}
                  onClick={() => setView("admin")}>{p(D.committee)}</button>
              )}
            </div>
          </div>
          <div className="rule" />
          <div style={{ background: "rgba(0,0,0,.22)" }}>
            <div className="wrap" style={{ padding: "8px 22px", fontSize: 15, letterSpacing: ".04em" }}>{PARTNERS}</div>
          </div>
        </header>

        {note && (
          <div style={{ background: "#FCF4F2", borderBottom: `1px solid ${C.alerte}`, color: C.alerte, padding: "11px 0" }}>
            <div className="wrap" style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
              <span>{p(note)}</span>
              <button className="lnk" style={{ color: C.alerte }} onClick={() => setNote(null)}>{p(D.close)}</button>
            </div>
          </div>
        )}

        <main className="wrap" style={{ padding: "36px 22px 70px" }}>
          {view === "home" && <Home hasDraft={hasDraft} onStart={() => { setD(BLANK); setFiles([]); setView("form"); setStep(0); }} onResume={resume} />}
          {view === "done" && <Done refNo={refNo} onAgain={() => { setD(BLANK); setFiles([]); setView("form"); setStep(0); }} />}
          {view === "admin" && <Admin onClose={() => setView("home")} />}

          {view === "form" && (
            <div className="cols" style={{ display: "grid", gridTemplateColumns: "215px 1fr", gap: 46, alignItems: "start" }}>
              <nav style={{ position: "sticky", top: 20 }}>
                {STEPS.map((s, i) => (
                  <div key={s.fr} className="railI" data-on={i === step ? 1 : 0} data-done={i < step ? 1 : 0}>
                    <span className="dot" /><span>{p(s)}</span>
                  </div>
                ))}
                {saved && <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.trait}`, fontSize: 15, color: C.vert }}>{p(D.savedD)}</div>}
              </nav>

              <div style={{ maxWidth: 640 }}>
                {step === 0 && (
                  <>
                    <H label={D.s0} />
                    {PRIZES.map((x) => (
                      <button key={x.id} className="pick" data-on={d.prize === x.id ? 1 : 0}
                        onClick={() => { set("prize")(x.id); setTimeout(() => go(1), 120); }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
                          <span style={{ width: 10, height: 10, background: x.color, flex: "none" }} />
                          <span style={{ fontSize: 20 }}>{x[lang]}</span>
                        </div>
                        <div style={{ fontSize: 16 }}>{p(x.d)}</div>
                      </button>
                    ))}
                    <div className="note" style={{ marginTop: 14 }}>{p(D.hommage)}</div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <H label={D.s1} />
                    <Field label={D.fName} error={errs.name}><Text value={d.name} onChange={set("name")} invalid={!!errs.name} /></Field>
                    <Field label={D.fOrg}><Text value={d.org} onChange={set("org")} /></Field>
                    <div className="grid2">
                      <Field label={D.fEmail} error={errs.email} hint={D.fEmailH}>
                        <Text type="email" value={d.email} onChange={set("email")} invalid={!!errs.email} />
                      </Field>
                      <Field label={D.fTel}><Text value={d.tel} onChange={set("tel")} /></Field>
                    </div>
                    <Field label={D.fCity} error={errs.city}><Text value={d.city} onChange={set("city")} invalid={!!errs.city} /></Field>
                    <Field label={D.fLink} error={errs.link}><Choice options={LINKS} value={d.link} onChange={set("link")} /></Field>
                    {d.link === LINKS[3].fr && <Field label={D.fLinkP}><Text value={d.linkP} onChange={set("linkP")} /></Field>}
                    {d.prize === "prospect" && (
                      <Field label={D.fAge} hint={D.fAgeH} error={errs.age}>
                        <Text type="number" value={d.age} onChange={set("age")} invalid={!!errs.age} style={{ maxWidth: 130 }} />
                      </Field>
                    )}
                    <Field label={D.fAware} error={errs.aware}>
                      <Choice options={AWARE} value={d.aware} onChange={(v) => { set("aware")(v); if (v === AWARE[2].fr) set("self")(true); }} />
                    </Field>
                    <Field label={D.fExcl} error={errs.excl}><Choice options={YESNO} value={d.excl} onChange={set("excl")} /></Field>
                    {blocked && <div className="warn" style={{ marginBottom: 20 }}>{p(D.exclMsg)}</div>}
                  </>
                )}

                {step === 2 && (
                  <>
                    <H label={D.s2} sub={D.s2p} />
                    <Field label={D.qPath} hint={D.qPathH} error={errs.path}><Long value={d.path} onChange={set("path")} max={LIMITS.path} rows={10} /></Field>
                    <Field label={D.qRoot} hint={D.qRootH} error={errs.root}><Long value={d.root} onChange={set("root")} max={LIMITS.root} rows={7} /></Field>
                    <Field label={D.qBold} hint={D.qBoldH} error={errs.bold}><Long value={d.bold} onChange={set("bold")} max={LIMITS.bold} rows={7} /></Field>
                  </>
                )}

                {step === 3 && (
                  <>
                    <H label={D.s3} />
                    <Check on={d.self} onChange={set("self")} label={D.selfB} />
                    {!d.self && (
                      <>
                        <div className="grid2">
                          <Field label={D.pName} error={errs.propName}><Text value={d.propName} onChange={set("propName")} invalid={!!errs.propName} /></Field>
                          <Field label={D.pEmail} error={errs.propEmail}><Text type="email" value={d.propEmail} onChange={set("propEmail")} invalid={!!errs.propEmail} /></Field>
                        </div>
                        <div className="grid2">
                          <Field label={D.pTel}><Text value={d.propTel} onChange={set("propTel")} /></Field>
                          <Field label={D.pRel}><Text value={d.propRel} onChange={set("propRel")} /></Field>
                        </div>
                      </>
                    )}
                    <div style={{ borderTop: `1px solid ${C.trait}`, paddingTop: 22, marginTop: 6 }}>
                      <Field label={D.fLinks} hint={D.fLinksH}>
                        <textarea className="fld" rows={3} value={d.links} onChange={(e) => set("links")(e.target.value)} style={{ resize: "vertical" }} />
                      </Field>
                      <Field label={D.fRefs} hint={D.fRefsH}>
                        <textarea className="fld" rows={3} value={d.refs} onChange={(e) => set("refs")(e.target.value)} style={{ resize: "vertical" }} />
                      </Field>
                      <div className="row">
                        <label style={{ display: "block", marginBottom: 6 }}>{p(D.fFiles)}</label>
                        <div className="hint" style={{ marginTop: 0, marginBottom: 12 }}>{p(D.fFilesH)}</div>
                        <Uploader files={files} setFiles={setFiles} onError={setNote} />
                      </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.trait}`, paddingTop: 22, marginTop: 22 }}>
                      <div style={{ marginBottom: 14, fontSize: 19 }}>{p(D.consT)}</div>
                      <Check on={d.c1} onChange={set("c1")} label={D.c1} />
                      <Check on={d.c2} onChange={set("c2")} label={D.c2} />
                      <Check on={d.c3} onChange={set("c3")} label={D.c3} />
                      {errs.cons && <div className="err">{p(errs.cons)}</div>}
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <H label={D.s4} sub={D.s4p} />
                    <div className="card" style={{ padding: 22 }}>
                      <Row label={D.rPrize} v={prize ? prize[lang] : "—"} />
                      <Row label={D.fName} v={d.name + (d.org ? ` · ${d.org}` : "")} />
                      <Row label={D.fCity} v={d.city} />
                      <Row label={D.rContact} v={[d.email, d.tel].filter(Boolean).join(" · ")} />
                      <Row label={D.fLink} v={d.link + (d.linkP ? ` — ${d.linkP}` : "")} />
                      {d.prize === "prospect" && <Row label={D.fAge} v={d.age} />}
                      <Row label={D.qPath} v={`${words(d.path)} ${p(D.wordsU)}`} />
                      <Row label={D.qRoot} v={`${words(d.root)} ${p(D.wordsU)}`} />
                      <Row label={D.qBold} v={`${words(d.bold)} ${p(D.wordsU)}`} />
                      <Row label={D.rBy} v={d.self ? p(D.rSelf) : `${d.propName} · ${d.propEmail}`} />
                      <Row label={D.rDocs} v={files.length ? files.map((f) => f.name).join(", ") : p(D.rNone)} last />
                    </div>
                  </>
                )}

                <div style={{ display: "flex", gap: 11, marginTop: 30, paddingTop: 22, borderTop: `1px solid ${C.trait}` }}>
                  {step > 0 && <button className="btn btnS" onClick={() => go(step - 1)}>{p(D.back)}</button>}
                  {step > 0 && step < 4 && <button className="btn btnP" onClick={() => go(step + 1)} disabled={blocked}>{p(D.next)}</button>}
                  {step === 4 && <button className="btn btnP" onClick={submit} disabled={busy || blocked}>{busy ? p(D.sending) : p(D.send)}</button>}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{ borderTop: `1px solid ${C.trait}`, padding: "20px 0", fontSize: 15, color: C.second }}>
          <div className="wrap">
            Comité des partenaires / Partners Committee · {PARTNERS} · MIRS, fiduciaire / MIRS, fiduciary · {CONTACT}
          </div>
        </footer>
      </div>
    </Lang.Provider>
  );
}

function Row({ label, v, last }) {
  const p = usePick();
  return (
    <div style={{ display: "flex", gap: 18, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${C.trait}` }}>
      <div style={{ width: 200, flex: "none", color: C.second, fontSize: 16 }}>{p(label)}</div>
      <div style={{ fontSize: 16 }}>{v || "—"}</div>
    </div>
  );
}

function Home({ hasDraft, onStart, onResume }) {
  const lang = useLang();
  const p = usePick();
  return (
    <div className="cols" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 54, alignItems: "start" }}>
      <div>
        <h2 style={{ fontSize: 30, fontWeight: "normal", margin: "0 0 18px", lineHeight: 1.25 }}>{p(D.homeT)}</h2>
        <p style={{ margin: "0 0 18px" }}>{p(D.homeP)}</p>
        <p style={{ margin: "0 0 26px" }}>{p(D.period)}</p>
        <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
          <button className="btn btnP" onClick={onStart}>{p(D.start)}</button>
          {hasDraft && <button className="btn btnS" onClick={onResume}>{p(D.resumeB)}</button>}
        </div>
        <div style={{ borderTop: `1px solid ${C.trait}`, marginTop: 28, paddingTop: 18, fontSize: 16, maxWidth: 470 }}>{p(D.byPhone)}</div>
      </div>
      <div>
        <div style={{ marginBottom: 16, fontSize: 19 }}>{p(D.prizesT)}</div>
        {PRIZES.map((x) => (
          <div key={x.id} style={{ paddingLeft: 15, borderLeft: `3px solid ${x.color}`, marginBottom: 20 }}>
            <div style={{ fontSize: 19 }}>{x[lang]}</div>
            <div style={{ fontSize: 16, marginTop: 3 }}>{p(x.d)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Done({ refNo, onAgain }) {
  const p = usePick();
  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 28, fontWeight: "normal", margin: "0 0 20px" }}>{p(D.okT)}</h2>
      <div className="card" style={{ padding: 20, marginBottom: 22, borderLeft: `3px solid ${C.champagne}` }}>
        <div style={{ fontSize: 16, color: C.second }}>{p(D.okRef)}</div>
        <div style={{ fontSize: 28, color: C.royal, marginTop: 5 }}>{refNo}</div>
      </div>
      <p style={{ marginBottom: 26 }}>{p(D.okB)}</p>
      <button className="btn btnS" onClick={onAgain}>{p(D.again)}</button>
    </div>
  );
}

function Admin({ onClose }) {
  const lang = useLang();
  const p = usePick();
  const [ok, setOk] = useState(false);
  const [code, setCode] = useState("");
  const [bad, setBad] = useState(false);
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [att, setAtt] = useState({});
  const [adminToken, setAdminToken] = useState("");
  const [loadingError, setLoadingError] = useState("");

  useEffect(() => {
    if (!ok || !adminToken) return;
    (async () => {
      try {
        setLoadingError("");
        const out = await api("/api/admin/candidatures", { headers: { Authorization: `Bearer ${adminToken}` } });
        setRows(out);
      } catch (e) { setRows([]); setLoadingError(e.message || "Erreur de lecture"); }
    })();
  }, [ok, adminToken]);

  async function login() {
    try {
      const r = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: code }) });
      setAdminToken(r.token);
      setOk(true);
      setBad(false);
    } catch { setBad(true); }
  }

  function documentUrl(filePath) {
    return `/api/admin/document?path=${encodeURIComponent(filePath)}`;
  }

  async function downloadDocument(f) {
    try {
      const res = await fetch(documentUrl(f.path), { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name; a.click();
      URL.revokeObjectURL(url);
    } catch { setLoadingError("Impossible de télécharger le document."); }
  }

  async function openRow(r) {
    if (open === r.ref) { setOpen(null); return; }
    setOpen(r.ref);
    setAtt((x) => ({ ...x, [r.ref]: r.files || [] }));
  }

  if (!ok) {
    return (
      <div style={{ maxWidth: 400 }}>
        <H label={D.admT} />
        <Field label={D.admCode} error={bad ? D.admBad : null}>
          <Text type="password" value={code} onChange={(v) => { setCode(v); setBad(false); }} />
        </Field>
        <div style={{ display: "flex", gap: 11 }}>
          <button className="btn btnP" onClick={login}>{p(D.admOpen)}</button>
          <button className="btn btnS" onClick={onClose}>{p(D.back)}</button>
        </div>
      </div>
    );
  }

  const list = rows || [];
  const shown = filter === "all" ? list : list.filter((r) => r.prize === filter);

  const csv = () => {
    const h = ["ref", "date", "prix", "nom", "organisation", "ville", "courriel", "telephone", "lien", "age", "propose_par", "courriel_proposant", "mots_parcours", "mots_racines", "mots_audace", "documents"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [h.join(",")].concat(shown.map((r) => [r.ref, r.at, r.prize, r.name, r.org, r.city, r.email, r.tel,
    r.link + (r.linkP ? " - " + r.linkP : ""), r.age, r.self ? "soi-meme" : r.propName, r.propEmail,
    words(r.path || ""), words(r.root || ""), words(r.bold || ""), (r.files || []).length].map(esc).join(",")));
    const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "candidatures-gala-2027.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 24, fontWeight: "normal", margin: 0 }}>{p(D.admT)}</h2>
        <div style={{ display: "flex", gap: 9 }}>
          <button className="btn btnS" style={{ fontSize: 16, padding: "7px 14px" }} onClick={csv} disabled={!shown.length}>{p(D.admExport)}</button>
          <button className="btn btnS" style={{ fontSize: 16, padding: "7px 14px" }} onClick={onClose}>{p(D.close)}</button>
        </div>
      </div>

      {loadingError && <div className="warn" style={{ marginBottom: 18 }}>{loadingError}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {PRIZES.map((x) => {
          const n = list.filter((r) => r.prize === x.id).length;
          return (
            <div key={x.id} className="card" style={{ padding: 16, borderTop: `3px solid ${x.color}` }}>
              <div style={{ fontSize: 16, color: C.second }}>{x[lang]}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 32, color: n >= x.target ? C.vert : C.nuit }}>{n}</span>
                <span style={{ fontSize: 16, color: C.second }}>/ {x.target} {p(D.admAim)}</span>
              </div>
              <div style={{ height: 3, background: C.trait, marginTop: 10 }}>
                <div style={{ width: Math.min(100, (n / x.target) * 100) + "%", height: "100%", background: x.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {rows === null ? <p className="muted">…</p>
        : !list.length ? <p className="muted" style={{ maxWidth: 560 }}>{p(D.admEmpty)}</p>
          : (
            <>
              <div style={{ marginBottom: 15 }}>
                <Choice options={[{ fr: "Toutes", en: "All" }].concat(PRIZES.map((x) => ({ fr: x.fr, en: x.en })))}
                  value={filter === "all" ? "Toutes" : PRIZES.find((x) => x.id === filter).fr}
                  onChange={(v) => setFilter(v === "Toutes" ? "all" : PRIZES.find((x) => x.fr === v).id)} />
              </div>
              <div className="card">
                <table className="tbl">
                  <thead><tr>
                    <th>Réf.</th><th>{p(D.fName)}</th><th>{p(D.rPrize)}</th><th>{p(D.fCity)}</th><th>Doc.</th><th></th>
                  </tr></thead>
                  <tbody>
                    {shown.map((r) => {
                      const x = PRIZES.find((y) => y.id === r.prize);
                      return (
                        <tr key={r.ref}>
                          <td style={{ color: C.second }}>{r.ref}</td>
                          <td>{r.name}</td>
                          <td style={{ color: x ? x.color : C.second }}>{x ? x[lang] : "—"}</td>
                          <td>{r.city}</td>
                          <td>{(r.files || []).length}</td>
                          <td><button className="lnk" onClick={() => openRow(r)}>{open === r.ref ? p(D.close) : p(D.admOpen)}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {open && (() => {
                const r = shown.find((x) => x.ref === open);
                if (!r) return null;
                const blocks = [[D.qPath, r.path], [D.qRoot, r.root], [D.qBold, r.bold], [D.fLinks, r.links], [D.fRefs, r.refs]];
                return (
                  <div className="card" style={{ padding: 24, marginTop: 18, borderLeft: `3px solid ${C.champagne}` }}>
                    <div style={{ fontSize: 21, marginBottom: 16 }}>{r.name} · {r.ref}</div>
                    {blocks.filter(([, v]) => v && v.trim()).map(([k, v]) => (
                      <div key={k.fr} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 15, color: C.second, marginBottom: 4 }}>{p(k)}</div>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{v}</div>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.trait}`, paddingTop: 16, marginTop: 8 }}>
                      <div style={{ fontSize: 15, color: C.second, marginBottom: 11 }}>{p(D.admDocs)}</div>
                      {!(r.files || []).length ? <div style={{ fontSize: 16, color: C.second }}>{p(D.admNoDocs)}</div>
                        : !att[r.ref] ? <div className="muted">…</div>
                          : att[r.ref].map((f) => (
                            <div key={f.id} style={{ display: "flex", gap: 13, padding: "11px 0", borderTop: `1px solid ${C.trait}` }}>
                              {/^image\//.test(f.type) && !f.missing
                                ? <img src={f.data} alt="" style={{ width: 44, height: 44, objectFit: "cover", flex: "none" }} />
                                : <FileMark type={f.type} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div>{f.name} <span style={{ color: C.second, fontSize: 15 }}>· {humanSize(f.size)}</span></div>
                                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 5 }}>
                                  {(f.notes || []).map((n, i) => <Badge key={i} note={n} />)}
                                  {f.missing && <Badge note={{ fr: p(D.admMissing), en: p(D.admMissing), warn: true }} />}
                                </div>
                              </div>
                              {!f.missing && <button className="lnk" style={{ alignSelf: "center" }} onClick={() => downloadDocument(f)}>{p(D.admDl)}</button>}
                            </div>
                          ))}
                      <div className="warn" style={{ marginTop: 16, fontSize: 15 }}>{p(D.admWarn)}</div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
    </div>
  );
}
