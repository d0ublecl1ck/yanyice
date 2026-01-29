"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useCaseStore } from "@/stores/useCaseStore";
import { useToastStore } from "@/stores/useToastStore";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const syncLiuyaoFromApi = useCaseStore((s) => s.syncLiuyaoFromApi);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (!hasHydrated) return;
    if (status === "unauthenticated") router.replace("/login");
  }, [hasHydrated, status, router]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (status !== "authenticated") return;
    void useCustomerStore.getState().bootstrap();
    if (!accessToken) return;
    void syncLiuyaoFromApi(accessToken).catch(() => {
      showToast("六爻记录同步失败（可稍后重试）", "warning");
    });
  }, [accessToken, hasHydrated, showToast, status, syncLiuyaoFromApi]);

  if (!hasHydrated) return null;
  if (status !== "authenticated") return null;

  return <Layout key={pathname}>{children}</Layout>;
}
