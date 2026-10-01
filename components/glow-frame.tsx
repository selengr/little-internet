'use client'

import { cn } from '@/lib/utils'

const CSS = `
  @property --gf-a { syntax: '<color>'; inherits: true; initial-value: #fde68a; }
  @property --gf-b { syntax: '<color>'; inherits: true; initial-value: #d97706; }
  @property --gf-x1 { syntax: '<percentage>'; inherits: false; initial-value: 12%; }
  @property --gf-x2 { syntax: '<percentage>'; inherits: false; initial-value: 80%; }
  @property --gf-y3 { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
  @property --gf-y4 { syntax: '<percentage>'; inherits: false; initial-value: 75%; }

  @keyframes gf-roam1 { 0%,100% { --gf-x1: 8% } 50% { --gf-x1: 68% } }
  @keyframes gf-roam2 { 0%,100% { --gf-x2: 86% } 50% { --gf-x2: 26% } }
  @keyframes gf-roam3 { 0%,100% { --gf-y3: 12% } 50% { --gf-y3: 70% } }
  @keyframes gf-roam4 { 0%,100% { --gf-y4: 84% } 50% { --gf-y4: 22% } }
  @keyframes gf-breathe { 0%,100% { opacity: .62 } 50% { opacity: 1 } }

  .gf-root {
    --gf-inset: 12px;
    transition: --gf-a .9s ease, --gf-b .9s ease;
  }
  /* Parent hovered: the light reaches a little deeper into the card. */
  :hover > .gf-root { --gf-inset: 22px; }
  .gf-spot { opacity: 0; transition: opacity .5s ease; }
  :hover > .gf-root .gf-spot { opacity: 1; }

  /* Four soft light sources sliding slowly (and at different speeds) along the four edges, so the
     rim is never evenly lit, the way real light behaves. */
  .gf-sources {
    background:
      radial-gradient(55% 50% at var(--gf-x1) -8%, var(--gf-b), transparent 70%),
      radial-gradient(50% 55% at var(--gf-x2) 108%, var(--gf-a), transparent 70%),
      radial-gradient(48% 55% at -8% var(--gf-y3), var(--gf-a), transparent 70%),
      radial-gradient(48% 55% at 108% var(--gf-y4), var(--gf-b), transparent 70%);
    animation:
      gf-roam1 19s ease-in-out infinite, gf-roam2 23s ease-in-out infinite,
      gf-roam3 29s ease-in-out infinite, gf-roam4 17s ease-in-out infinite,
      gf-breathe 7s ease-in-out infinite;
  }
  .gf-plate {
    inset: var(--gf-inset);
    filter: blur(16px);
    transition: inset .7s ease-out;
  }
  /* A hairline of light right at the edge, and a faint glow just inside it. */
  .gf-rim {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--gf-b) 55%, transparent),
      inset 0 0 26px -8px color-mix(in srgb, var(--gf-b) 70%, transparent);
  }
  /* Light mode: the glow sits on a pale card, so it needs more colour, not more white. */
  .gf-root { --gf-o: 1; }
  :is(html.dark, .dark) .gf-root { --gf-o: 1; --gf-inset: 16px; }
  :is(html.dark, .dark) :hover > .gf-root { --gf-inset: 27px; }
  .gf-sources { opacity: var(--gf-o); }
  .gf-lightboost { mix-blend-mode: multiply; opacity: .35; }
  :is(html.dark, .dark) .gf-lightboost { display: none; }

  @media (prefers-reduced-motion: reduce) {
    .gf-sources { animation: none !important; opacity: .85; }
  }
`

/**
 * The light that lives inside a card's border. Put it as the first child of a card that is
 * `relative isolate overflow-hidden` with a rounded border. `a` is the light colour, `b` the
 * saturated one; `plate` is a class giving the card's own background colour (the blurred plate that
 * leaves only a band of light along the edges). The card's pointer position (--mx, --my) lights the
 * glow under the cursor.
 */
export function GlowFrame({
  a,
  b,
  plate,
  radius = '1.6rem',
  className,
}: {
  a: string
  b: string
  plate: string
  radius?: string
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn('gf-root pointer-events-none absolute inset-0 -z-10 rounded-[inherit]', className)}
      style={{ '--gf-a': a, '--gf-b': b } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <div className="gf-sources absolute inset-0" />
      {/* Saturates the colour in light mode, where white-ish cards wash light out. */}
      <div className="gf-lightboost absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--gf-b), var(--gf-a))' }} />
      <div
        className="gf-spot absolute inset-0"
        style={{ background: 'radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--gf-b) 40%, transparent), transparent 70%)' }}
      />
      <div className={cn('gf-plate absolute', plate)} style={{ borderRadius: radius }} />
      <div className="gf-rim absolute inset-0 rounded-[inherit]" />
    </div>
  )
}
