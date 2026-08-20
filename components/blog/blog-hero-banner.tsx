'use client'

import Image from 'next/image'
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation'
import styles from '@/components/views/banner/banner.module.css'

type BlogHeroBannerProps = {
  title: string
  subtitle: string
  bannerImage?: string
  authorImage: string
}

export function BlogHeroBanner({
  title,
  subtitle,
  bannerImage = '/images/banners/fikeus-west-2.avif',
  authorImage,
}: BlogHeroBannerProps) {
  return (
    <div className={styles['landing-main']}>
      <div className="relative mx-auto w-full max-w-[1200px]">
        <div className="relative h-[32vh] min-h-[260px] max-h-[420px] overflow-hidden rounded-none sm:rounded-[24px] shadow-[0_28px_70px_-24px_rgba(62,42,24,0.55)] ring-1 ring-black/[0.08] dark:ring-white/[0.1] max-sm:w-screen max-sm:relative max-sm:left-1/2 max-sm:-translate-x-1/2">
          <BackgroundGradientAnimation
            interactive
            containerClassName="absolute inset-0 h-full w-full"
            gradientBackgroundStart="rgb(38, 32, 26)"
            gradientBackgroundEnd="rgb(62, 48, 36)"
            firstColor="210, 165, 95"
            secondColor="138, 158, 118"
            thirdColor="125, 168, 198"
            fourthColor="186, 98, 58"
            fifthColor="228, 196, 138"
            pointerColor="240, 200, 140"
            size="92%"
            blendingValue="soft-light"
            className="opacity-25"
          />

          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            className="pointer-events-none object-cover object-center opacity-[0.72] saturate-[1.08] contrast-[1.04]"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-100/10 via-transparent to-stone-900/25 mix-blend-soft-light" />
          <div className="pointer-events-none absolute -inset-y-8 -left-1/4 w-1/2 blog-hero-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent blur-2xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-stone-950/45 via-stone-900/10 to-transparent" />
          <div className="pointer-events-none absolute inset-0 rounded-none sm:rounded-[24px] ring-1 ring-inset ring-white/15" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div
            className={`${styles['landing-div-rounded']} bg-[#f7f6f3] overflow-hidden ring-2 ring-white/80 dark:ring-white/20`}
          >
            <Image
              src={authorImage}
              alt="Author"
              width={124}
              height={124}
              className={`${styles['landing-div-rounded-home']} ${styles['landing-div-rounded-avatar']}`}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      <h1 className={styles['landing-title']}>{title}</h1>

      <div className="w-full flex justify-center">
        <article className={styles['landing-article']}>
          <p
            className="text-center text-[17px] sm:text-[19px] leading-[1.55] text-muted-foreground tracking-[-0.01em] max-w-xl mx-auto"
            dir="ltr"
          >
            {subtitle}
          </p>
        </article>
      </div>
    </div>
  )
}
