export const revalidate = 3600
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { fetchSnapshot, settingsToMap, asNumber, asString } = await import("@/lib/snapshot")
    const snapshot = await fetchSnapshot()
    const m = settingsToMap(snapshot.settings)

    // settingsシートのkey/valueを想定。未設定はデフォルトへフォールバック。
    const tax_rate = m["tax_rate"] !== undefined ? asNumber(m["tax_rate"]) : 0.1
    const fee_rate = m["fee_rate"] !== undefined ? asNumber(m["fee_rate"]) : 0.07
    const default_point_rate = m["default_point_rate"] !== undefined ? asNumber(m["default_point_rate"]) : 0.01

    // 送料テーブル（仕様書 §6.5）
    // - 互換: settingsが旧key/valueのみの場合はダミーを返す
    const shipping_costs_in_tax = snapshot.settings
      .map((row) => ({
        shipping_type: asString((row as Record<string, unknown>)["shipping_type"]).trim(),
        shipping_cost_in_tax: asNumber((row as Record<string, unknown>)["shipping_cost_in_tax"]),
      }))
      .filter((x) => x.shipping_type)

    // 閾値JSON（あれば）
    let badge_thresholds: Record<string, unknown> = {}
    if (m["badge_thresholds_json"] !== undefined) {
      try {
        badge_thresholds = JSON.parse(asString(m["badge_thresholds_json"]))
      } catch {
        badge_thresholds = {}
      }
    }

    const shippingTable = shipping_costs_in_tax.length > 0 ? shipping_costs_in_tax : [{ shipping_type: "default", shipping_cost_in_tax: 800 }]

    return Response.json({
      tax_rate,
      fee_rate,
      default_point_rate,
      shipping_costs_in_tax: shippingTable,
      badge_thresholds,
      generated_at: snapshot.generated_at,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error"
    return Response.json(
      {
        error: "failed_to_load_snapshot",
        message,
      },
      { status: 500 },
    )
  }
}


