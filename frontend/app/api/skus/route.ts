export const revalidate = 3600
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const productCode = url.searchParams.get("product_code")

    if (!productCode) {
      return Response.json({ error: "product_code is required" }, { status: 400 })
    }

    const { fetchSnapshot, asString, asNumber } = await import("@/lib/snapshot")
    const snapshot = await fetchSnapshot()

    const skus = snapshot.skus
      .filter((s) => asString(s["product_code"]) === productCode)
      .map((s) => ({
        product_code: asString(s["product_code"]),
        sku_code: asString(s["sku_code"]),
        shipping_type: asString(s["shipping_type"]),
        cost_ex_tax: asNumber(s["cost_ex_tax"]),
        stock: asNumber(s["stock"]),
        stock0_days: asNumber(s["stock0_days"]),
        price_in_tax: asNumber(s["price_in_tax"]),
        sales_units_m: asNumber(s["sales_units_m"]),
        sales_units_lm: asNumber(s["sales_units_lm"]),
        sales_amount_m: asNumber(s["sales_amount_m"]),
        profit_m: asNumber(s["profit_m"]),
        setting_unit_profit: asNumber(s["setting_unit_profit"]),
        setting_margin: asNumber(s["setting_margin"]),
        updated_at: asString(s["updated_at"]),
      }))
    return Response.json({ product_code: productCode, skus, generated_at: snapshot.generated_at })
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


