import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

function parseAllowedEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

const allowedEmails = parseAllowedEmails(process.env.ALLOWED_EMAILS)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: requireEnv("AUTH_GOOGLE_ID"),
      clientSecret: requireEnv("AUTH_GOOGLE_SECRET"),
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, profile }) {
      const email = (user.email ?? (profile as { email?: string } | null)?.email ?? "").toLowerCase()
      if (!email) return false

      // 許可リストが空の場合は「誰も通さない」= セキュア側に倒す
      if (allowedEmails.size === 0) return false
      return allowedEmails.has(email)
    },
  },
})


