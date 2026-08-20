"use client";

import Link from "next/link";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { ArrowUpRight } from 'lucide-react'

import {
  IntroAnimation,
} from "@/components/intro-animation";

import { PixelIcon } from "@/components/pixel-icon";
import { LiveAgentFeed, LiveAgentCounter } from "@/components/live-agent-feed";
import { RevealText } from "@/components/reveal-text";
import { PhotoShowcaseStack } from "@/components/photo-showcase-stack";
import { MobileNav } from "@/components/mobile-nav";
import { DevExSection } from "@/components/devex-section";
import Banner from "@/components/views/banner/banner";
import { MarketsBanner } from "@/components/markets-banner";
import { MarketsBentoCards } from "@/components/markets-bento-cards";
import { EnglishSuiteSection } from "@/components/english-suite";
// import TimeMachine from "@/components/time-machine";
import { ArtGallerySlider } from "@/components/art-gallery-slider";
import { QuickQrMaker } from "@/components/quick-qr-maker";
import { QuickFileConverter } from "@/components/quick-file-converter";
import { BookCoverMarquee } from "@/components/book-cover-marquee";
import { CountriesShowcase } from "@/components/countries-showcase";
import { HomeLatestPosts } from "@/components/blog/home-latest-posts";
import { CustomScrollbar } from "@/components/custom-scrollbar";

// ─── Intersection Observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = end / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, end]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Bento card ──────────────────────────────────────────────────────────────
function BentoCard({
  children,
  className = "",
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl border border-border bg-card overflow-hidden transition-all duration-700 hover:border-border/80 hover:bg-accent ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, background-color 0.3s ease`,
        ...style,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 [background:radial-gradient(400px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),color-mix(in_srgb,var(--foreground)_3%,transparent),transparent_60%)]"
      />
      {children}
    </div>
  );
}

// ─── Pill tag ─────────────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-muted-foreground bg-muted">
      {children}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgenticPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const handleIntroDone = useCallback(() => {
    setHeroReady(true);
    setVideoReady(true);
  }, []);

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  useEffect(() => {
    async function mee() {
      //   try{
      //      let test = await fetch('https://tradestie.com/api/v1/apps/reddit')
      //       let next = await test.json()
      //       debugger
      //    } catch(error:any){
      //  debugger
      //    }
    }

    mee();
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen font-sans antialiased overflow-x-clip">
      <CustomScrollbar />
      {/* ── INTRO ANIMATION ───────────────────────────────────────────────── */}
      <IntroAnimation onDone={handleIntroDone} />

      {/* ── STICKY NAV ────────────────────────────────────────────────────── */}
      <MobileNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden">
        <Banner
          banner="/images/banners/https___west.avif"
          user={'/LOGO/rk-light-logo.png'}
          home
          videoReady={videoReady}
        />

        {/* Progressive blur + light gradient rising from bottom */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "38%",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />

        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "55%",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />
      </section>

      <HomeLatestPosts />

      <section className="relative min-h-[520px] h-[55vh] w-full overflow-x-clip border-y border-border">
        <ArtGallerySlider variant="books" />
      </section>
    
      {/* ── TIME MACHINE ──────────────────────────────────────────────────── */}
      {/* <section
        id="time-machine"
        className="w-full border-t border-border bg-background py-12 px-6 md:px-12 flex items-center justify-center"
      >
        <div className="relative w-full max-w-3xl h-[450px] max-h-[450px] mx-auto">
          <TimeMachine shouldImplementPreloading={false} />
        </div>
      </section> */}

      <section id="markets" className="relative py-32 px-6 md:px-12 lg:px-20 overflow-hidden">
        <div className="relative max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="platform" size={40} />
            <div className="mt-4">
              <Tag>MARKETS</Tag>
            </div>
            <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
              {"Check markets."}
            </RevealText>
            <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-md">
                 Explore crypto, stocks, and financial markets.
            </p>
          </div>

          <div
            className="grid grid-cols-12 grid-rows-auto gap-3"
            onMouseMove={handleMouse}
          >
            <div className="col-span-12">
              <MarketsBanner />
            </div>

            <MarketsBentoCards />
          </div>
        </div>
      </section>

      {/* ── PHOTO DISCOVERY (4 cards, live from Unsplash) ─────────────────── */}
      <section
        id="photos"
        className="py-32 px-6 md:px-12 lg:px-20 border-t border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <div>
              <PixelIcon type="platform" size={40} />
              <div className="mt-4">
                <Tag>PHOTO DISCOVERY</Tag>
              </div>
              <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
                {"Stunning shots,\nupdated in real time."}
              </RevealText>
            </div>
            <div className="max-w-xs">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Four live categories pulled, Tap a card to dive into the full gallery.
              </p>
              <a
                href="/photos"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground transition-colors tracking-wide"
              >
                Explore all photos →
              </a>
            </div>
          </div>

          <PhotoShowcaseStack />
        </div>
      </section>

      <EnglishSuiteSection />

      {/* ── QUICK TOOLS ───────────────────────────────────────────────────── */}
      <section
        id="tools"
        className="py-32 px-6 md:px-12 lg:px-20 border-t border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="integrations" size={40} />
            <div className="mt-4">
              <Tag>TOOLS</Tag>
            </div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {"Quick tools.\nWhen you need them."}
            </RevealText>
          </div>

          {/* Full-width banner with tool cards */}
          <div
            className="rounded-2xl overflow-hidden border border-border flex flex-col md:block md:relative"
            onMouseMove={handleMouse}
          >
            <div className="relative w-full h-[240px] md:h-[440px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/banners/fikeus-west-2.avif"
                alt="Quick tools"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>

            <div className="flex flex-col md:flex-row-reverse gap-3 p-4 md:absolute md:bottom-4 md:right-4 md:p-0 md:w-auto">
              <article className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:w-72 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-lg font-light">Convert a file</h3>
                  <Link
                    href="/convert"
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors tracking-wide shrink-0 mt-1"
                  >
                    Studio
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <QuickFileConverter />
              </article>

              <article className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 md:w-72 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-lg font-light">Make a QR</h3>
                  <Link
                    href="/qr"
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70 hover:text-foreground transition-colors tracking-wide shrink-0 mt-1"
                  >
                    Studio
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <QuickQrMaker />
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY & OBSERVABILITY ──────────────────────────────────��──── */}
      {/* <section
        id="security"
        className="py-32 px-6 md:px-12 lg:px-20 border-t border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <PixelIcon type="platform" size={40} />
            <div className="mt-4">
              <Tag>SECURITY</Tag>
            </div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {"Enterprise-grade\nfrom day one."}
            </RevealText>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every action is logged, every decision is traceable. Built for
                teams that need compliance without compromise.
              </p>

              <div className="space-y-4">
                {[
                  {
                    label: "SOC 2 Type II",
                    desc: "Independently audited security controls",
                  },
                  {
                    label: "Full Audit Trail",
                    desc: "Every decision logged with full traceability",
                  },
                  {
                    label: "Real-time Observability",
                    desc: "Monitor, debug, and replay any execution",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-1 bg-muted rounded-full shrink-0" />
                    <div>
                      <h3 className="text-sm font-light mb-1">{item.label}</h3>
                      <p className="text-xs text-muted-foreground/90">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-2">
                {["SOC 2", "GDPR", "HIPAA Ready", "ISO 27001"].map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-2 text-xs text-muted-foreground/70"
                  >
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <BentoCard className="p-6 lg:row-span-1" delay={0}>
              <div className="text-xs text-muted-foreground/80 tracking-widest uppercase mb-4">
                Live Audit Trail
              </div>
              <div className="space-y-2">
                {[
                  {
                    time: "12:34:21",
                    action: "agent_executed",
                    status: "success",
                  },
                  {
                    time: "12:34:18",
                    action: "decision_logged",
                    status: "success",
                  },
                  {
                    time: "12:34:15",
                    action: "tool_called",
                    status: "success",
                  },
                  {
                    time: "12:34:12",
                    action: "memory_updated",
                    status: "success",
                  },
                  {
                    time: "12:34:09",
                    action: "output_generated",
                    status: "success",
                  },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/60 group cursor-pointer"
                    style={{
                      animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both`,
                    }}
                  >
                    <span className="text-[10px] text-muted-foreground/70 font-mono min-w-[60px]">
                      {log.time}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70 font-light flex-1">
                      {log.action}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors" />
                  </div>
                ))}
              </div>
              <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </BentoCard>
          </div>
        </div>
      </section> */}

      <BookCoverMarquee />

      {/* ── DEVELOPER EXPERIENCE ──────────────────────────────────────────── */}
      <DevExSection />

      {/* ── MARQUEE CAPABILITIES ──────────────────────────────────────────── */}
      <section className="py-0 border-t border-border overflow-hidden select-none">
        <div
          className="flex border-b border-border"
          style={{ animation: "marqueeLeft 28s linear infinite" }}
        >
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex shrink-0">
              {[
                "QR Codes",
                "File Convert",
                "Cat Facts",
                "Dog Facts",
                "Daily Poetry",
                "Joke Spinner",
                "Live Markets",
                "Crypto Prices",
                "Forex Rates",
                "Photo Discovery",
              ].map((cap) => (
                <div
                  key={cap}
                  className="flex items-center gap-6 px-10 py-5 border-r border-border shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap tracking-wide">
                    {cap}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          className="flex"
          style={{ animation: "marqueeRight 22s linear infinite" }}
        >
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex shrink-0">
              {[
                "English Suite",
                "Dictionary",
                "Book Explorer",
                "Art Gallery",
                "Lyrics Finder",
                "Music Browse",
                "Country Explorer",
                "Where Am I",
                "Notion Notes",
                "Barcode Maker",
              ].map((cap) => (
                <div
                  key={cap}
                  className="flex items-center gap-6 px-10 py-5 border-r border-border shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25 shrink-0" />
                  <span className="text-sm text-muted-foreground/80 whitespace-nowrap tracking-wide">
                    {cap}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE AGENTS ��──────────────────────────────────────────────────── */}
      {/* <section
        id="live"
        className="py-32 px-6 md:px-12 lg:px-20 border-t border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <PixelIcon type="agents" size={40} />
              <div className="mt-4">
                <Tag>LIVE RIGHT NOW</Tag>
              </div>
              <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
                {"Agents working\n24 / 7, autonomously."}
              </RevealText>
              <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-sm">
                At any moment, thousands of agents are running tasks on behalf
                of teams around the world — no human in the loop.
              </p>
              <div className="mt-10 flex items-end gap-2">
                <LiveAgentCounter />
                <span className="text-muted-foreground/80 text-sm mb-1 tracking-wide">
                  agents active globally
                </span>
              </div>
            </div>
            <div className="relative">
              <LiveAgentFeed />
            </div>
          </div>
        </div>
      </section> */}

      <CountriesShowcase />

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 md:px-12 lg:px-20 border-t border-border overflow-hidden">
        {/* Banner image — same as hero */}
        <img
          src="/images/banners/https___west.avif"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom pointer-events-none select-none"
          style={{ opacity: 0.85 }}
        />
        {/* Progressive blur from bottom — blends into site bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            WebkitMaskImage:
              "linear-gradient(to top, transparent 0%, black 55%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        />
        {/* Colour fade from bottom to site bg — light mode */}
        <div
          className="absolute inset-0 pointer-events-none dark:hidden"
          style={{
            background:
              "linear-gradient(to top, rgb(245,244,240) 0%, rgba(245,244,240,0.92) 18%, rgba(245,244,240,0.55) 35%, transparent 55%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none hidden dark:block bg-gradient-to-t from-background from-0% via-background/55 via-35% to-transparent to-55%" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] mb-6">
            Come back tomorrow.
            <br />
            Something new lands daily.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10">
            Markets, poems, jokes, tools, and more — this site gets fresh updates
            every day.
          </p>
          {/* {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubmitted(true);
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-ring transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-primary text-primary-foreground text-sm rounded-xl hover:bg-primary/90 transition-colors tracking-widest font-medium"
              >
                NOTIFY ME
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-600/20 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-500/20 dark:text-emerald-300 text-emerald-700 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {"You're on the list. See you tomorrow."}
            </div>
          )} */}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 md:px-12 lg:px-20 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <span className="font-pixel text-xs tracking-[0.25em] text-muted-foreground/70">
            REZA KARBAKHSH
          </span>

          {/* Nav sections */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {[
              { label: "Markets", href: "#markets" },
              { label: "Photos", href: "#photos" },
              { label: "English", href: "#english" },
              { label: "Tools", href: "#tools" },
              { label: "Live", href: "#live" },
              { label: "World", href: "#countries" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs text-muted-foreground/90 hover:text-foreground transition-colors tracking-widest"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-6">
            {[
              { label: "GitHub", href: "https://github.com/selengr" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                className="text-xs text-muted-foreground/70 hover:text-foreground/70 transition-colors tracking-widest"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border/60">
          <span className="text-xs text-muted-foreground/60">
            2026. made with love 💕 by{" "}
            <a
              href="https://github.com/selengr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/80 hover:text-foreground transition-colors underline underline-offset-2 decoration-foreground/25 hover:decoration-foreground/60"
            >
              @selengr
            </a>
            .
          </span>
        </div>
      </footer>
    </div>
  );
}
