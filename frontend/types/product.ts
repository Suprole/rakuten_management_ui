export interface ProductSummary {
  product_code: string
  representative_sku: string
  sku_count: number
  // 商品評価（運用評価）：S/A/B/C/D/E
  rating: "S" | "A" | "B" | "C" | "D" | "E" | null
  product_name: string
  stock_sum: number
  sales_units_m: number
  access_m: number
  cv_m: number
  badges: string[]
}

