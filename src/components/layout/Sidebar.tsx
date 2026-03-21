export default function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 border-l p-4 space-y-6">
      <div className="bg-surface rounded-xl p-4 border border-line shadow-sm">
        <h3 className="font-display font-bold uppercase text-brand mb-2">Upcoming Events</h3>
        <ul className="space-y-3">
          <li className="text-sm font-sans flex justify-between">
            <span className="text-foreground">Man City vs Arsenal</span>
            <span className="text-muted text-xs">Tomorrow</span>
          </li>
          <li className="text-sm font-sans flex justify-between">
            <span className="text-foreground">Real Madrid vs Barca</span>
            <span className="text-muted text-xs">Oct 24</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-surface rounded-xl p-4 border border-line shadow-sm">
        <h3 className="font-display font-bold uppercase text-accent mb-2">Breaking News</h3>
        <ul className="space-y-3">
          <li className="text-sm font-sans">
            <span className="text-foreground block mb-1">Mbappe signs historic extension</span>
            <span className="text-muted text-xs">2 hours ago</span>
          </li>
          <li className="text-sm font-sans">
            <span className="text-foreground block mb-1">LeBron sets new career milestone</span>
            <span className="text-muted text-xs">5 hours ago</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
