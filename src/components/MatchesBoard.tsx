"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Clock, Flame, ChevronRight, Activity } from 'lucide-react';

import { useLiveMatches, DisplayMatch } from '@/lib/api';

const SPORTS = [
  { id: 'football', name: 'Football' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'tennis', name: 'Tennis' },
];

export default function MatchesBoard() {
  const [activeTab, setActiveTab] = useState('football');
  const { matches, isLoading, isError } = useLiveMatches(activeTab);

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 min-h-[400px]">
        {isLoading && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <Activity className="w-8 h-8 text-brand animate-spin" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] font-sans">Connecting to Arena Feed...</span>
          </div>
        )}

        {isError && (
          <div className="col-span-full bg-surface/40 p-12 rounded-2xl border border-brand/20 flex flex-col items-center justify-center text-center space-y-4">
            <Activity className="w-8 h-8 text-brand opacity-30" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] font-sans">Signal Interrupted. Cannot Reach Proxies.</span>
          </div>
        )}

        {!isLoading && !isError && matches?.length === 0 && (
          <div className="col-span-full bg-surface/40 p-12 rounded-2xl border border-line flex flex-col items-center justify-center text-center space-y-4">
            <Trophy className="w-8 h-8 text-muted opacity-30" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] font-sans opacity-50">No Live Events</span>
          </div>
        )}

        {!isLoading && !isError && matches?.map((match: DisplayMatch) => {
          const isLive = match.status === 'live';
          
          return (
            <Link key={match.id} href={match.link} className={`bg-surface/60 backdrop-blur-md rounded-2xl p-5 border transition-all duration-300 shadow-sm group relative overflow-hidden ${isLive ? 'border-line hover:border-brand/60 hover:shadow-[0_8px_30px_rgba(255,50,50,0.15)]' : 'border-line/60 hover:border-accent/50 hover:shadow-[0_8px_30px_rgba(255,100,100,0.1)]'}`}>
               {isLive && (
                 <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand/20 transition-colors duration-500"></div>
               )}
               
               <div className="flex justify-between items-center mb-5 relative z-10">
                 {isLive ? (
                   <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
                     <span className="w-2 h-2 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(255,50,50,0.8)]"></span>
                     <span className="text-xs font-bold text-brand uppercase tracking-widest">Live</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2 bg-surface-soft border border-line px-3 py-1 rounded-full">
                     <Clock className="w-3 h-3 text-muted" />
                     <span className="text-xs font-bold text-muted uppercase tracking-widest">{match.status === 'final' ? 'FINAL' : 'UPCOMING'}</span>
                   </div>
                 )}
                 <span className={`text-sm font-bold ${isLive ? 'text-brand animate-pulse' : 'text-muted'}`}>{match.statusDetail}</span>
               </div>
               
               <div className={`space-y-4 relative z-10 ${!isLive && 'opacity-80 group-hover:opacity-100 transition-opacity duration-300'}`}>
                 <div className="flex justify-between items-center group-hover:px-1 transition-all duration-300">
                   <div className="flex items-center gap-3 w-[70%]">
                     <div className="w-8 h-8 rounded-full bg-background border border-line flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 p-1">
                       {match.homeTeam.logo ? (
                         <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-full h-full object-contain" />
                       ) : (
                         <Trophy className="w-4 h-4 text-muted" />
                       )}
                     </div>
                     <span className="font-bold font-sans text-foreground text-sm sm:text-lg truncate">{match.homeTeam.name}</span>
                   </div>
                   <span className={`font-display text-2xl sm:text-3xl font-bold flex-shrink-0 ${match.status === 'final' ? 'text-foreground' : isLive ? 'text-foreground drop-shadow-md' : 'text-muted'}`}>{match.homeTeam.score}</span>
                 </div>
                 
                 <div className="flex justify-between items-center group-hover:px-1 transition-all duration-300">
                   <div className="flex items-center gap-3 w-[70%]">
                     <div className="w-8 h-8 rounded-full bg-background border border-line flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 p-1">
                       {match.awayTeam.logo ? (
                         <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-full h-full object-contain" />
                       ) : (
                         <Trophy className="w-4 h-4 text-muted" />
                       )}
                     </div>
                     <span className="font-bold font-sans text-foreground text-sm sm:text-lg truncate">{match.awayTeam.name}</span>
                   </div>
                   <span className={`font-display text-2xl sm:text-3xl font-bold flex-shrink-0 ${match.status === 'final' ? 'text-foreground' : isLive ? 'text-foreground drop-shadow-md' : 'text-muted'}`}>{match.awayTeam.score}</span>
                 </div>
               </div>

               <div className="mt-5 pt-4 border-t border-line/50 flex justify-between items-center relative z-10">
                  <span className="text-xs text-muted font-sans flex items-center gap-1 group-hover:text-foreground transition-colors duration-300 truncate max-w-[80%]">
                    {isLive ? <Activity className="w-3 h-3 flex-shrink-0" /> : <Flame className="w-3 h-3 text-accent flex-shrink-0" />}
                    {match.leagueName}
                  </span>
                  <ChevronRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ${isLive ? 'text-brand' : 'text-muted group-hover:text-accent'}`} />
               </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
