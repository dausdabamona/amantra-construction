import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ArchiveApiResponse, ArchiveSnapshot } from '@/types/archive';

interface ArchiveState {
  loading: boolean;
  error: string | null;
  snapshot: ArchiveSnapshot | null;
  lastUpdated: Date | null;
}

interface ArchiveStore extends ArchiveState {
  setData: (payload: ArchiveApiResponse<ArchiveSnapshot> | ArchiveSnapshot) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ArchiveState = {
  loading: false,
  error: null,
  snapshot: null,
  lastUpdated: null,
};

export const useArchiveStore = create<ArchiveStore>()(
  persist(
    (set) => ({
      ...initialState,
      setData: (payload) => {
        const data = 'data' in payload ? payload.data : payload;
        set({ snapshot: data, error: null, lastUpdated: new Date() });
      },
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: 'archive-store',
      partialize: (state) => ({ snapshot: state.snapshot }),
    },
  ),
);

export const useArchiveLoading = () => useArchiveStore((state) => state.loading);
export const useArchiveError = () => useArchiveStore((state) => state.error);
export const useArchiveSnapshot = () => useArchiveStore((state) => state.snapshot);
