#!/usr/bin/env node
// Captura screenshots autenticados do Kaira (dashboard, clientes, pacing, etc.)
// Requer: KAIRA_TEST_EMAIL + KAIRA_TEST_PASSWORD em env vars.
// Faz login via /login (email+senha), navega e captura.

import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/screenshots");
const BASE = process.env.BASE_URL ?? "https://gestorkaira.vercel.app";
const EMAIL = process.env.KAIRA_TEST_EMAIL;
const PASSWORD = process.env.KAIRA_TEST_PASSWORD;
const EXECUTABLE = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";

if (!EMAIL || !PASSWORD) {
  console.error("Missing KAIRA_TEST_EMAIL or KAIRA_TEST_PASSWORD env vars.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { path: "/dashboard", name: "app-dashboard" },
  { path: "/clients", name: "app-clients" },
  { path: "/pacing", name: "app-pacing" },
  { path: "/audiences", name: "app-audiences" },
  { path: "/timeline", name: "app-timeline" },
  { path: "/tasks", name: "app-tasks" },
  { path: "/programacao", name: "app-programming" },
];

const VIEWPORTS = [
  { name: "desktop", w: 1440, h: 900 },
  { name: "mobile", w: 390, h: 844 },
];

const browser = await puppeteer.launch({
  executablePath: EXECUTABLE,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log(`→ Login ${EMAIL} em ${BASE}`);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });

  await page.waitForSelector("#email");
  await page.type("#email", EMAIL, { delay: 12 });
  await page.type("#password", PASSWORD, { delay: 12 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click("button[type=submit]"),
  ]);

  if (!page.url().includes("/dashboard")) {
    console.error(`Login falhou. URL atual: ${page.url()}`);
    process.exit(2);
  }
  console.log("✓ Logado");

  // Dismiss tutorial modal if shown
  try {
    await page.waitForSelector("[role=dialog]", { timeout: 2000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const skip = btns.find((b) => /pular|fechar/i.test(b.textContent ?? ""));
      skip?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
  } catch {}

  // Dismiss cookies banner
  await page.evaluate(() => {
    try { localStorage.setItem("kaira_cookies_consent", "all"); } catch {}
  });

  // Dismiss security prompt if appears
  try {
    await page.evaluate(() => {
      try { localStorage.setItem("kaira_security_prompted", "dismissed"); } catch {}
    });
  } catch {}

  for (const vp of VIEWPORTS) {
    console.log(`\n— Viewport ${vp.name} (${vp.w}x${vp.h}) —`);
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    for (const p of PAGES) {
      const out = `${OUT_DIR}/${p.name}-${vp.name}.png`;
      console.log(`→ ${p.path} → ${p.name}-${vp.name}.png`);
      await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 1500)); // animações + lazy data
      await page.screenshot({ path: out, fullPage: false });
    }
  }

  console.log("\n✓ Done. Screenshots em public/screenshots/");
} finally {
  await browser.close();
}
