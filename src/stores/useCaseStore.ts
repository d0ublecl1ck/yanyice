
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConsultationRecord } from '@/lib/types';

interface CaseState {
  records: ConsultationRecord[];
  addRecord: (record: Omit<ConsultationRecord, 'id' | 'createdAt'>) => string;
  updateRecord: (id: string, updates: Partial<ConsultationRecord>) => void;
  deleteRecord: (id: string) => void;
}

const MOCK_ID = 'cust-001';
const MOCK_RECORDS: ConsultationRecord[] = [
  {
    id: 'rec-1',
    customerId: MOCK_ID,
    module: 'bazi',
    subject: '事业大运详批',
    notes: '日主强旺，喜火木。2024年甲辰年，财星入墓，宜守不宜攻。',
    tags: ['事业', '大运'],
    baziData: {
      yearStem: '乙',
      yearBranch: '丑',
      monthStem: '壬',
      monthBranch: '午',
      dayStem: '甲',
      dayBranch: '寅',
      hourStem: '己',
      hourBranch: '巳',
      calendarType: 'solar',
      birthDate: '1985-06-15T10:30:00.000Z',
      location: '北京市 北京市 --',
      isTrueSolarTime: true,
      isDst: false,
    },
    verifiedStatus: 'accurate',
    verifiedNotes: '反馈2023年偏财运极佳。',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: 'rec-2',
    customerId: MOCK_ID,
    module: 'liuyao',
    subject: '占近期某项目投资可否',
    notes: '世爻财动化退，虽财旺但化退说明资金后续乏力，不建议大额追加。',
    tags: ['投资'],
    liuyaoData: {
      lines: [0, 2, 1, 0, 1, 0],
      date: new Date().toISOString(),
      subject: '项目投资',
      monthBranch: '戌',
      dayBranch: '甲子',
    },
    verifiedStatus: 'unverified',
    verifiedNotes: '',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
];

export const useCaseStore = create<CaseState>()(
  persist(
    (set) => ({
      records: MOCK_RECORDS,
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
