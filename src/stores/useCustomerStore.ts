import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiFetch, ApiError } from "@/lib/apiClient";
import type { Customer, TimelineEvent } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

type StoreStatus = "idle" | "loading" | "ready" | "error";

interface CustomerState {
  customers: Customer[];
  events: TimelineEvent[];
  status: StoreStatus;
  hasLoaded: boolean;
  bootstrap: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  loadCustomerEvents: (customerId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt"> & { id?: string }) => Promise<string>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addEvent: (event: Omit<TimelineEvent, "id">) => Promise<void>;
  deleteEvent: (customerId: string, eventId: string) => Promise<void>;
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken ?? null;
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
      hasLoaded: false,
      bootstrap: async () => {
        const { hasLoaded, status } = get();
        if (hasLoaded || status === "loading") return;
        await get().refreshCustomers();
        set({ hasLoaded: true });
      },
      refreshCustomers: async () => {
        const accessToken = getAccessToken();
        if (!accessToken) {
          set({ customers: [], events: [], status: "idle", hasLoaded: false });
          return;
        }

        const prev = get();
        set({ status: "loading" });
        try {
          const { customers } = await apiFetch<{ customers: Customer[] }>("/api/customers", {
            method: "GET",
            accessToken,
          });
          set({ customers, status: "ready" });
        } catch (err) {
          if (isUnauthorized(err)) {
            set({ customers: [], events: [], status: "idle", hasLoaded: false });
            return;
          }
          set({ customers: prev.customers, events: prev.events, status: "error" });
          throw err;
        }
      },
      loadCustomerEvents: async (customerId) => {
        const accessToken = getAccessToken();
        if (!accessToken) return;

        const prev = get();
        try {
          const { events } = await apiFetch<{ events: TimelineEvent[] }>(
            `/api/customers/${encodeURIComponent(customerId)}/events`,
            { method: "GET", accessToken },
          );

          set({
            events: [
              ...prev.events.filter((e) => e.customerId !== customerId),
              ...events,
            ],
          });
        } catch (err) {
          if (isUnauthorized(err)) {
            set({ customers: [], events: [], status: "idle", hasLoaded: false });
            return;
          }
          throw err;
        }
      },
      addCustomer: async (customer) => {
        const accessToken = getAccessToken();
        if (!accessToken) throw new Error("未登录");

        const { name, gender, birthDate, birthTime, phone, tags, notes, customFields } = customer;
        const { customer: created } = await apiFetch<{ customer: Customer }>("/api/customers", {
          method: "POST",
          accessToken,
          body: JSON.stringify({
            name,
            gender,
            birthDate,
            birthTime,
            phone,
            tags,
            notes,
            customFields,
          }),
        });

        set((state) => ({ customers: [created, ...state.customers] }));
        return created.id;
      },
      updateCustomer: async (id, updates) => {
        const accessToken = getAccessToken();
        if (!accessToken) throw new Error("未登录");

        const { customer } = await apiFetch<{ customer: Customer }>(
          `/api/customers/${encodeURIComponent(id)}`,
          {
            method: "PUT",
            accessToken,
            body: JSON.stringify({
              name: updates.name,
              gender: updates.gender,
              birthDate: updates.birthDate,
              birthTime: updates.birthTime,
              phone: updates.phone,
              tags: updates.tags,
              notes: updates.notes,
              customFields: updates.customFields,
            }),
          },
        );

        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? customer : c)),
        }));
      },
      deleteCustomer: async (id) => {
        const accessToken = getAccessToken();
        if (!accessToken) throw new Error("未登录");

        await apiFetch<null>(`/api/customers/${encodeURIComponent(id)}`, {
          method: "DELETE",
          accessToken,
        });

        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
          events: state.events.filter((e) => e.customerId !== id),
        }));
      },
      addEvent: async (event) => {
        const accessToken = getAccessToken();
        if (!accessToken) throw new Error("未登录");

        const { customerId, description, tags, time } = event;
        const occurredAt = event.timestamp ? new Date(event.timestamp).toISOString() : time;

        const { event: created } = await apiFetch<{ event: TimelineEvent }>(
          `/api/customers/${encodeURIComponent(customerId)}/events`,
          {
            method: "POST",
            accessToken,
            body: JSON.stringify({
              occurredAt,
              description,
              tags,
            }),
          },
        );

        set((state) => ({
          events: [
            ...state.events.filter((e) => e.customerId !== customerId),
            created,
            ...state.events.filter((e) => e.customerId === customerId && e.id !== created.id),
          ],
        }));
      },
      deleteEvent: async (customerId, eventId) => {
        const accessToken = getAccessToken();
        if (!accessToken) throw new Error("未登录");

        await apiFetch<null>(
          `/api/customers/${encodeURIComponent(customerId)}/events/${encodeURIComponent(eventId)}`,
          { method: "DELETE", accessToken },
        );

        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
        }));
      },
    }),
    { name: "yanyice-customers" },
  ),
);
