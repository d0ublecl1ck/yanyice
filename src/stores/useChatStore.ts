
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatRole = "user" | "model";

export interface Message {
  role: ChatRole;
  text: string;
  timestamp: number;
}

interface ChatState {
  chatHistories: Record<string, Message[]>;
  addMessage: (caseId: string, msg: Message) => void;
  clearHistory: (caseId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      chatHistories: {},
      addMessage: (caseId, msg) =>
        set((state) => ({
          chatHistories: {
            ...state.chatHistories,
            [caseId]: [...(state.chatHistories[caseId] ?? []), msg],
          },
        })),
      clearHistory: (caseId) =>
        set((state) => {
          const next = { ...state.chatHistories };
          delete next[caseId];
          return { chatHistories: next };
        }),
    }),
    { name: "yanyice-chat-histories" },
  ),
);

