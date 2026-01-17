import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

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

const authSecret = process.env.AUTH_SECRET
const googleId = process.env.AUTH_GOOGLE_ID
const googleSecret = process.env.AUTH_GOOGLE_SECRET

const isAuthConfigured = Boolean(authSecret && googleId && googleSecret)

type Handler = (...args: any[]) => any
type Handlers = { GET: Handler; POST: Handler }

// NOTE:
// Next.js build（Collecting page data）中に route modules が評価されるため、
// env未設定だとビルド自体が落ちるのを防ぐ。未設定時は /api/auth を 500 にする。
const notConfiguredHandlers: Handlers = {
  GET: async () =>
    new Response("Auth is not configured. Set AUTH_SECRET/AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.", { status: 500 }),
  POST: async () =>
    new Response("Auth is not configured. Set AUTH_SECRET/AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.", { status: 500 }),
}

const nextAuth = isAuthConfigured
  ? NextAuth({
      secret: authSecret,
      providers: [
        Google({
          clientId: googleId!,
          clientSecret: googleSecret!,
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
  : null

export const handlers: Handlers = (nextAuth?.handlers as unknown as Handlers) ?? notConfiguredHandlers
export const auth: any = nextAuth?.auth ?? ((handler: any) => handler)
export const signIn: any = nextAuth?.signIn ?? (async () => {
  throw new Error("Auth is not configured")
})
export const signOut: any = nextAuth?.signOut ?? (async () => {
  throw new Error("Auth is not configured")
})


