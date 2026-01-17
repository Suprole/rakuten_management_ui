export const revalidate = 3600
export const dynamic = "force-dynamic"

const PRODUCT_NUM_FIELDS = new Set([
  "sku_count",
  "oos_sku_count",
  "stock_sum",
  "sales_units_m",
  "sales_units_lm",
  "sales_amount_m",
  "sales_amount_lm",
  "profit_m",
  "profit_lm",
  "access_m",
  "access_lm",
  "cv_m",
  "cv_lm",
  "bounce_m",
  "bounce_lm",
  "stay_m",
  "stay_lm",
  "fav_add_m",
  "fav_add_lm",
  "fav_total",
  "orders_total_m",
  "orders_total_lm",
  "orders_new_m",
  "orders_new_lm",
  "orders_rep_m",
  "orders_rep_lm",
  "reviews_post_m",
  "reviews_post_lm",
  "reviews_total",
  "min_setting_margin",
  "max_setting_margin",
  "min_setting_unit_profit",
  "access_diff",
  "cv_diff",
  "sales_units_diff",
  "profit_diff",
  "new_ratio_m",
  "rep_ratio_m",
])

function normalizeProductRow(
  row: Record<string, unknown>,
  helpers: {
    asString: (v: unknown) => string
    asNumber: (v: unknown) => number
    safeJsonArray: (v: unknown) => string[]
  },
) {
  const { asString, asNumber, safeJsonArray } = helpers
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (k === "badges") {
      out[k] = safeJsonArray(v)
      continue
    }
    if (PRODUCT_NUM_FIELDS.has(k)) {
      out[k] = asNumber(v)
      continue
    }
    out[k] = asString(v)
  }
  out["rating"] = (asString(row["rating"]) || null) as "S" | "A" | "B" | "C" | "D" | "E" | null
  return out
}

export async function GET(req: Request) {
  try {
    const { fetchSnapshot, asNumber, asString, safeJsonArray } = await import("@/lib/snapshot")
    const snapshot = await fetchSnapshot()

    const url = new URL(req.url)
    const productCode = url.searchParams.get("product_code")

    // 詳細取得（仕様書 §6.2 の全列を返す）
    if (productCode) {
      const hit =
        snapshot.products.find((p) => asString(p["product_code"]) === productCode) ??
        null
      if (!hit) {
        return Response.json({ error: "not_found" }, { status: 404 })
      }
      const product = normalizeProductRow(hit, { asString, asNumber, safeJsonArray })
      return Response.json({ product, generated_at: snapshot.generated_at })
    }

    // notesを一覧にも反映（保存後すぐ見えるように）
    const notesByProduct: Record<string, { rating: string | null }> = {}
    for (const n of snapshot.notes) {
      const pc = asString(n["product_code"]).trim()
      if (!pc) continue
      const r = (asString(n["rating"]) || "").trim()
      notesByProduct[pc] = { rating: r || null }
    }

    // 一覧用（軽量）
    const products = snapshot.products.map((p) => ({
      product_code: asString(p["product_code"]),
      representative_sku: asString(p["representative_sku"]),
      sku_count: asNumber(p["sku_count"]),
      rating: ((notesByProduct[asString(p["product_code"])]?.rating ?? asString(p["rating"])) || null) as
        | "S"
        | "A"
        | "B"
        | "C"
        | "D"
        | "E"
        | null,
      product_name: asString(p["product_name"]),
      stock_sum: asNumber(p["stock_sum"]),
      sales_units_m: asNumber(p["sales_units_m"]),
      access_m: asNumber(p["access_m"]),
      cv_m: asNumber(p["cv_m"]),
      badges: safeJsonArray(p["badges"]),
    }))

    return Response.json({ products, generated_at: snapshot.generated_at })
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error"
    return Response.json(
      {
        error: "failed_to_load_snapshot",
        message,
        hint:
          "VercelのEnvironment Variablesに (SNAPSHOT_URL) または (SNAPSHOT_GCS_BUCKET + SNAPSHOT_GCS_OBJECT + GCP_SERVICE_ACCOUNT_KEY) が設定されているか確認してください。",
      },
      { status: 500 },
    )
  }
}


