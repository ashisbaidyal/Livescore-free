"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl p-6 md:p-8 border border-line shadow-sm">
        <h1 className="font-display font-bold text-3xl mb-6 text-foreground uppercase tracking-wider">Search</h1>
        
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted" />
          </div>
          <input
            type="text"
            className="w-full bg-surface-soft border border-line rounded-lg pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-brand/60 transition-colors font-sans"
            placeholder="Search for teams, leagues, or matches..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Mock Search Results */}
      {query.length > 2 && (
        <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
          <h2 className="font-display font-bold text-xl mb-4 text-brand uppercase">Results for &quot;{query}&quot;</h2>
          <div className="space-y-3">
             <Link href="/match/custom-id-1" className="block p-4 bg-surface-soft border border-line rounded-lg hover:border-brand/50 transition-colors">
               <div className="flex justify-between items-center">
                 <span className="font-bold font-sans text-foreground">Manchester City vs Arsenal</span>
                 <span className="text-brand text-sm font-bold uppercase">Live</span>
               </div>
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}
