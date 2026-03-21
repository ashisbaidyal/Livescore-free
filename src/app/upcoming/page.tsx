"use client";
import MatchesBoard from '@/components/MatchesBoard';
import { Clock } from 'lucide-react';

export default function UpcomingPage() {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl p-6 md:p-8 border border-line shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-display font-bold text-3xl mb-2 text-foreground uppercase tracking-wider flex items-center gap-3">
            <Clock className="text-muted w-8 h-8" />
            Upcoming Fixtures
          </h1>
          <p className="text-muted font-sans max-w-2xl">
            Browse the global schedule for upcoming sports matches across all top leagues.
          </p>
        </div>
      </div>
      <MatchesBoard />
    </div>
  );
}
