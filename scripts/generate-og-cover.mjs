// Gera /public/og-cover.png — 1200x630, dark luxury com logo + headline.

import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const W = 1200
const H = 630

const logoBuf = readFileSync('src/assets/kaira-logo.png')
const logo = await sharp(logoBuf).resize(140, 140, { fit: 'contain' }).png().toBuffer()

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="100%" stop-color="#11131a" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#3b6cff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#3b6cff" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4a766" />
      <stop offset="100%" stop-color="#f0d088" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />

  <g stroke="#1c1f29" stroke-width="1" opacity="0.6">
    <line x1="0" y1="158" x2="${W}" y2="158" />
    <line x1="0" y1="${H - 80}" x2="${W}" y2="${H - 80}" />
  </g>

  <text x="80" y="100" font-family="Georgia, serif" font-size="20" letter-spacing="8" fill="url(#gold)">KAIRA</text>

  <text x="80" y="260" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#f5f5f7">Pare de gerenciar campanhas</text>
  <text x="80" y="340" font-family="Georgia, serif" font-size="64" font-weight="700" fill="url(#gold)">no improviso.</text>

  <text x="80" y="420" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="26" fill="#a1a1aa">Central de comando para gestores de tráfego de elite.</text>

  <g transform="translate(80, 480)">
    <rect x="0" y="0" width="180" height="40" rx="6" fill="#3b6cff" />
    <text x="90" y="26" font-family="-apple-system, sans-serif" font-size="16" font-weight="600" text-anchor="middle" fill="#ffffff">Começar Grátis</text>

    <rect x="200" y="0" width="160" height="40" rx="6" stroke="#27272a" fill="none" />
    <text x="280" y="26" font-family="-apple-system, sans-serif" font-size="16" fill="#a1a1aa" text-anchor="middle">R$ 47/mês</text>
  </g>

  <text x="${W - 80}" y="${H - 40}" font-family="-apple-system, sans-serif" font-size="14" fill="#52525b" text-anchor="end">kaira.app · ${new Date().getFullYear()}</text>
</svg>
`

await sharp(Buffer.from(svg))
  .composite([{ input: logo, top: 60, left: W - 220 }])
  .png({ quality: 90, compressionLevel: 9 })
  .toFile('public/og-cover.png')

console.log('✓ public/og-cover.png gerado')
