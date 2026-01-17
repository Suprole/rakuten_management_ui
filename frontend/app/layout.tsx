import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "楽天市場 商品可視化ダッシュボード",
  description: "楽天市場の商品データを可視化し、在庫・売上・利益を一目で把握できるダッシュボード",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const enableAnalytics = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "1"
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground">
        {children}
        {enableAnalytics ? <Analytics /> : null}
      </body>
    </html>
  )
}

