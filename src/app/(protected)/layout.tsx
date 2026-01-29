"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Layout } from "@/components/Layout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCaseStore } from "@/stores/useCaseStore";
import { useCustomerStore } from "@/stores/useCustomerStore";
import { useToastStore } from "@/stores/useToastStore";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const syncLiuyaoFromApi = useCaseStore((s) => s.syncLiuyaoFromApi);
  const showToast = useToastStore((s) => s.show);
  const caseHasHydrated = useCaseStore((s) => s.hasHydrated);
  const customerHasHydrated = useCustomerStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (status === "unauthenticated") router.replace("/login");
  }, [hasHydrated, status, router]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (status !== "authenticated") return;
    if (!caseHasHydrated || !customerHasHydrated) return;
    void useCaseStore.getState().bootstrap();
    void useCustomerStore.getState().bootstrap();
    if (!accessToken) return;
    void syncLiuyaoFromApi(accessToken).catch(() => {
      showToast("六爻记录同步失败（可稍后重试）", "warning");
    });
    if (!accessToken) return;
    void syncLiuyaoFromApi(accessToken).catch(() => {
      showToast("六爻记录同步失败（可稍后重试）", "warning");
    });
  }, [accessToken, hasHydrated, status, caseHasHydrated, customerHasHydrated, showToast, syncLiuyaoFromApi]);

  if (!hasHydrated) return null;
  if (status !== "authenticated") return null;

  return <Layout key={pathname}>{children}</Layout>;
}
