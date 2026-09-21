"use client";

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-[var(--muted)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
