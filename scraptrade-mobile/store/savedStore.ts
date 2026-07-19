import { create } from 'zustand';
import { apiClient } from '../api/client';

interface SavedState {
  ids: number[];
  isLoading: boolean;
  fetchIds: () => Promise<void>;
  isSaved: (listingId: number) => boolean;
  toggle: (listingId: number) => Promise<boolean>;
  reset: () => void;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  ids: [],
  isLoading: false,

  fetchIds: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/saved-listings/ids');
      set({ ids: response.data as number[] });
    } catch {
      // Silently ignore — bookmarks are non-critical UI state.
    } finally {
      set({ isLoading: false });
    }
  },

  isSaved: (listingId) => get().ids.includes(listingId),

  toggle: async (listingId) => {
    const currentlySaved = get().ids.includes(listingId);

    // Optimistic update
    set({
      ids: currentlySaved
        ? get().ids.filter((id) => id !== listingId)
        : [...get().ids, listingId],
    });

    try {
      if (currentlySaved) {
        await apiClient.delete(`/saved-listings/${listingId}`);
        return false;
      }
      await apiClient.post(`/saved-listings/${listingId}`);
      return true;
    } catch (error) {
      // Roll back on failure
      set({
        ids: currentlySaved ? [...get().ids, listingId] : get().ids.filter((id) => id !== listingId),
      });
      throw error;
    }
  },

  reset: () => set({ ids: [], isLoading: false }),
}));
