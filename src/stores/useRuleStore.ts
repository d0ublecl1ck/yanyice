
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rule } from '@/lib/types';

interface RuleState {
  rules: Rule[];
  addRule: (rule: Omit<Rule, 'id'>) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
}

export const useRuleStore = create<RuleState>()(
  persist(
    (set) => ({
      rules: [
        { id: '1', module: 'liuyao', name: '动爻克用神', enabled: true, condition: '动爻五行克制用神五行', message: '注意：当前卦象中存在动爻克制用神的情况，请详察应期。' },
      ],
      addRule: (r) => set((state) => ({
        rules: [...state.rules, { ...r, id: Math.random().toString(36).substr(2, 9) }]
      })),
      updateRule: (id, updates) => set((state) => ({
        rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteRule: (id) => set((state) => ({
        rules: state.rules.filter(r => r.id !== id)
      })),
    }),
    { name: 'yanyice-rules' }
  )
);
