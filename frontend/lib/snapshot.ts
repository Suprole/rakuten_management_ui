export type SnapshotRow = Record<string, unknown>

export interface Snapshot {
  generated_at: string
  products: SnapshotRow[]
  skus: SnapshotRow[]
  notes: SnapshotRow[]
  settings: SnapshotRow[]
}

const SNAPSHOT_URL = process.env.SNAPSHOT_URL

export async function fetchSnapshot(options?: { revalidate?: number; cache?: RequestCache }): Promise<Snapshot> {
  if (!SNAPSHOT_URL) {
    throw new Error("Missing env var: SNAPSHOT_URL")
  }

  const revalidate = options?.revalidate ?? 3600
  const cache = options?.cache

  const res = await fetch(SNAPSHOT_URL, {
    // 更新頻度: 60分（要件）。ただしnotes等は no-store で即時反映させることがある。
    ...(cache ? { cache } : { next: { revalidate } }),
    headers: { accept: "application/json" },
  })

  if (!res.ok) {
    throw new Error(`SNAPSHOT_URL fetch failed: ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as Snapshot
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v)
}

export function asNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  const n = Number(asString(v).replace(/[¥,%\s]/g, "").replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function safeJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => asString(x)).filter(Boolean)
  if (typeof v !== "string") return []
  try {
    const parsed = JSON.parse(v)
    return Array.isArray(parsed) ? parsed.map((x) => asString(x)).filter(Boolean) : []
  } catch {
    return []
  }
}

export function settingsToMap(settingsRows: SnapshotRow[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const row of settingsRows) {
    const key = asString(row["key"]).trim()
    if (!key) continue
    out[key] = row["value"]
  }
  return out
}


