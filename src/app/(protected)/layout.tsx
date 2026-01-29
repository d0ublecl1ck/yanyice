"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace("/login");
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) return null;
  if (!isAuthenticated) return null;

  return <Layout key={pathname}>{children}</Layout>;
}
