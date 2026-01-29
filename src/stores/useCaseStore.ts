
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConsultationRecord } from '@/lib/types';
import {
  createLiuyaoRecord,
  deleteLiuyaoRecord,
  listLiuyaoRecords,
  updateLiuyaoRecord,
  type LiuyaoRecordPayload,
} from '@/lib/liuyaoApi';

interface CaseState {
  records: ConsultationRecord[];
  addRecord: (record: Omit<ConsultationRecord, 'id' | 'createdAt'>) => string;
  updateRecord: (id: string, updates: Partial<ConsultationRecord>) => void;
  deleteRecord: (id: string) => void;
  syncLiuyaoFromApi: (accessToken: string) => Promise<void>;
  upsertLiuyaoRemote: (
    accessToken: string,
    args: { id?: string; payload: LiuyaoRecordPayload | Partial<LiuyaoRecordPayload> },
  ) => Promise<string>;
  deleteLiuyaoRemote: (accessToken: string, id: string) => Promise<void>;
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
    module: 'bazi',
    subject: '家庭与子女运势',
    notes: '子女宫得生，未来两年多关注教育投入与亲子沟通。',
    tags: ['家庭', '子女'],
    baziData: {
      yearStem: '辛',
      yearBranch: '酉',
      monthStem: '丁',
      monthBranch: '卯',
      dayStem: '癸',
      dayBranch: '亥',
      hourStem: '乙',
      hourBranch: '巳',
      calendarType: 'solar',
      birthDate: '1992-03-21T09:10:00.000Z',
      location: '上海市 上海市 --',
      isTrueSolarTime: false,
      isDst: false,
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
      syncLiuyaoFromApi: async (accessToken) => {
        const remote = await listLiuyaoRecords(accessToken);
        set((state) => ({
          records: [...state.records.filter((r) => r.module !== 'liuyao'), ...remote],
        }));
      },
      upsertLiuyaoRemote: async (accessToken, args) => {
        const record = args.id
          ? await updateLiuyaoRecord(accessToken, args.id, args.payload)
          : await createLiuyaoRecord(accessToken, args.payload as LiuyaoRecordPayload);

        set((state) => {
          const rest = state.records.filter((r) => r.id !== record.id);
          return { records: [...rest, record] };
        });
        return record.id;
      },
      deleteLiuyaoRemote: async (accessToken, id) => {
        await deleteLiuyaoRecord(accessToken, id);
        set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
      },
    }),
    { name: 'yanyice-records' }
  )
);
