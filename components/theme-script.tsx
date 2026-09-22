/** Blocking theme init — server-only so React 19 does not warn about client `<script>`. */
export function ThemeScript({
  storageKey = 'light-theme',
  defaultTheme = 'light',
}: {
  storageKey?: string
  defaultTheme?: string
}) {
  const code = `(function(){try{var k=${JSON.stringify(storageKey)},d=${JSON.stringify(defaultTheme)},t=localStorage.getItem(k)||d,r=document.documentElement,m=window.matchMedia('(prefers-color-scheme: dark)');if(t==='system')t=m.matches?'dark':'light';r.classList.remove('light','dark');r.classList.add(t);if(t==='light'||t==='dark')r.style.colorScheme=t}catch(e){}})();`

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  )
}
