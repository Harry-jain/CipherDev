import { StateCreator } from 'zustand';
import { AuditState } from '../types';

export const createAuditSlice: StateCreator<AuditState> = (set) => ({
  auditLogs: [],
  isAuditing: false,

  setAuditLogs: (logs) => set({ auditLogs: logs }),

  setAuditing: (isAuditing) => set({ isAuditing }),

  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [...state.auditLogs, log],
    })),
});

// Made with Bob
