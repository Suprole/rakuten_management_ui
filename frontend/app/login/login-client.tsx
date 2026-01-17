"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function LoginClient() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">ログイン</h1>
          <p className="text-sm text-muted-foreground mt-1">
            指定されたメールアドレスのGoogleアカウントのみ閲覧できます。
          </p>
        </div>
        <Button className="w-full" onClick={() => signIn("google", { callbackUrl })}>
          Googleでログイン
        </Button>
      </Card>
    </div>
  )
}

