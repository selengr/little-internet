import Script from 'next/script'

const STORAGE_KEY = 'light-theme'
const DEFAULT_THEME = 'light'

/** Runs before hydration to avoid a light/dark flash. */
const THEME_INIT = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)},d=${JSON.stringify(DEFAULT_THEME)},t=localStorage.getItem(k)||d,r=document.documentElement,m=window.matchMedia('(prefers-color-scheme: dark)');if(t==='system')t=m.matches?'dark':'light';r.classList.remove('light','dark');r.classList.add(t);if(t==='light'||t==='dark')r.style.colorScheme=t}catch(e){}})();`

/** Blocking theme bootstrap via next/script (valid in root layout). */
export function ThemeScript() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {THEME_INIT}
    </Script>
  )
}
