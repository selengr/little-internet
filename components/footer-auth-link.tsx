"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SessionUser {
  firstName?: string;
  email?: string;
}

// Lightweight footer entry point into the auth flow — shows "Sign in" for
// guests, or the account link once a session is detected. Deliberately kept
// out of the main nav/mobile-nav for now; footer-only per current scope.
export function FooterAuthLink() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) {
    // Reserve space silently to avoid a layout shift once the check resolves.
    return <span className="text-xs text-transparent select-none">Sign in</span>;
  }

  if (user) {
    return (
      <Link
        href="/account"
        className="text-xs text-muted-foreground/70 hover:text-foreground/70 transition-colors tracking-widest"
      >
        {user.firstName ? `Hi, ${user.firstName}` : "Account"}
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      className="text-xs text-muted-foreground/70 hover:text-foreground/70 transition-colors tracking-widest"
    >
      Sign in
    </Link>
  );
}
