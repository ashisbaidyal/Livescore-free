"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Clock, Flame, ChevronRight, Activity } from 'lucide-react';

const SPORTS = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'tennis', name: 'Tennis' },
];

export default function MatchesBoard() {
  const [activeTab, setActiveTab] = useState('football');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-line">
        {SPORTS.map(sport => (
          <button
            key={sport.id}
            onClick={() => setActiveTab(sport.id)}
            className={`px-6 py-3 font-display font-bold uppercase tracking-wider text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === sport.id 
                ? 'text-brand drop-shadow-[0_0_8px_rgba(255,50,50,0.5)]' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            {sport.name}
            {activeTab === sport.id && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-brand rounded-t-md shadow-[0_0_12px_rgba(255,50,50,0.8)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Mock Match Card - Live */}
        <Link href="/match/uuid-1" className="bg-surface/60 backdrop-blur-md rounded-2xl p-5 border border-line hover:border-brand/60 transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(255,50,50,0.15)] group relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand/20 transition-colors duration-500"></div>
           
           <div className="flex justify-between items-center mb-5 relative z-10">
             <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
               <span className="w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(255,50,50,0.8)]"></span>
               <span className="text-xs font-bold text-brand uppercase tracking-widest">Live</span>
             </div>
             <span className="text-sm font-bold text-brand animate-pulse">75'</span>
           </div>
           
           <div className="space-y-4 relative z-10">
             <div className="flex justify-between items-center group-hover:px-1 transition-all duration-300">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-background border border-line flex items-center justify-center shadow-inner">
                   <Trophy className="w-4 h-4 text-muted" />
                 </div>
                 <span className="font-bold font-sans text-foreground text-lg">Man City</span>
               </div>
               <span className="font-display text-3xl text-foreground font-bold drop-shadow-md">2</span>
             </div>
             
             <div className="flex justify-between items-center group-hover:px-1 transition-all duration-300">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-background border border-line flex items-center justify-center shadow-inner">
                   <Trophy className="w-4 h-4 text-muted" />
                 </div>
                 <span className="font-bold font-sans text-foreground text-lg">Arsenal</span>
               </div>
               <span className="font-display text-3xl text-muted font-bold">1</span>
             </div>
           </div>

           <div className="mt-5 pt-4 border-t border-line/50 flex justify-between items-center relative z-10">
              <span className="text-xs text-muted font-sans flex items-center gap-1 group-hover:text-foreground transition-colors duration-300">
                <Activity className="w-3 h-3" />
                Premier League
              </span>
              <ChevronRight className="w-4 h-4 text-brand transform group-hover:translate-x-1 transition-transform duration-300" />
           </div>
        </Link>
        
        {/* Mock Match Card - Upcoming */}
        <Link href="/match/uuid-2" className="bg-surface/40 backdrop-blur-md rounded-2xl p-5 border border-line/60 hover:border-accent/50 transition-all duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(255,100,100,0.1)] group relative overflow-hidden">
           <div className="flex justify-between items-center mb-5 relative z-10">
             <div className="flex items-center gap-2 bg-surface-soft border border-line px-3 py-1 rounded-full">
               <Clock className="w-3 h-3 text-muted" />
               <span className="text-xs font-bold text-muted uppercase tracking-widest">Upcoming</span>
             </div>
             <span className="text-sm font-bold text-muted">14:00</span>
           </div>
           
           <div className="space-y-4 relative z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
             <div className="flex justify-between items-center group-hover:px-1 transition-all duration-300">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-background border border-line flex items-center justify-center shadow-inner">
                    <Trophy className="w-4 h-4 text-muted" />
                 </div>
                 <span className="font-bold font-sans text-foreground text-lg">Real Madrid</span>
               </div>
               <span className="font-display text-2xl text-muted font-bold">-</span>
             </div>
             
             <div className="flex justify-between items-center group-hover:px-1 transition-all duration-300">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-background border border-line flex items-center justify-center shadow-inner">
                    <Trophy className="w-4 h-4 text-muted" />
                 </div>
                 <span className="font-bold font-sans text-foreground text-lg">Barcelona</span>
               </div>
               <span className="font-display text-2xl text-muted font-bold">-</span>
             </div>
           </div>

           <div className="mt-5 pt-4 border-t border-line/50 flex justify-between items-center relative z-10">
              <span className="text-xs text-muted font-sans flex items-center gap-1 group-hover:text-foreground transition-colors duration-300">
                <Flame className="w-3 h-3 text-accent" />
                La Liga
              </span>
              <ChevronRight className="w-4 h-4 text-muted transform group-hover:translate-x-1 group-hover:text-accent transition-all duration-300" />
           </div>
        </Link>
      </div>
    </div>
  );
}
