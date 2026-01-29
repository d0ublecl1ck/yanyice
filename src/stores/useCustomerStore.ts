
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer, TimelineEvent } from '@/lib/types';

interface CustomerState {
  customers: Customer[];
  events: TimelineEvent[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }) => string;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
}

const MOCK_ID = 'cust-001';
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: MOCK_ID,
    name: '张景明',
    gender: 'male',
    birthDate: '1985-06-15',
    birthTime: '10:30',
    phone: '13800138000',
    tags: ['重要客户', '甲木', '老客户'],
    notes: '性格稳重，经商多年。主要咨询事业与健康。',
    customFields: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
  },
];

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: 'ev-1',
    customerId: MOCK_ID,
    time: '2010年',
    timestamp: new Date('2010-01-01T00:00:00.000Z').getTime(),
    description: '于北京创立信息技术公司，事业起步',
    tags: ['事业'],
  },
  {
    id: 'ev-2',
    customerId: MOCK_ID,
    time: '2015年',
    timestamp: new Date('2015-01-01T00:00:00.000Z').getTime(),
    description: '完婚，同年购入首套房产',
    tags: ['婚姻', '房产'],
  },
  {
    id: 'ev-3',
    customerId: MOCK_ID,
    time: '2022年',
    timestamp: new Date('2022-01-01T00:00:00.000Z').getTime(),
    description: '得子，咨询起名与健康',
    tags: ['添丁'],
  },
];

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customers: MOCK_CUSTOMERS,
      events: MOCK_EVENTS,
      addCustomer: (c) => {
        const id = c.id ?? Math.random().toString(36).substr(2, 9);
        set((state) => ({
          customers: [...state.customers, { ...c, id, createdAt: Date.now() }],
        }));
        return id;
      },
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
