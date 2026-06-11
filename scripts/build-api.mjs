// Bundles the Hono server into a single ESM file at api/index.js for Vercel.
// Everything is inlined except @prisma/client (its generated engine must be
// loaded from node_modules, which Vercel traces automatically).
import { build } from 'esbuild'

await build({
  entryPoints: ['server/vercel.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'api/index.js',
  external: ['@prisma/client'],
  banner: {
    // CJS deps bundled into ESM output may reference require()
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
})

console.log('api/index.js bundled')
