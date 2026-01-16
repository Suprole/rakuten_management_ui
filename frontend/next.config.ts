import type { NextConfig } from "next"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const configDir = dirname(__filename)

const nextConfig: NextConfig = {
  turbopack: {
    root: configDir,
  },
}

export default nextConfig

