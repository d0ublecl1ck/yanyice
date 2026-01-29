"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (status === "unauthenticated") router.replace("/login");
  }, [hasHydrated, status, router]);

  if (!hasHydrated) return null;
  if (status !== "authenticated") return null;

  return <Layout key={pathname}>{children}</Layout>;
}
