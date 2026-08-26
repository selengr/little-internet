'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { IpstackData } from '@/types/ipstack'

export function HomeLocationStrip() {
  const [ip, setIp] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/location?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.ip) throw new Error('lookup failed')
      setIp((json as IpstackData).ip)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (failed) return null

  return (
    <section className="border-t border-border px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/location"
          className="group relative block h-[300px] overflow-hidden rounded-2xl border border-border md:h-[420px]"
        >
          <Image
            src="/images/banners/about-me.avif"
            alt=""
            fill
            priority={false}
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover object-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/55">
              Your IP address
            </p>
            <p className="mt-3 font-mono text-3xl tracking-tight text-white md:text-5xl">
              {ip ?? <span className="text-white/30">···.···.···.···</span>}
            </p>
          </div>
        </Link>
      </div>
    </section>
  )
}
