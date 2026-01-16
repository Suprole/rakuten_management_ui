"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import type { ProductSummary } from "@/types/product"
import { cn } from "@/lib/utils"

interface ProductDetailProps {
  product: ProductSummary
  onBack: () => void
}

interface ComparisonCardProps {
  title: string
  currentValue: number | string
  previousValue: number | string
  unit?: string
  changePercent: number
  formatValue?: (val: number | string) => string
}

function ComparisonCard({
  title,
  currentValue,
  previousValue,
  unit = "",
  changePercent,
  formatValue,
}: ComparisonCardProps) {
  const current = typeof currentValue === "string" ? Number.parseFloat(currentValue) : currentValue
  const previous = typeof previousValue === "string" ? Number.parseFloat(previousValue) : previousValue
  const maxValue = Math.max(current, previous)

  const currentHeight = maxValue > 0 ? (current / maxValue) * 100 : 0
  const previousHeight = maxValue > 0 ? (previous / maxValue) * 100 : 0

  const displayCurrent = formatValue ? formatValue(currentValue) : `${currentValue}${unit}`
  const displayPrevious = formatValue ? formatValue(previousValue) : `${previousValue}${unit}`

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <Badge
          variant={changePercent >= 0 ? "default" : "destructive"}
          className={cn(changePercent >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white")}
        >
          {changePercent > 0 ? "+" : ""}
          {changePercent}%
        </Badge>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-foreground">{displayCurrent}</div>
        <div className="text-sm text-muted-foreground">先月 {displayPrevious}</div>
      </div>

      <div className="flex items-end gap-4 h-32">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full relative flex items-end justify-center" style={{ height: "100px" }}>
            <div className="w-full bg-muted rounded-t transition-all" style={{ height: `${previousHeight}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">先月</div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="w-full relative flex items-end justify-center" style={{ height: "100px" }}>
            <div className="w-full bg-primary rounded-t transition-all" style={{ height: `${currentHeight}%` }} />
          </div>
          <div className="text-xs text-foreground font-medium mt-2">今月</div>
        </div>
      </div>
    </Card>
  )
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const [productRating, setProductRating] = useState<NonNullable<ProductSummary["rating"]>>(product.rating || "C")
  const [memo, setMemo] = useState("")
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null)
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [simulatorPrice, setSimulatorPrice] = useState("2000")
  const [simulatorShipping, setSimulatorShipping] = useState("800")
  const [simulatorCost, setSimulatorCost] = useState("1000")
  const [simulatorPoint, setSimulatorPoint] = useState("1")
  const [simulatorCoupon, setSimulatorCoupon] = useState("0")

  useEffect(() => {
    const run = async () => {
      try {
        setNoteLoading(true)
        setNoteError(null)
        const res = await fetch(`/api/notes?product_code=${encodeURIComponent(product.product_code)}`, { cache: "no-store" })
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const data = (await res.json()) as {
          product_code: string
          rating: ProductSummary["rating"]
          memo: string
          updated_at: string | null
        }
        if (data.rating) setProductRating(data.rating)
        setMemo(data.memo ?? "")
        setNoteUpdatedAt(data.updated_at ?? null)
      } catch (e) {
        setNoteError(e instanceof Error ? e.message : "unknown error")
      } finally {
        setNoteLoading(false)
      }
    }
    run()
  }, [product.product_code])

  const saveNote = async () => {
    try {
      setNoteSaving(true)
      setNoteError(null)
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product_code: product.product_code,
          rating: productRating,
          memo,
        }),
      })
      const data = (await res.json().catch(() => null)) as
        | { product_code: string; rating: ProductSummary["rating"]; memo: string; updated_at: string }
        | { error: string }
        | null
      if (!res.ok) {
        const msg = data && "error" in data ? data.error : `${res.status} ${res.statusText}`
        throw new Error(msg)
      }
      if (data && "updated_at" in data) setNoteUpdatedAt(data.updated_at)
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : "unknown error")
    } finally {
      setNoteSaving(false)
    }
  }

  const calculateProfit = () => {
    const priceInTax = Number.parseFloat(simulatorPrice) || 0
    const shippingCostInTax = Number.parseFloat(simulatorShipping) || 0
    const costExTax = Number.parseFloat(simulatorCost) || 0
    const pointRate = (Number.parseFloat(simulatorPoint) || 0) / 100
    const couponInTax = Number.parseFloat(simulatorCoupon) || 0
    const feeRate = 0.07
    const taxRate = 0.1

    const netInTax = priceInTax * (1 - feeRate - pointRate) - couponInTax
    const netExTax = (netInTax - shippingCostInTax) / (1 + taxRate)
    const profitExTax = netExTax - costExTax
    const margin = profitExTax / (priceInTax / (1 + taxRate))

    return {
      profit: profitExTax,
      margin: margin * 100,
      netInTax,
    }
  }

  const { profit, margin } = calculateProfit()

  const mockComparison = {
    sales_amount_m: product.sales_units_m * 2000,
    sales_amount_lm: product.sales_units_m * 1.15 * 2000,
    profit_m: product.sales_units_m * 600,
    profit_lm: product.sales_units_m * 1.08 * 600,
    sales_units_lm: Math.round(product.sales_units_m * 1.1),
    margin_m: 28.5,
    margin_lm: 30.0,
    access_lm: Math.round(product.access_m * 1.12),
    cv_lm: product.cv_m * 1.05,
    new_ratio_m: 85,
    new_ratio_lm: 82,
    repeat_ratio_m: 15,
    repeat_ratio_lm: 18,
  }

  const mockSkus = [
    { sku: product.representative_sku, stock: product.stock_sum, sales: product.sales_units_m, margin: 25.5 },
    { sku: `${product.representative_sku}-V2`, stock: 15, sales: 8, margin: 28.2 },
  ]

  const getBadgeVariant = (badge: string) => {
    const goodBadges = ["高転換率", "超高転換率", "人気商品", "優良商品", "高評価", "在庫豊富"]
    const badBadges = ["欠品", "赤字", "売上0", "CV低下", "要改善", "要注意", "低在庫"]

    if (badBadges.some((b) => badge.includes(b))) return "destructive"
    if (goodBadges.some((b) => badge.includes(b))) return "default"
    return "secondary"
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "S":
        return "bg-purple-500 text-white"
      case "A":
        return "bg-blue-500 text-white"
      case "B":
        return "bg-green-500 text-white"
      case "C":
        return "bg-yellow-500 text-black"
      case "D":
        return "bg-orange-500 text-white"
      case "E":
        return "bg-red-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Header Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{product.product_name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  商品管理番号: <span className="font-mono text-foreground">{product.product_code}</span>
                </span>
                <span>
                  代表SKU: <span className="font-mono text-foreground">{product.representative_sku}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {product.badges.map((badge, idx) => (
                <Badge key={idx} variant={getBadgeVariant(badge)}>
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">先月 vs 今月 比較</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ComparisonCard
              title="売上金額"
              currentValue={mockComparison.sales_amount_m}
              previousValue={mockComparison.sales_amount_lm}
              changePercent={-13}
              formatValue={(val) => `¥${Number(val).toLocaleString()}`}
            />
            <ComparisonCard
              title="利益"
              currentValue={mockComparison.profit_m}
              previousValue={mockComparison.profit_lm}
              changePercent={-7}
              formatValue={(val) => `¥${Number(val).toLocaleString()}`}
            />
            <ComparisonCard
              title="売上個数"
              currentValue={product.sales_units_m}
              previousValue={mockComparison.sales_units_lm}
              changePercent={-9}
            />
            <ComparisonCard
              title="利益率"
              currentValue={mockComparison.margin_m}
              previousValue={mockComparison.margin_lm}
              changePercent={-5}
              formatValue={(val) => `${Number(val).toFixed(1)}%`}
            />
            <ComparisonCard
              title="アクセス人数"
              currentValue={product.access_m}
              previousValue={mockComparison.access_lm}
              changePercent={-11}
              formatValue={(val) => Number(val).toLocaleString()}
            />
            <ComparisonCard
              title="転換率"
              currentValue={product.cv_m}
              previousValue={mockComparison.cv_lm}
              changePercent={3}
              formatValue={(val) => `${Number(val).toFixed(2)}%`}
            />
            <ComparisonCard
              title="新規購入比率"
              currentValue={mockComparison.new_ratio_m}
              previousValue={mockComparison.new_ratio_lm}
              changePercent={4}
              formatValue={(val) => `${val}%`}
            />
            <ComparisonCard
              title="リピート購入比率"
              currentValue={mockComparison.repeat_ratio_m}
              previousValue={mockComparison.repeat_ratio_lm}
              changePercent={-17}
              formatValue={(val) => `${val}%`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* SKU Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">SKU内訳</h3>
            <div className="space-y-3">
              {mockSkus.map((sku, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                  <div>
                    <div className="font-mono text-sm text-foreground">{sku.sku}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      在庫: {sku.stock} / 今月売上: {sku.sales}個
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{sku.margin}%</div>
                    <div className="text-xs text-muted-foreground">利益率</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 商品評価・メモ */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">商品評価・メモ</h3>
            <div className="space-y-4">
              {noteLoading && <div className="text-sm text-muted-foreground">読み込み中...</div>}
              {noteError && <div className="text-sm text-destructive">エラー: {noteError}</div>}
              <div>
                <Label className="text-sm text-foreground mb-2 block">商品評価（S,A,B,C,D,E）</Label>
                <Select
                  value={productRating}
                  onValueChange={(value) => setProductRating(value as NonNullable<ProductSummary["rating"]>)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">
                      <Badge className="bg-purple-500 text-white">S - 最優良</Badge>
                    </SelectItem>
                    <SelectItem value="A">
                      <Badge className="bg-blue-500 text-white">A - 優良</Badge>
                    </SelectItem>
                    <SelectItem value="B">
                      <Badge className="bg-green-500 text-white">B - 良好</Badge>
                    </SelectItem>
                    <SelectItem value="C">
                      <Badge className="bg-yellow-500 text-black">C - 普通</Badge>
                    </SelectItem>
                    <SelectItem value="D">
                      <Badge className="bg-orange-500 text-white">D - 要改善</Badge>
                    </SelectItem>
                    <SelectItem value="E">
                      <Badge className="bg-red-500 text-white">E - 要対策</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 text-xs text-muted-foreground">
                  現在の評価: <Badge className={cn("ml-1", getRatingColor(productRating))}>{productRating}</Badge>
                </div>
              </div>
              <div>
                <Label htmlFor="memo" className="text-sm text-foreground mb-2 block">
                  運用メモ
                </Label>
                <Textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="この商品についての気づきやメモを記入..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                最終更新: {noteUpdatedAt ? new Date(noteUpdatedAt).toLocaleString() : "-"}
              </div>
              <Button className="w-full" onClick={saveNote} disabled={noteSaving || noteLoading}>
                {noteSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Profit Simulator */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">利益シミュレーター</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="text-sm text-foreground mb-2 block">
                  販売価格（税込）
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={simulatorPrice}
                  onChange={(e) => setSimulatorPrice(e.target.value)}
                  placeholder="2000"
                />
              </div>
              <div>
                <Label htmlFor="shipping" className="text-sm text-foreground mb-2 block">
                  送料（税込）
                </Label>
                <Input
                  id="shipping"
                  type="number"
                  value={simulatorShipping}
                  onChange={(e) => setSimulatorShipping(e.target.value)}
                  placeholder="800"
                />
              </div>
              <div>
                <Label htmlFor="cost" className="text-sm text-foreground mb-2 block">
                  仕入れ値（税抜）
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={simulatorCost}
                  onChange={(e) => setSimulatorCost(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="point" className="text-sm text-foreground mb-2 block">
                  ポイント倍率（%）
                </Label>
                <Input
                  id="point"
                  type="number"
                  value={simulatorPoint}
                  onChange={(e) => setSimulatorPoint(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="coupon" className="text-sm text-foreground mb-2 block">
                  クーポン（税込）
                </Label>
                <Input
                  id="coupon"
                  type="number"
                  value={simulatorCoupon}
                  onChange={(e) => setSimulatorCoupon(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-6 p-6 bg-accent rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground mb-2">予想利益（税抜）</div>
                <div className={cn("text-4xl font-bold", profit > 0 ? "text-green-500" : "text-destructive")}>
                  ¥{profit.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">予想利益率</div>
                <div className={cn("text-4xl font-bold", margin > 0 ? "text-foreground" : "text-destructive")}>
                  {margin.toFixed(1)}%
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                ※ 手数料率7%、消費税10%で計算
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
