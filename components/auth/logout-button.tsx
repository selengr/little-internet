'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      router.replace('/auth')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
