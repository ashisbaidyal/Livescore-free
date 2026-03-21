"use client";
import { Newspaper } from 'lucide-react';

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl p-6 md:p-8 border border-line shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="font-display font-bold text-3xl mb-2 text-foreground uppercase tracking-wider flex items-center gap-3">
            <Newspaper className="text-brand w-8 h-8" />
            Breaking News
          </h1>
          <p className="text-muted font-sans max-w-2xl">
            Global sports headlines, transfers, and exclusive updates.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface rounded-xl border border-line overflow-hidden hover:border-brand/40 transition-colors group cursor-pointer">
            <div className="h-48 bg-surface-soft w-full flex items-center justify-center border-b border-line group-hover:bg-brand/5 transition-colors">
              <Newspaper className="w-12 h-12 text-muted opacity-20" />
            </div>
            <div className="p-5">
              <span className="text-xs font-bold text-brand uppercase tracking-widest mb-2 block">Transfer Market</span>
              <h3 className="font-display font-bold text-lg text-foreground mb-3 leading-snug">Major Signing Announced as Top Striker Shifts Leagues</h3>
              <p className="text-muted font-sans text-sm line-clamp-2">Exclusive reports confirm the multi-million dollar transfer has been finalized following weeks of intense speculation...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
