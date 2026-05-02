import { StateCreator } from 'zustand';
import { AppState, UIState, ModalState } from '../types';

export const createUISlice: StateCreator<
  AppState,
  [],
  [],
  UIState
> = (set) => ({
  sidebarOpen: false,
  modalState: {
    isOpen: false,
    type: null,
    data: undefined,
  },
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  openModal: (type, data) => set({
    modalState: {
      isOpen: true,
      type,
      data,
    },
  }),
  
  closeModal: () => set({
    modalState: {
      isOpen: false,
      type: null,
      data: undefined,
    },
  }),
});

// Made with Bob
