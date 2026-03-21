import Link from 'next/link';

export default function MatchDetails({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-brand hover:underline font-semibold font-sans mb-4 inline-block tracking-wide">
        &larr; Back to Matches
      </Link>
      
      <div className="bg-surface rounded-xl p-4 md:p-8 border border-line shadow-sm relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none"></div>
         
         <div className="text-center mb-8 relative z-10">
           <span className="text-sm font-bold text-brand uppercase tracking-wider bg-brand/10 border border-brand/20 px-4 py-1.5 rounded-full drop-shadow">
             <span className="w-2 h-2 rounded-full bg-brand inline-block mr-2 animate-pulse"></span>
             Live - 75'
           </span>
         </div>
         
         <div className="flex justify-between items-center px-2 md:px-12 relative z-10">
           <div className="text-center flex-1">
             <div className="w-16 h-16 md:w-24 md:h-24 bg-surface-soft rounded-full mx-auto mb-4 border border-line flex items-center justify-center shadow-lg">
               <span className="font-display font-bold text-xl md:text-3xl text-muted">MCY</span>
             </div>
             <h2 className="font-display text-lg md:text-2xl font-bold uppercase text-foreground text-glow-soft">Manchester City</h2>
           </div>
           
           <div className="text-center px-4 md:px-8 shrink-0">
             <div className="font-display font-bold text-4xl md:text-7xl text-brand drop-shadow-lg">2 - 1</div>
           </div>
           
           <div className="text-center flex-1">
             <div className="w-16 h-16 md:w-24 md:h-24 bg-surface-soft rounded-full mx-auto mb-4 border border-line flex items-center justify-center shadow-lg">
               <span className="font-display font-bold text-xl md:text-3xl text-muted">ARS</span>
             </div>
             <h2 className="font-display text-lg md:text-2xl font-bold uppercase text-foreground text-glow-soft">Arsenal</h2>
           </div>
         </div>
      </div>
      
      {/* Match Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
           {/* Timeline placeholder */}
           <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
             <h3 className="font-display font-bold text-xl uppercase text-accent mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-accent rounded-sm inline-block"></span>
                Match Timeline
             </h3>
             <div className="space-y-4 font-sans text-sm">
               <div className="flex gap-4 p-3 bg-surface-soft rounded-lg border border-line/50">
                 <span className="text-brand font-bold w-12">75'</span>
                 <span className="text-foreground">Substitution (Man City)</span>
               </div>
               <div className="flex gap-4 p-3 bg-surface-soft rounded-lg border border-line/50">
                 <span className="text-accent font-bold w-12">62'</span>
                 <span className="text-foreground font-semibold">Goal - Man City (K. De Bruyne)</span>
               </div>
               <div className="flex gap-4 p-3 bg-surface-soft rounded-lg border border-line/50">
                 <span className="text-muted font-bold w-12">45'</span>
                 <span className="text-foreground">Half Time</span>
               </div>
             </div>
           </div>
        </div>
        
        <div className="col-span-1 space-y-6">
           <div className="bg-surface rounded-xl p-6 border border-line shadow-sm">
             <h3 className="font-display font-bold text-xl uppercase text-brand mb-6 flex items-center gap-2">
               <span className="w-1.5 h-6 bg-brand rounded-sm inline-block"></span>
               Team Stats
             </h3>
             <ul className="space-y-4 font-sans text-sm">
               <li className="flex justify-between p-2 border-b border-line last:border-0">
                 <span className="text-muted">Possession</span>
                 <span className="font-bold text-foreground">62% - 38%</span>
               </li>
               <li className="flex justify-between p-2 border-b border-line last:border-0">
                 <span className="text-muted">Shots on Target</span>
                 <span className="font-bold text-foreground">8 - 3</span>
               </li>
               <li className="flex justify-between p-2 border-b border-line last:border-0">
                 <span className="text-muted">Corners</span>
                 <span className="font-bold text-foreground">6 - 2</span>
               </li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
