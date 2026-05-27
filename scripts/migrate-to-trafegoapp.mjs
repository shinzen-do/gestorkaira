// Roda todas as migrations contra o projeto Supabase via Management API.
// Uso: PAT=sbp_... PROJECT_REF=... node scripts/migrate-to-trafegoapp.mjs

import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const PAT = process.env.PAT
const PROJECT_REF = process.env.PROJECT_REF
const MIG_DIR = process.env.MIG_DIR || 'supabase/migrations'

if (!PAT || !PROJECT_REF) {
  console.error('Defina PAT e PROJECT_REF.')
  process.exit(1)
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

async function runSql(sql, label, attempt = 1) {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(60_000),
    })
    const text = await resp.text()
    if (!resp.ok) {
      console.error(`✗ ${label}: HTTP ${resp.status}`)
      console.error(text.slice(0, 500))
      process.exit(1)
    }
    return text
  } catch (e) {
    if (attempt < 3) {
      console.log(`(retry ${attempt + 1}…)`)
      await new Promise((r) => setTimeout(r, 2000))
      return runSql(sql, label, attempt + 1)
    }
    throw e
  }
}

const files = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort()
console.log(`→ ${files.length} migrations encontradas em ${MIG_DIR}`)

for (const f of files) {
  const path = resolve(MIG_DIR, f)
  const sql = readFileSync(path, 'utf8')
  process.stdout.write(`  ${f} … `)
  try {
    await runSql(sql, f)
    console.log('OK')
  } catch (e) {
    console.log('FAIL')
    console.error(e)
    process.exit(1)
  }
}

console.log('\n✓ Todas as migrations rodaram.')
