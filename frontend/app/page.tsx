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

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/products")
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const data = (await res.json()) as { products: ProductSummary[] }
        setProducts(data.products ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown error")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

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

