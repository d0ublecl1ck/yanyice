import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ApiError, apiFetch } from "@/lib/apiClient";
import type { Customer, CustomerCreateInput, CustomerUpdateInput, TimelineEvent } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

type LoadStatus = "idle" | "loading" | "ready" | "error";

interface CustomerState {
  customers: Customer[];
  events: TimelineEvent[];
  status: LoadStatus;
  hasHydrated: boolean;
  hasLoaded: boolean;
  loadedForUserId: string | null;

  setHasHydrated: (hasHydrated: boolean) => void;
  bootstrap: () => Promise<void>;
  refreshCustomers: () => Promise<void>;

  addCustomer: (customer: CustomerCreateInput) => Promise<string>;
  updateCustomer: (id: string, updates: CustomerUpdateInput) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  refreshEvents: (customerId: string) => Promise<void>;
  loadCustomerEvents: (customerId: string) => Promise<void>;
  addEvent: (event: Omit<TimelineEvent, "id">) => Promise<void>;
  deleteEvent: (customerId: string, eventId: string) => Promise<void>;
}

function getAuthContext() {
  const { accessToken, user, status } = useAuthStore.getState();
  if (status !== "authenticated" || !accessToken || !user) return null;
  return { accessToken, userId: user.id };
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      events: [],
      status: "idle",
      hasHydrated: false,
      hasLoaded: false,
      loadedForUserId: null,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      bootstrap: async () => {
        const auth = getAuthContext();
        if (!auth) {
          set({ customers: [], events: [], status: "idle", hasLoaded: false, loadedForUserId: null });
          return;
        }

        if (get().loadedForUserId !== auth.userId) {
          set({ customers: [], events: [], loadedForUserId: auth.userId, status: "idle", hasLoaded: false });
        }

        await get().refreshCustomers();
        set({ hasLoaded: true });
      },

      refreshCustomers: async () => {
        const auth = getAuthContext();
        if (!auth) {
          set({ customers: [], events: [], status: "idle", hasLoaded: false, loadedForUserId: null });
          return;
        }

        const prev = get();
        set({ status: "loading" });
        try {
          const { customers } = await apiFetch<{ customers: Customer[] }>("/api/customers", {
            method: "GET",
            accessToken: auth.accessToken,
          });
          set({ customers, status: "ready" });
        } catch (err) {
          if (isUnauthorized(err)) {
            set({ customers: [], events: [], status: "idle", hasLoaded: false, loadedForUserId: null });
            return;
          }
          set({ customers: prev.customers, events: prev.events, status: "error" });
          throw err;
        }
      },

      addCustomer: async (customer) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { customer: created } = await apiFetch<{ customer: Customer }>("/api/customers", {
          method: "POST",
          accessToken: auth.accessToken,
          body: JSON.stringify(customer),
        });

        set((state) => ({ customers: [created, ...state.customers] }));
        return created.id;
      },

      updateCustomer: async (id, updates) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { customer } = await apiFetch<{ customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`, {
          method: "PUT",
          accessToken: auth.accessToken,
          body: JSON.stringify(updates),
        });

        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? customer : c)),
        }));
      },

      deleteCustomer: async (id) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>(`/api/customers/${encodeURIComponent(id)}`, {
          method: "DELETE",
          accessToken: auth.accessToken,
        });

        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          events: state.events.filter((e) => e.customerId !== id),
        }));
      },

      refreshEvents: async (customerId) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const { events } = await apiFetch<{ events: TimelineEvent[] }>(
          `/api/customers/${encodeURIComponent(customerId)}/events`,
          { method: "GET", accessToken: auth.accessToken },
        );

        set((state) => ({
          events: [...state.events.filter((e) => e.customerId !== customerId), ...events],
        }));
      },

      loadCustomerEvents: async (customerId) => {
        await get().refreshEvents(customerId);
      },

      addEvent: async (event) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        const occurredAt = event.timestamp ? new Date(event.timestamp) : new Date(event.time);
        if (Number.isNaN(occurredAt.getTime())) throw new Error("事件日期格式不正确");

        const { event: created } = await apiFetch<{ event: TimelineEvent }>(
          `/api/customers/${encodeURIComponent(event.customerId)}/events`,
          {
            method: "POST",
            accessToken: auth.accessToken,
            body: JSON.stringify({
              occurredAt: occurredAt.toISOString(),
              description: event.description,
              tags: event.tags,
            }),
          },
        );

        set((state) => ({
          events: [
            ...state.events.filter((e) => e.customerId !== event.customerId),
            created,
            ...state.events.filter((e) => e.customerId === event.customerId && e.id !== created.id),
          ],
        }));
      },

      deleteEvent: async (customerId, eventId) => {
        const auth = getAuthContext();
        if (!auth) throw new Error("未登录");

        await apiFetch<null>(
          `/api/customers/${encodeURIComponent(customerId)}/events/${encodeURIComponent(eventId)}`,
          { method: "DELETE", accessToken: auth.accessToken },
        );

        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
        }));
      },
    }),
    {
      name: "yanyice-customers",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.bootstrap();
      },
      partialize: (state) => ({
        customers: state.customers,
        events: state.events,
        loadedForUserId: state.loadedForUserId,
      }),
    },
  ),
);
