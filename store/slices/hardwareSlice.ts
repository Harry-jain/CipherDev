import { StateCreator } from 'zustand';
import { HardwareState } from '../types';

export const createHardwareSlice: StateCreator<HardwareState> = (set) => ({
  deviceProfile: null,
  setDeviceProfile: (profile) => set({ deviceProfile: profile }),
});

// Made with Bob
