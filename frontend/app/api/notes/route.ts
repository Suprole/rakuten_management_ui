export const revalidate = 0

export async function GET(req: Request) {
  const url = new URL(req.url)
  const productCode = url.searchParams.get("product_code")

  if (!productCode) {
    return Response.json({ error: "product_code is required" }, { status: 400 })
  }

  const { fetchSnapshot, asString } = await import("@/lib/snapshot")
  // notesは保存直後の反映を優先するため no-store で読む（一覧等は通常revalidate）
  const snapshot = await fetchSnapshot({ cache: "no-store" })

  const note = snapshot.notes.find((n) => asString(n["product_code"]) === productCode) ?? null
  return Response.json({
    product_code: productCode,
    rating: note ? ((asString(note["rating"]) || null) as "S" | "A" | "B" | "C" | "D" | "E" | null) : null,
    memo: note ? asString(note["memo"]) : "",
    updated_at: note ? (asString(note["updated_at"]) || null) : null,
    generated_at: snapshot.generated_at,
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { product_code?: string; rating?: string | null; memo?: string | null }
    | null

  if (!body?.product_code) {
    return Response.json({ error: "product_code is required" }, { status: 400 })
  }

  const product_code = body.product_code
  const rating = body.rating ?? null
  const memo = body.memo ?? ""

  // GAS WebAppへ書き込み（高速: 書き込み後すぐsnapshotを再出力し、読み取りはGCSスナップショットに寄せる）
  const NOTES_WEBAPP_URL = process.env.NOTES_WEBAPP_URL
  const NOTES_WEBAPP_TOKEN = process.env.NOTES_WEBAPP_TOKEN

  if (!NOTES_WEBAPP_URL || !NOTES_WEBAPP_TOKEN) {
    return Response.json(
      { error: "NOTES_WEBAPP_URL / NOTES_WEBAPP_TOKEN is not configured" },
      { status: 501 },
    )
  }

  const res = await fetch(NOTES_WEBAPP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webapp-token": NOTES_WEBAPP_TOKEN,
    },
    body: JSON.stringify({
      action: "saveNote",
      product_code,
      rating,
      memo,
      export_snapshot: true,
    }),
  })

  const data = (await res.json().catch(() => null)) as
    | { product_code: string; rating: string | null; memo: string; updated_at: string }
    | { error: string }
    | null

  if (!res.ok) {
    return Response.json(
      { error: (data && "error" in data && data.error) || `notes write failed: ${res.status}` },
      { status: 502 },
    )
  }

  return Response.json(data)
}


