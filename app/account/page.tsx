import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth-session'
import { LogoutButton } from '@/components/auth/logout-button'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await getSessionUser()
  if (!user) redirect('/auth?next=/account')

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white px-6 py-16">
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Account</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="mt-2 text-sm text-white/50">{user.email}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">Role · {user.role}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/70 hover:border-white/30 hover:text-white"
          >
            Home
          </Link>
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
