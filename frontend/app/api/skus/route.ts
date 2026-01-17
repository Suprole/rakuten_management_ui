export const revalidate = 3600
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const productCode = url.searchParams.get("product_code")

    if (!productCode) {
      return Response.json({ error: "product_code is required" }, { status: 400 })
    }

    const { fetchSnapshot, asString } = await import("@/lib/snapshot")
    const snapshot = await fetchSnapshot()

    const skus = snapshot.skus.filter((s) => asString(s["product_code"]) === productCode)
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


