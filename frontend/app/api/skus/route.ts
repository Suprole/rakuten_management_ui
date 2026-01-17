export const revalidate = 3600
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const productCode = url.searchParams.get("product_code")

  if (!productCode) {
    return Response.json({ error: "product_code is required" }, { status: 400 })
  }

  const { fetchSnapshot, asString } = await import("@/lib/snapshot")
  const snapshot = await fetchSnapshot()

  const skus = snapshot.skus.filter((s) => asString(s["product_code"]) === productCode)
  return Response.json({ product_code: productCode, skus, generated_at: snapshot.generated_at })
}


