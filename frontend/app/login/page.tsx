import { Suspense } from "react"
import LoginClient from "./login-client"

export default function LoginPage() {
  // useSearchParams() は Suspense 配下が必須（CSR bailout 対応）
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">読み込み中...</div>}>
      <LoginClient />
    </Suspense>
  )
}


