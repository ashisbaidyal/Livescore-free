"use client";
import MatchesBoard from '@/components/MatchesBoard';
import { Flame } from 'lucide-react';

export default function TrendingPage() {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl p-6 md:p-8 border border-line shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-display font-bold text-3xl mb-2 text-foreground uppercase tracking-wider flex items-center gap-3">
            <Flame className="text-accent w-8 h-8" />
            Trending Events
          </h1>
          <p className="text-muted font-sans max-w-2xl">
            The most highly anticipated live matches and tournaments currently broadcasting worldwide.
          </p>
        </div>
      </div>
      <MatchesBoard />
    </div>
  );
}
