"use client";
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Star } from 'lucide-react';

export default function FavoritesPage() {
  const { favoriteTeams, favoriteMatches } = useStore();

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl p-6 md:p-8 border border-line shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-display font-bold text-3xl mb-2 text-foreground uppercase tracking-wider flex items-center gap-3">
            <Star className="text-warning fill-warning w-8 h-8" />
            Your Favorites
          </h1>
          <p className="text-muted font-sans max-w-2xl">
            Track your favored teams and live matches directly from your local profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <h2 className="font-display font-bold text-xl mb-4 text-accent uppercase">Saved Teams</h2>
          {favoriteTeams.length === 0 ? (
            <p className="text-muted font-sans text-sm">You haven't added any favorite teams yet.</p>
          ) : (
            <div className="space-y-3">
               <p className="text-brand">Dynamically mapping from Zustand store...</p>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <h2 className="font-display font-bold text-xl mb-4 text-brand uppercase">Saved Matches</h2>
          {favoriteMatches.length === 0 ? (
            <p className="text-muted font-sans text-sm">You aren't tracking any specific matches yet.</p>
          ) : (
            <div className="space-y-3">
               <p className="text-brand">Dynamically mapping from Zustand store...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
