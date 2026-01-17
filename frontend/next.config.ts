import type { NextConfig } from "next"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const configDir = dirname(__filename)
const repoRoot = resolve(configDir, "..")

const nextConfig: NextConfig = {
  // Vercel環境では `outputFileTracingRoot` と `turbopack.root` が一致している必要があるため、
  // monorepo(frontend/)でもリポジトリルートに揃える。
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
}

export default nextConfig

