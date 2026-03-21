import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  favoriteTeams: string[];
  addFavoriteTeam: (teamId: string) => void;
  removeFavoriteTeam: (teamId: string) => void;
  favoriteMatches: string[];
  addFavoriteMatch: (matchId: string) => void;
  removeFavoriteMatch: (matchId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      
      favoriteTeams: [],
      addFavoriteTeam: (teamId) =>
        set((state) => ({
          favoriteTeams: state.favoriteTeams.includes(teamId)
            ? state.favoriteTeams
            : [...state.favoriteTeams, teamId],
        })),
      removeFavoriteTeam: (teamId) =>
        set((state) => ({
          favoriteTeams: state.favoriteTeams.filter((id) => id !== teamId),
        })),

      favoriteMatches: [],
      addFavoriteMatch: (matchId) =>
        set((state) => ({
          favoriteMatches: state.favoriteMatches.includes(matchId)
            ? state.favoriteMatches
            : [...state.favoriteMatches, matchId],
        })),
      removeFavoriteMatch: (matchId) =>
        set((state) => ({
          favoriteMatches: state.favoriteMatches.filter((id) => id !== matchId),
        })),
    }),
    {
      name: 'livescorefree-storage',
    }
  )
);
