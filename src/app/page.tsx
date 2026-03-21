import MatchesBoard from '@/components/MatchesBoard';

export default function Home() {
  return (
    <div className="space-y-8 relative pb-10">
      {/* Hero Banner Area */}
      <section className="bg-surface/80 rounded-3xl p-8 border border-line shadow-2xl relative overflow-hidden backdrop-blur-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-brand animate-ping opacity-75 absolute"></span>
              <span className="w-2 h-2 rounded-full bg-brand relative z-10"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-brand">Live Network</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-3 text-foreground uppercase tracking-tight drop-shadow-lg">
              Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-accent to-brand bg-[length:200%_auto] animate-gradient">Matches</span>
            </h1>
            <p className="text-muted font-sans text-lg max-w-xl leading-relaxed">
              Real-time score updates across the global sports multiverse. Never miss a moment of the action.
            </p>
          </div>
        </div>
        
        {/* Enhanced ambient background elements */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand/10 to-transparent mix-blend-screen mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand/20 rounded-full blur-[80px]"></div>
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-accent/10 rounded-full blur-[80px]"></div>
      </section>

      {/* AdSense Placeholder - Styled to blend in better */}
      <div className="w-full h-24 bg-surface-soft border border-line border-dashed rounded-xl flex items-center justify-center p-4 text-muted/50 text-xs font-bold uppercase tracking-[0.2em] text-center hover:bg-surface transition-colors cursor-crosshair">
        Advertisement Space
      </div>

      {/* Interactive Matches Board imported as a Client Component */}
      <MatchesBoard />
    </div>
  );
}
