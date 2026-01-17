export const revalidate = 3600
export const dynamic = "force-dynamic"

export async function GET() {
  const { fetchSnapshot, asNumber, asString, safeJsonArray } = await import("@/lib/snapshot")
  const snapshot = await fetchSnapshot()

  const products = snapshot.products.map((p) => ({
    product_code: asString(p["product_code"]),
    representative_sku: asString(p["representative_sku"]),
    rating: (asString(p["rating"]) || null) as "S" | "A" | "B" | "C" | "D" | "E" | null,
    product_name: asString(p["product_name"]),
    stock_sum: asNumber(p["stock_sum"]),
    sales_units_m: asNumber(p["sales_units_m"]),
    access_m: asNumber(p["access_m"]),
    cv_m: asNumber(p["cv_m"]),
    badges: safeJsonArray(p["badges"]),
  }))

  return Response.json({ products, generated_at: snapshot.generated_at })
}


