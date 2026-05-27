import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const input = 'src/assets/kaira-logo.png'
const buf = readFileSync(input)

const meta = await sharp(buf).metadata()
console.log(`original: ${meta.width}×${meta.height} ${(buf.byteLength / 1024).toFixed(1)}KB`)

await sharp(buf).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90 }).toFile('src/assets/kaira-logo.webp')
await sharp(buf).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9, palette: true }).toFile('src/assets/kaira-logo-96.png')
await sharp(buf).resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 92 }).toFile('src/assets/kaira-logo-2x.webp')

const { size: webpSize } = await sharp('src/assets/kaira-logo.webp').toBuffer({ resolveWithObject: true }).then(r => r.info)
const { size: pngSize } = await sharp('src/assets/kaira-logo-96.png').toBuffer({ resolveWithObject: true }).then(r => r.info)
const { size: webp2x } = await sharp('src/assets/kaira-logo-2x.webp').toBuffer({ resolveWithObject: true }).then(r => r.info)

console.log(`webp 96px:    ${(webpSize / 1024).toFixed(1)}KB`)
console.log(`webp 192px:   ${(webp2x / 1024).toFixed(1)}KB`)
console.log(`png 96px:     ${(pngSize / 1024).toFixed(1)}KB`)
