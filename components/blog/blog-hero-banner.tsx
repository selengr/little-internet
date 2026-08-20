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
        <div className="relative h-[32vh] min-h-[260px] max-h-[420px] overflow-hidden rounded-none sm:rounded-[24px] shadow-[0_32px_80px_-32px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06] max-sm:w-screen max-sm:relative max-sm:left-1/2 max-sm:-translate-x-1/2">
          <BackgroundGradientAnimation
            interactive
            containerClassName="absolute inset-0 h-full w-full"
            gradientBackgroundStart="rgb(14, 12, 10)"
            gradientBackgroundEnd="rgb(28, 22, 18)"
            firstColor="148, 112, 68"
            secondColor="78, 96, 76"
            thirdColor="62, 86, 104"
            fourthColor="120, 62, 42"
            fifthColor="98, 82, 66"
            pointerColor="168, 138, 92"
            dropColors={[
              '168, 138, 92',
              '148, 112, 68',
              '62, 86, 104',
              '120, 62, 42',
              '78, 96, 76',
            ]}
            size="90%"
            blendingValue="soft-light"
          />

          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            className="pointer-events-none object-cover object-center opacity-[0.52] saturate-[0.92] contrast-[1.08] brightness-[0.88]"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />

          <div className="pointer-events-none absolute inset-0 bg-stone-950/25 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-950/55 via-stone-950/15 to-transparent" />
          <div className="pointer-events-none absolute inset-0 rounded-none sm:rounded-[24px] ring-1 ring-inset ring-white/[0.08]" />
        </div>

        <div className="relative z-10 flex justify-center">
          <div
            className={`${styles['landing-div-rounded']} bg-[#f7f6f3] overflow-hidden ring-2 ring-white/70 dark:ring-white/15 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)]`}
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
