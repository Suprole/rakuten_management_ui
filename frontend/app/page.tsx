"use client"

import { useEffect, useMemo, useState } from "react"
import type { ProductSummary } from "@/types/product"
import { ProductList } from "@/components/product-list"
import { ProductDetail } from "@/components/product-detail"

export default function Page() {
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProductSummary | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/products", { cache: "no-store" })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = (await res.json()) as { products: ProductSummary[] }
      setProducts(data.products ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error")
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード
  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 詳細→一覧へ戻ったタイミングで再取得（評価/メモなどの更新を反映）
  useEffect(() => {
    if (selected === null) {
      // 過剰fetchを避けるため、一覧表示中のみトリガ（初回もここに入るが許容）
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const title = useMemo(() => (selected ? "商品詳細" : "商品一覧"), [selected])

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-xl font-bold">楽天市場 商品可視化ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && <div className="text-sm text-muted-foreground">読み込み中...</div>}
        {error && <div className="text-sm text-destructive">エラー: {error}</div>}

        {!loading && !error && !selected && <ProductList products={products} onSelectProduct={setSelected} />}

        {!loading && !error && selected && <ProductDetail product={selected} onBack={() => setSelected(null)} />}
      </main>
    </div>
  )
}

