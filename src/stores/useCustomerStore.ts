
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer, TimelineEvent } from '@/lib/types';

interface CustomerState {
  customers: Customer[];
  events: TimelineEvent[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customers: [],
      events: [],
      addCustomer: (c) => set((state) => ({
        customers: [...state.customers, { ...c, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }]
      })),
      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),
      addEvent: (e) => set((state) => ({
        events: [...state.events, { ...e, id: Math.random().toString(36).substr(2, 9) }]
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),
    }),
    { name: 'yanyice-customers' }
  )
);
