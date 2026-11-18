// Works around a Next 16 static-export bug on WINDOWS builds.
// next/dist/export writes each segment prefetch file as `__next` + segmentPath.replace(/\//g, '.')
// + '.txt', but on Windows the segment path uses backslashes, so instead of
//   out/bn/play/__next.$d$lang.play.__PAGE__.txt
// it writes the nested
//   out/bn/play/__next.$d$lang/play/__PAGE__.txt
// and the client router's prefetches 404. This moves such files to the flat name.
// On Linux/macOS (and CI hosts) there is nothing to fix and it does nothing.
import { readdir, rename, rm, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const OUT = 'out'
let fixed = 0

async function filesUnder(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await filesUnder(p)))
    else out.push(p)
  }
  return out
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('__next.') || entry.name === '__next') {
      // A directory that should have been part of a flat filename.
      for (const file of await filesUnder(p)) {
        const rest = relative(p, file).split(sep).join('.') // play/__PAGE__.txt -> play.__PAGE__.txt
        await rename(file, join(dir, `${entry.name}.${rest}`))
        fixed++
      }
      await rm(p, { recursive: true, force: true })
    } else if (entry.name !== '_next') {
      await walk(p)
    }
  }
}

try {
  await stat(OUT)
  await walk(OUT)
  if (fixed) console.log(`fix-export-segments: flattened ${fixed} segment file(s) (Windows build)`)
} catch (err) {
  if (err.code !== 'ENOENT') throw err
}
