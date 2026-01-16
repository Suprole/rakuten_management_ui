"use client"

import { useEffect, useMemo, useState } from "react"
import type { ProductSummary } from "@/types/product"

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
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && <div className="text-sm text-gray-600">読み込み中...</div>}
        {error && <div className="text-sm text-red-600">エラー: {error}</div>}

        {!loading && !error && !selected && (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">商品管理番号</th>
                  <th className="px-3 py-2 text-left">代表SKU</th>
                  <th className="px-3 py-2 text-left">評価</th>
                  <th className="px-3 py-2 text-left">商品名</th>
                  <th className="px-3 py-2 text-right">在庫</th>
                  <th className="px-3 py-2 text-right">今月売上個数</th>
                  <th className="px-3 py-2 text-right">今月アクセス</th>
                  <th className="px-3 py-2 text-right">今月CV</th>
                  <th className="px-3 py-2 text-left">バッジ</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.product_code}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-3 py-2 font-mono">{p.product_code}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{p.representative_sku}</td>
                    <td className="px-3 py-2">{p.rating ?? ""}</td>
                    <td className="px-3 py-2 max-w-[420px] truncate">{p.product_name}</td>
                    <td className="px-3 py-2 text-right">{p.stock_sum.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{p.sales_units_m.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{p.access_m.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{p.cv_m.toFixed(2)}%</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.badges.slice(0, 3).map((b, i) => (
                          <span key={i} className="rounded border px-2 py-0.5 text-xs">
                            {b}
                          </span>
                        ))}
                        {p.badges.length > 3 && (
                          <span className="rounded border px-2 py-0.5 text-xs">+{p.badges.length - 3}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && selected && (
          <div className="space-y-4">
            <button className="rounded border px-3 py-2 text-sm" onClick={() => setSelected(null)}>
              戻る
            </button>
            <div className="rounded border p-4">
              <div className="text-sm text-gray-600">商品管理番号: <span className="font-mono">{selected.product_code}</span></div>
              <div className="text-sm text-gray-600 mt-1">代表SKU: <span className="font-mono">{selected.representative_sku}</span></div>
              <h2 className="mt-3 text-lg font-bold">{selected.product_name}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <div className="rounded border px-3 py-2">在庫: {selected.stock_sum}</div>
                <div className="rounded border px-3 py-2">今月売上: {selected.sales_units_m}</div>
                <div className="rounded border px-3 py-2">今月アクセス: {selected.access_m}</div>
                <div className="rounded border px-3 py-2">今月CV: {selected.cv_m.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

