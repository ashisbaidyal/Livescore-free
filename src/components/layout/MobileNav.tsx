"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Star, Newspaper, Menu } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const baseClasses = "flex flex-col items-center justify-center w-full h-full gap-1 text-muted hover:text-foreground transition-colors";
  const activeClasses = "text-brand";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface border-t border-line pb-safe supports-[backdrop-filter]:bg-surface/80 supports-[backdrop-filter]:backdrop-blur">
      <div className="flex h-full px-2">
        <Link href="/" className={`${baseClasses} ${pathname === '/' ? activeClasses : ''}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Home</span>
        </Link>
        <Link href="/search" className={`${baseClasses} ${pathname === '/search' ? activeClasses : ''}`}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Search</span>
        </Link>
        <Link href="/trending" className={`${baseClasses} ${pathname === '/trending' ? activeClasses : ''}`}>
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand rounded-full animate-pulse" />
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider">Live</span>
        </Link>
        <Link href="/favorites" className={`${baseClasses} ${pathname === '/favorites' ? activeClasses : ''}`}>
          <Star className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Favs</span>
        </Link>
        <Link href="/news" className={`${baseClasses} ${pathname === '/news' ? activeClasses : ''}`}>
          <Newspaper className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">News</span>
        </Link>
      </div>
    </nav>
  );
}
