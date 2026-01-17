"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Filter, ArrowUpDown, X } from "lucide-react"
import type { ProductSummary } from "@/types/product"
import { cn } from "@/lib/utils"

interface ProductListProps {
  products: ProductSummary[]
  onSelectProduct: (product: ProductSummary) => void
}

type SortField = "stock_sum" | "sales_units_m" | "access_m" | "cv_m"
type SortDirection = "asc" | "desc"

interface FilterState {
  badges: string[]
  productRatings: string[]
  stockMin: string
  stockMax: string
  salesMin: string
  salesMax: string
  accessMin: string
  accessMax: string
  cvMin: string
  cvMax: string
}

export function ProductList({ products, onSelectProduct }: ProductListProps) {
  const toPercent = (v: number) => (Math.abs(v) <= 1 ? v * 100 : v)
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const [filters, setFilters] = useState<FilterState>({
    badges: [],
    productRatings: [],
    stockMin: "",
    stockMax: "",
    salesMin: "",
    salesMax: "",
    accessMin: "",
    accessMax: "",
    cvMin: "",
    cvMax: "",
  })

  const allBadges = useMemo(() => {
    const badgeSet = new Set<string>()
    products.forEach((p) => p.badges.forEach((b) => badgeSet.add(b)))
    return Array.from(badgeSet).sort()
  }, [products])

  const toggleBadgeFilter = (badge: string) => {
    setFilters((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge) ? prev.badges.filter((b) => b !== badge) : [...prev.badges, badge],
    }))
  }

  const toggleRatingFilter = (rating: string) => {
    setFilters((prev) => ({
      ...prev,
      productRatings: prev.productRatings.includes(rating)
        ? prev.productRatings.filter((r) => r !== rating)
        : [...prev.productRatings, rating],
    }))
  }

  const clearFilters = () => {
    setFilters({
      badges: [],
      productRatings: [],
      stockMin: "",
      stockMax: "",
      salesMin: "",
      salesMax: "",
      accessMin: "",
      accessMax: "",
      cvMin: "",
      cvMax: "",
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(search.toLowerCase()) ||
        p.product_code.toLowerCase().includes(search.toLowerCase()),
    )

    // Badge filter
    if (filters.badges.length > 0) {
      result = result.filter((p) => filters.badges.some((badge) => p.badges.includes(badge)))
    }

    // Product rating filter
    if (filters.productRatings.length > 0) {
      result = result.filter((p) => p.rating && filters.productRatings.includes(p.rating))
    }

    // Range filters
    if (filters.stockMin) result = result.filter((p) => p.stock_sum >= Number.parseFloat(filters.stockMin))
    if (filters.stockMax) result = result.filter((p) => p.stock_sum <= Number.parseFloat(filters.stockMax))
    if (filters.salesMin) result = result.filter((p) => p.sales_units_m >= Number.parseFloat(filters.salesMin))
    if (filters.salesMax) result = result.filter((p) => p.sales_units_m <= Number.parseFloat(filters.salesMax))
    if (filters.accessMin) result = result.filter((p) => p.access_m >= Number.parseFloat(filters.accessMin))
    if (filters.accessMax) result = result.filter((p) => p.access_m <= Number.parseFloat(filters.accessMax))
    if (filters.cvMin) result = result.filter((p) => p.cv_m >= Number.parseFloat(filters.cvMin))
    if (filters.cvMax) result = result.filter((p) => p.cv_m <= Number.parseFloat(filters.cvMax))

    // Sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      })
    }

    return result
  }, [products, search, filters, sortField, sortDirection])

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
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="商品名または商品管理番号で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          フィルタ
          {(filters.badges.length > 0 || filters.productRatings.length > 0) && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {filters.badges.length + filters.productRatings.length}
            </span>
          )}
        </Button>
        <div className="text-sm text-muted-foreground">{filteredAndSortedProducts.length} 件の商品</div>
      </div>

      {showFilters && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">フィルタ</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                クリア
              </Button>
            </div>

            {/* Badge Filter */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">バッジで絞り込み</Label>
              <div className="flex flex-wrap gap-2">
                {allBadges.map((badge) => (
                  <Badge
                    key={badge}
                    variant={filters.badges.includes(badge) ? getBadgeVariant(badge) : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleBadgeFilter(badge)}
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Product Rating Filter */}
            <div>
              <Label className="text-sm text-foreground mb-2 block">商品評価で絞り込み</Label>
              <div className="flex flex-wrap gap-2">
                {["S", "A", "B", "C", "D", "E"].map((rating) => (
                  <Badge
                    key={rating}
                    className={cn(
                      "cursor-pointer hover:opacity-80 transition-opacity",
                      filters.productRatings.includes(rating)
                        ? getRatingColor(rating)
                        : "bg-muted text-muted-foreground",
                    )}
                    onClick={() => toggleRatingFilter(rating)}
                  >
                    {rating}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-foreground mb-2 block">在庫数</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="最小"
                    value={filters.stockMin}
                    onChange={(e) => setFilters({ ...filters, stockMin: e.target.value })}
                  />
                  <span className="text-muted-foreground">〜</span>
                  <Input
                    type="number"
                    placeholder="最大"
                    value={filters.stockMax}
                    onChange={(e) => setFilters({ ...filters, stockMax: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-foreground mb-2 block">今月売上個数</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="最小"
                    value={filters.salesMin}
                    onChange={(e) => setFilters({ ...filters, salesMin: e.target.value })}
                  />
                  <span className="text-muted-foreground">〜</span>
                  <Input
                    type="number"
                    placeholder="最大"
                    value={filters.salesMax}
                    onChange={(e) => setFilters({ ...filters, salesMax: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-foreground mb-2 block">今月アクセス</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="最小"
                    value={filters.accessMin}
                    onChange={(e) => setFilters({ ...filters, accessMin: e.target.value })}
                  />
                  <span className="text-muted-foreground">〜</span>
                  <Input
                    type="number"
                    placeholder="最大"
                    value={filters.accessMax}
                    onChange={(e) => setFilters({ ...filters, accessMax: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-foreground mb-2 block">転換率 (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="最小"
                    value={filters.cvMin}
                    onChange={(e) => setFilters({ ...filters, cvMin: e.target.value })}
                  />
                  <span className="text-muted-foreground">〜</span>
                  <Input
                    type="number"
                    placeholder="最大"
                    value={filters.cvMax}
                    onChange={(e) => setFilters({ ...filters, cvMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">商品管理番号</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">SKU数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">評価</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">商品名</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("stock_sum")}
                    className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors"
                  >
                    在庫数
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("sales_units_m")}
                    className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors"
                  >
                    今月売上個数
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("access_m")}
                    className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors"
                  >
                    今月アクセス
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("cv_m")}
                    className="flex items-center justify-end gap-1 w-full hover:text-foreground transition-colors"
                  >
                    転換率
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">バッジ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedProducts.map((product) => (
                <tr
                  key={product.product_code}
                  onClick={() => onSelectProduct(product)}
                  className="hover:bg-accent cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{product.product_code}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">{product.sku_count.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {product.rating && (
                      <Badge className={cn("text-sm font-bold", getRatingColor(product.rating))}>{product.rating}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground max-w-md truncate">{product.product_name}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-sm text-right font-medium",
                      product.stock_sum === 0 ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {product.stock_sum.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">
                    {product.sales_units_m.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">{product.access_m.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-foreground">{toPercent(product.cv_m).toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.badges.slice(0, 3).map((badge, idx) => (
                        <Badge key={idx} variant={getBadgeVariant(badge)} className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                      {product.badges.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.badges.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
