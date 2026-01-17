"use client"

import { useEffect, useMemo, useState } from "react"
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
  const [productRating, setProductRating] = useState<ProductSummary["rating"]>(product.rating ?? null)
  const [memo, setMemo] = useState("")
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null)
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [skus, setSkus] = useState<
    Array<{
      sku_code: string
      stock: number
      sales_units_m: number
      setting_margin: number
      shipping_type: string
      price_in_tax: number
      cost_ex_tax: number
    }>
  >([])

  const [settings, setSettings] = useState<{
    tax_rate: number
    fee_rate: number
    default_point_rate: number
    shipping_costs_in_tax: Array<{ shipping_type: string; shipping_cost_in_tax: number }>
  } | null>(null)

  const [simulatorPrice, setSimulatorPrice] = useState<string>("")
  const [simulatorShippingType, setSimulatorShippingType] = useState<string>("default")
  const [simulatorCost, setSimulatorCost] = useState<string>("")
  const [simulatorPoint, setSimulatorPoint] = useState<string>("")
  const [simulatorCoupon, setSimulatorCoupon] = useState<string>("0")

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
        setProductRating(data.rating ?? null)
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

  useEffect(() => {
    const run = async () => {
      try {
        setDetailLoading(true)
        setDetailError(null)
        const [pRes, sRes, setRes] = await Promise.all([
          fetch(`/api/products?product_code=${encodeURIComponent(product.product_code)}`, { cache: "no-store" }),
          fetch(`/api/skus?product_code=${encodeURIComponent(product.product_code)}`, { cache: "no-store" }),
          fetch(`/api/settings`, { cache: "no-store" }),
        ])
        if (!pRes.ok) throw new Error(`products: ${pRes.status} ${pRes.statusText}`)
        if (!sRes.ok) throw new Error(`skus: ${sRes.status} ${sRes.statusText}`)
        if (!setRes.ok) throw new Error(`settings: ${setRes.status} ${setRes.statusText}`)

        const pData = (await pRes.json()) as { product: Record<string, unknown> }
        const sData = (await sRes.json()) as {
          skus: Array<{
            sku_code: string
            stock: number
            sales_units_m: number
            setting_margin: number
            shipping_type: string
            price_in_tax: number
            cost_ex_tax: number
          }>
        }
        const setData = (await setRes.json()) as {
          tax_rate: number
          fee_rate: number
          default_point_rate: number
          shipping_costs_in_tax: Array<{ shipping_type: string; shipping_cost_in_tax: number }>
        }
        setDetail(pData.product ?? null)
        setSkus(sData.skus ?? [])
        setSettings(setData)

        // 初期選択: SKUのshipping_typeがあればそれ、無ければdefault
        const st = (sData.skus?.find((x) => x.shipping_type)?.shipping_type ?? "default").toString()
        setSimulatorShippingType(st || "default")

        // 初期ポイント: settingsのdefault（%）
        if (!simulatorPoint) {
          setSimulatorPoint(String(((setData.default_point_rate ?? 0.01) * 100).toFixed(1)))
        }

        // シミュレーター初期値: 代表SKUの設定販売価格/仕入れ値（仕様書の入力項目に合わせる）
        const rep = String((pData.product?.["representative_sku"] ?? "") as string)
        const repSku = (sData.skus ?? []).find((x) => x.sku_code === rep) ?? (sData.skus ?? [])[0] ?? null
        if (repSku) {
          if (!simulatorPrice) setSimulatorPrice(String(Math.round(repSku.price_in_tax)))
          if (!simulatorCost) setSimulatorCost(String(Math.round(repSku.cost_ex_tax)))
        }
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : "unknown error")
      } finally {
        setDetailLoading(false)
      }
    }
    run()
  }, [product.product_code])

  const saveNote = async () => {
    try {
      // 楽観更新: 先にUIへ反映（失敗したら復旧）
      const prev = { rating: productRating, memo, updated_at: noteUpdatedAt }
      const optimisticUpdatedAt = new Date().toISOString()
      setNoteSaving(true)
      setNoteError(null)
      setNoteUpdatedAt(optimisticUpdatedAt)

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
        // 復旧
        setProductRating(prev.rating)
        setMemo(prev.memo)
        setNoteUpdatedAt(prev.updated_at)
        throw new Error(msg)
      }
      if (data && "updated_at" in data) setNoteUpdatedAt(data.updated_at)
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : "unknown error")
    } finally {
      setNoteSaving(false)
    }
  }

  const profitResult = useMemo(() => {
    const priceInTax = Number.parseFloat(simulatorPrice)
    const shippingCostInTax =
      settings?.shipping_costs_in_tax.find((x) => x.shipping_type === simulatorShippingType)?.shipping_cost_in_tax ?? 0
    const costExTax = Number.parseFloat(simulatorCost)
    const pointPct = Number.parseFloat(simulatorPoint)
    const couponInTax = Number.parseFloat(simulatorCoupon)

    const errs: string[] = []
    if (!Number.isFinite(priceInTax)) errs.push("販売価格が未入力/不正です")
    if (!Number.isFinite(costExTax)) errs.push("仕入れ値が未入力/不正です")
    if (!Number.isFinite(pointPct)) errs.push("ポイント倍率が未入力/不正です")
    if (!Number.isFinite(couponInTax)) errs.push("クーポンが未入力/不正です")

    if (Number.isFinite(priceInTax) && priceInTax < 0) errs.push("販売価格は0以上にしてください")
    if (Number.isFinite(costExTax) && costExTax < 0) errs.push("仕入れ値は0以上にしてください")
    if (Number.isFinite(couponInTax) && couponInTax < 0) errs.push("クーポンは0以上にしてください")
    if (Number.isFinite(pointPct) && (pointPct < 0 || pointPct > 100)) errs.push("ポイント倍率は0〜100%の範囲にしてください")

    if (errs.length > 0) {
      return { profit: 0, margin: 0, netInTax: 0, error: errs[0] }
    }

    const pointRate = pointPct / 100
    const feeRate = settings?.fee_rate ?? 0.07
    const taxRate = settings?.tax_rate ?? 0.1

    const netInTax = priceInTax * (1 - feeRate - pointRate) - couponInTax
    const netExTax = (netInTax - shippingCostInTax) / (1 + taxRate)
    const profitExTax = netExTax - costExTax
    const margin = priceInTax > 0 ? profitExTax / (priceInTax / (1 + taxRate)) : 0

    return {
      profit: profitExTax,
      margin: margin * 100,
      netInTax,
      error: null as string | null,
    }
  }, [simulatorPrice, simulatorShippingType, simulatorCost, simulatorPoint, simulatorCoupon, settings])

  const profit = profitResult.profit
  const margin = profitResult.margin
  const simulatorError = profitResult.error

  const d = detail
  const n = (k: string) => (typeof d?.[k] === "number" ? (d?.[k] as number) : Number(d?.[k] ?? 0))
  const sales_amount_m = n("sales_amount_m")
  const sales_amount_lm = n("sales_amount_lm")
  const profit_m = n("profit_m")
  const profit_lm = n("profit_lm")
  const sales_units_m = n("sales_units_m")
  const sales_units_lm = n("sales_units_lm")
  const access_m = n("access_m")
  const access_lm = n("access_lm")
  const cv_m = n("cv_m")
  const cv_lm = n("cv_lm")
  const fav_add_m = n("fav_add_m")
  const fav_add_lm = n("fav_add_lm")
  const fav_total = n("fav_total")
  const reviews_post_m = n("reviews_post_m")
  const reviews_post_lm = n("reviews_post_lm")
  const reviews_total = n("reviews_total")
  const stay_m = n("stay_m")
  const stay_lm = n("stay_lm")
  // 離脱率は「0〜1の比率」で来る前提で%表示にする
  const bounce_m = n("bounce_m") * 100
  const bounce_lm = n("bounce_lm") * 100
  const new_ratio_m = n("new_ratio_m")
  const rep_ratio_m = n("rep_ratio_m")
  const new_ratio_lm = n("orders_total_lm") > 0 ? (n("orders_new_lm") / n("orders_total_lm")) * 100 : 0
  const rep_ratio_lm = n("orders_total_lm") > 0 ? (n("orders_rep_lm") / n("orders_total_lm")) * 100 : 0

  const margin_m = sales_amount_m > 0 ? (profit_m / sales_amount_m) * 100 : 0
  const margin_lm = sales_amount_lm > 0 ? (profit_lm / sales_amount_lm) * 100 : 0

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

      {detailLoading && <div className="text-sm text-muted-foreground">詳細を読み込み中...</div>}
      {detailError && <div className="text-sm text-destructive">エラー: {detailError}</div>}

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
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <div className="rounded border px-3 py-2">在庫: {n("stock_sum").toLocaleString()}</div>
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
              currentValue={sales_amount_m}
              previousValue={sales_amount_lm}
              changePercent={sales_amount_lm > 0 ? Math.round(((sales_amount_m - sales_amount_lm) / sales_amount_lm) * 100) : 0}
              formatValue={(val) => `¥${Math.round(Number(val)).toLocaleString()}`}
            />
            <ComparisonCard
              title="利益"
              currentValue={profit_m}
              previousValue={profit_lm}
              changePercent={profit_lm > 0 ? Math.round(((profit_m - profit_lm) / profit_lm) * 100) : 0}
              formatValue={(val) => `¥${Math.round(Number(val)).toLocaleString()}`}
            />
            <ComparisonCard
              title="売上個数"
              currentValue={sales_units_m}
              previousValue={sales_units_lm}
              changePercent={sales_units_lm > 0 ? Math.round(((sales_units_m - sales_units_lm) / sales_units_lm) * 100) : 0}
            />
            <ComparisonCard
              title="利益率"
              currentValue={margin_m}
              previousValue={margin_lm}
              changePercent={margin_lm > 0 ? Math.round(((margin_m - margin_lm) / margin_lm) * 100) : 0}
              formatValue={(val) => `${Number(val).toFixed(1)}%`}
            />
            <ComparisonCard
              title="アクセス人数"
              currentValue={access_m}
              previousValue={access_lm}
              changePercent={access_lm > 0 ? Math.round(((access_m - access_lm) / access_lm) * 100) : 0}
              formatValue={(val) => Number(val).toLocaleString()}
            />
            <ComparisonCard
              title="転換率"
              currentValue={cv_m}
              previousValue={cv_lm}
              changePercent={cv_lm > 0 ? Math.round(((cv_m - cv_lm) / cv_lm) * 100) : 0}
              formatValue={(val) => `${Number(val).toFixed(1)}%`}
            />
            <ComparisonCard
              title="新規購入比率"
              currentValue={new_ratio_m}
              previousValue={new_ratio_lm}
              changePercent={new_ratio_lm > 0 ? Math.round(((new_ratio_m - new_ratio_lm) / new_ratio_lm) * 100) : 0}
              formatValue={(val) => `${Number(val).toFixed(1)}%`}
            />
            <ComparisonCard
              title="リピート購入比率"
              currentValue={rep_ratio_m}
              previousValue={rep_ratio_lm}
              changePercent={rep_ratio_lm > 0 ? Math.round(((rep_ratio_m - rep_ratio_lm) / rep_ratio_lm) * 100) : 0}
              formatValue={(val) => `${Number(val).toFixed(1)}%`}
            />
            <ComparisonCard
              title="お気に入り登録ユーザー数"
              currentValue={fav_add_m}
              previousValue={fav_add_lm}
              changePercent={fav_add_lm > 0 ? Math.round(((fav_add_m - fav_add_lm) / fav_add_lm) * 100) : 0}
              formatValue={(val) => Number(val).toLocaleString()}
            />
            <ComparisonCard
              title="レビュー投稿数"
              currentValue={reviews_post_m}
              previousValue={reviews_post_lm}
              changePercent={reviews_post_lm > 0 ? Math.round(((reviews_post_m - reviews_post_lm) / reviews_post_lm) * 100) : 0}
              formatValue={(val) => Number(val).toLocaleString()}
            />
            <ComparisonCard
              title="平均滞在時間"
              currentValue={stay_m}
              previousValue={stay_lm}
              changePercent={stay_lm > 0 ? Math.round(((stay_m - stay_lm) / stay_lm) * 100) : 0}
              formatValue={(val) => `${Number(val).toFixed(1)}秒`}
            />
            <ComparisonCard
              title="離脱率"
              currentValue={bounce_m}
              previousValue={bounce_lm}
              changePercent={bounce_lm > 0 ? Math.round(((bounce_m - bounce_lm) / bounce_lm) * 100) : 0}
              formatValue={(val) => `${Number(val).toFixed(1)}%`}
            />
          </div>

          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-1">お気に入り総ユーザー数</h4>
              <div className="text-2xl font-bold text-foreground">{fav_total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">総数</div>
            </Card>
            <Card className="p-4">
              <h4 className="font-semibold text-foreground mb-1">総レビュー数</h4>
              <div className="text-2xl font-bold text-foreground">{reviews_total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">総数</div>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* SKU Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">SKU内訳</h3>
            <div className="space-y-3">
              {skus.map((sku, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                  <div>
                    <div className="font-mono text-sm text-foreground">{sku.sku_code}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      在庫: {sku.stock} / 今月売上: {sku.sales_units_m}個
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {sku.setting_margin <= 1 ? (sku.setting_margin * 100).toFixed(1) : sku.setting_margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">利益率</div>
                  </div>
                </div>
              ))}
              {skus.length === 0 && <div className="text-sm text-muted-foreground">SKUがありません</div>}
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
                  value={(productRating ?? "__unset__") as string}
                  onValueChange={(value) =>
                    setProductRating(value === "__unset__" ? null : (value as NonNullable<ProductSummary["rating"]>))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="未設定" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unset__">未設定</SelectItem>
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
                  現在の評価:{" "}
                  {productRating ? (
                    <Badge className={cn("ml-1", getRatingColor(productRating))}>{productRating}</Badge>
                  ) : (
                    <span className="ml-1">未設定</span>
                  )}
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
                <Label className="text-sm text-foreground mb-2 block">配送種別</Label>
                <Select value={simulatorShippingType} onValueChange={setSimulatorShippingType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="配送種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings?.shipping_costs_in_tax ?? [{ shipping_type: "default", shipping_cost_in_tax: 800 }]).map((s) => (
                      <SelectItem key={s.shipping_type} value={s.shipping_type}>
                        {s.shipping_type}（¥{s.shipping_cost_in_tax}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {simulatorError && <div className="text-sm text-destructive">入力エラー: {simulatorError}</div>}
              <div>
                <div className="text-sm text-muted-foreground mb-2">予想利益（税抜）</div>
                <div className={cn("text-4xl font-bold", profit > 0 ? "text-green-500" : "text-destructive")}>
                  ¥{Math.round(profit).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">予想利益率</div>
                <div className={cn("text-4xl font-bold", margin > 0 ? "text-foreground" : "text-destructive")}>
                  {margin.toFixed(1)}%
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                ※ 手数料率{((settings?.fee_rate ?? 0.07) * 100).toFixed(1)}%、消費税{((settings?.tax_rate ?? 0.1) * 100).toFixed(1)}%で計算
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
