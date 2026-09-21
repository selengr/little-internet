"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SessionUser {
  firstName?: string;
  email?: string;
}

// Footer auth entry: guests see "Sign in"; signed-in users see Log out + name.
export function FooterAuthLink() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const refreshSession = useCallback(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = refreshSession();
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancel();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshSession]);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  if (!checked) {
    // Reserve space silently to avoid a layout shift once the check resolves.
    return <span className="text-xs text-transparent select-none">Sign in</span>;
  }

  if (user) {
    const name = user.firstName?.trim() || user.email || "Account";
    return (
      <span className="inline-flex items-center gap-2.5 text-xs tracking-widest">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="text-muted-foreground/70 hover:text-foreground/70 transition-colors disabled:opacity-50"
        >
          {loggingOut ? "…" : "Log out"}
        </button>
        <Link
          href="/account"
          className="text-muted-foreground/70 hover:text-foreground/70 transition-colors"
        >
          {name}
        </Link>
      </span>
    );
  }

  return (
    <Link
      href="/auth?tab=signin"
      className="text-xs text-muted-foreground/70 hover:text-foreground/70 transition-colors tracking-widest"
    >
      Sign in
    </Link>
  );
}
