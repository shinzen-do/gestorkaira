#!/usr/bin/env node
// Captura screenshots reais do Kaira (landing pública + páginas internas autenticadas)
// Salva em /public/screenshots/*.png
//
// Uso:
//   1) Páginas públicas (sem auth):
//      node scripts/capture-screenshots.mjs --public-only
//
//   2) Páginas internas (precisa conta de teste com SENHA já definida):
//      KAIRA_TEST_EMAIL=teste@kaira.app KAIRA_TEST_PASSWORD=xxxxxxxx \
//        node scripts/capture-screenshots.mjs
//
//   Por padrão captura prod (https://gestorkaira.vercel.app).
//   Pra usar local: BASE_URL=http://localhost:8080 node scripts/capture-screenshots.mjs

import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/screenshots");
const BASE = process.env.BASE_URL ?? "https://gestorkaira.vercel.app";
const EMAIL = process.env.KAIRA_TEST_EMAIL;
const PASSWORD = process.env.KAIRA_TEST_PASSWORD;
const PUBLIC_ONLY = process.argv.includes("--public-only");

mkdirSync(OUT_DIR, { recursive: true });

const captures = [
  // Públicas
  { url: "/", name: "landing-desktop", w: 1440, h: 900 },
  { url: "/", name: "landing-tablet", w: 768, h: 1024 },
  { url: "/", name: "landing-mobile", w: 375, h: 812 },
  { url: "/login", name: "login-desktop", w: 1440, h: 900 },
];

for (const c of captures) {
  const out = `${OUT_DIR}/${c.name}.png`;
  const cmd = `google-chrome --headless=new --disable-gpu --hide-scrollbars --no-sandbox --window-size=${c.w},${c.h} --virtual-time-budget=4000 --screenshot="${out}" "${BASE}${c.url}"`;
  console.log(`→ ${c.name} (${c.w}x${c.h})`);
  execSync(cmd, { stdio: ["ignore", "ignore", "inherit"] });
}

if (PUBLIC_ONLY) {
  console.log("Done. Internal pages skipped (--public-only).");
  process.exit(0);
}

if (!EMAIL || !PASSWORD) {
  console.log(`\nPra capturar páginas internas (dashboard, clientes, pacing, etc.):`);
  console.log(`  KAIRA_TEST_EMAIL=... KAIRA_TEST_PASSWORD=... node scripts/capture-screenshots.mjs\n`);
  console.log(`Requer conta de teste com senha (definida em Settings → Segurança após login Google).`);
  process.exit(0);
}

// Para capturar páginas internas precisaríamos de puppeteer-core pra login flow.
// Esqueleto pra implementar depois:
console.log(`
TODO: capturar páginas internas requer puppeteer-core ou playwright pra simular login.
Instalar (opcional):  npm i -D puppeteer-core
E preencher o trecho abaixo no script.

Páginas alvo:
  - /dashboard
  - /clients
  - /pacing
  - /audiences
  - /timeline
  - /tasks
`);
