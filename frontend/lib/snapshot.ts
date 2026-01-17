export type SnapshotRow = Record<string, unknown>

export interface Snapshot {
  generated_at: string
  products: SnapshotRow[]
  skus: SnapshotRow[]
  notes: SnapshotRow[]
  settings: SnapshotRow[]
}

const SNAPSHOT_URL = process.env.SNAPSHOT_URL
const SNAPSHOT_GCS_BUCKET = process.env.SNAPSHOT_GCS_BUCKET
const SNAPSHOT_GCS_OBJECT = process.env.SNAPSHOT_GCS_OBJECT ?? "snapshot.json"
const GCP_SERVICE_ACCOUNT_KEY = process.env.GCP_SERVICE_ACCOUNT_KEY

type ServiceAccountKey = {
  project_id?: string
  client_email?: string
  private_key?: string
}

async function fetchSnapshotFromGcs(): Promise<Snapshot> {
  if (!SNAPSHOT_GCS_BUCKET) throw new Error("Missing env var: SNAPSHOT_GCS_BUCKET")
  if (!GCP_SERVICE_ACCOUNT_KEY) throw new Error("Missing env var: GCP_SERVICE_ACCOUNT_KEY")

  let key: ServiceAccountKey
  try {
    key = JSON.parse(GCP_SERVICE_ACCOUNT_KEY) as ServiceAccountKey
  } catch {
    throw new Error("Invalid JSON in env var: GCP_SERVICE_ACCOUNT_KEY")
  }

  const { Storage } = await import("@google-cloud/storage")
  const storage = new Storage({
    projectId: key.project_id,
    credentials: {
      client_email: key.client_email,
      private_key: key.private_key,
    },
  })

  const [buf] = await storage.bucket(SNAPSHOT_GCS_BUCKET).file(SNAPSHOT_GCS_OBJECT).download()
  return JSON.parse(buf.toString("utf-8")) as Snapshot
}

export async function fetchSnapshot(options?: { revalidate?: number; cache?: RequestCache }): Promise<Snapshot> {
  // 優先順位:
  // 1) SNAPSHOT_URL（公開/社内URLなどでHTTP取得）
  // 2) 非公開GCS（サービスアカウントで取得）: SNAPSHOT_GCS_BUCKET + GCP_SERVICE_ACCOUNT_KEY
  if (!SNAPSHOT_URL) {
    return await fetchSnapshotFromGcs()
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


