import type { ReactNode } from 'react'
import Image from 'next/image'
import styles from './banner.module.css'

type Props = {
  data?: string
  title?: string
  banner: string
  /** Author / avatar image path or absolute URL */
  user?: string
  home?: boolean
  /** Blog mode: same layout as home, but per-post banner + author image */
  blog?: boolean
  videoReady?: boolean
  /** Replaces the default home intro copy under the title */
  children?: ReactNode
}

function resolveSrc(src: string, viaApi = false) {
  if (!src) return '/LOGO/rk-light-logo.png'
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
    return src
  }
  return viaApi ? `/api/images/${src}` : src
}

const Banner = ({ title, banner, user, home, blog, videoReady, children }: Props) => {
  const bannerSrc = home || blog ? resolveSrc(banner as string) : `/api/images/${banner}`
  const authorSrc =
    blog && user
      ? resolveSrc(user)
      : home
        ? '/LOGO/rk-light-logo.png'
        : `/api/images/${user}`

  const showAuthorRing = Boolean(home || blog)
  const scaled = videoReady === undefined ? true : videoReady

  return (
    <>
      <div
        className={styles['landing-main']}
        style={{
          transform: scaled ? 'scale(1.05)' : 'scale(0.85)',
          transition: 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Image
          src={bannerSrc}
          alt={title ? String(title) : 'Banner'}
          width={1200}
          height={480}
          priority
          className={styles['landing-img']}
          unoptimized={bannerSrc.startsWith('http')}
        />

        {showAuthorRing && (
          <div className={`${styles['landing-div-rounded']} bg-[var(--bg-color-11,#f7f6f3)] overflow-hidden`}>
            <Image
              src={authorSrc}
              alt={blog ? 'Author' : 'Logo'}
              width={124}
              height={124}
              className={`${styles['landing-div-rounded-home']} ${blog ? styles['landing-div-rounded-avatar'] : ''}`}
              unoptimized={authorSrc.startsWith('http') || blog}
              style={blog ? { objectFit: 'cover' } : undefined}
            />
          </div>
        )}

        {!home && !blog && (
          <Image
            src={`/api/images/${user}`}
            alt="Author"
            width={100}
            height={100}
            className={styles['landing-div-rounded']}
          />
        )}

        <h1 className={styles['landing-title']}>
          {title ? title : 'rezakarbakhsh.ir'}
        </h1>
      </div>

      <div className="w-full h-full flex justify-center align-middle">
        <article className={styles['landing-article']}>
          <section className="w-full flex flex-col">
            {children ?? (
              <>
                <div className="flex flex-col">
                  <span className="mb-5">Hello World👋</span>
                  <span>
                    Welcome to my little internet. I&apos;m Reza Karbakhsh, a software
                    developer who loves exploring AI by building and learning in public.
                  </span>
                </div>
                <div>
                  <span className={styles['landing-hover-highlight']}>
                    Stay tuned for exciting updates — coming soon!{' '}
                  </span>
                </div>
              </>
            )}
          </section>
        </article>
      </div>
    </>
  )
}

export default Banner
