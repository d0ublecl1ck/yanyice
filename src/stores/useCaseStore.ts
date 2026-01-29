
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConsultationRecord } from '@/lib/types';

interface CaseState {
  records: ConsultationRecord[];
  addRecord: (record: Omit<ConsultationRecord, 'id' | 'createdAt'>) => string;
  updateRecord: (id: string, updates: Partial<ConsultationRecord>) => void;
  deleteRecord: (id: string) => void;
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (r) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          records: [...state.records, { ...r, id, createdAt: Date.now() }]
        }));
        return id;
      },
      updateRecord: (id, updates) => set((state) => ({
        records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteRecord: (id) => set((state) => ({
        records: state.records.filter(r => r.id !== id)
      })),
    }),
    { name: 'yanyice-records' }
  )
);
