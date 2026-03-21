async function renderHomePage(container) {
  setSeo({
    title: "livescoreFree.online | The Stadium Spectacle | Live Scores & Arena Coverage",
    description: "Track the global matchday universe with livescoreFree.online. High-contrast scores, headline reports, and arena tables for every major competition.",
    path: "/home"
  });

  const heroMatch = state.liveMatches[0] || state.upcomingMatches[0] || trendingMatches(1)[0];
  const trust = getTrustSignals();

  // Dynamic Live Score Grid Generator
  const renderTailwindLiveMatch = (match) => {
    return `
    <a href="${routeForMatch(match)}" data-link class="bg-surface-container border-l-4 border-primary p-5 flex flex-col gap-4 group hover:bg-surface-container-high transition-all">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-sm">${getSportIcon(match.sportGroup) || 'sports_soccer'}</span>
          <span class="text-[10px] font-black uppercase tracking-widest opacity-60">${escapeHtml(match.leagueLabel)}</span>
        </div>
        ${match.status === 'live' ? `
        <span class="flex items-center gap-1.5 bg-[#CC1616] text-white px-2 py-0.5 rounded-sm text-[9px] font-black">
          <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
        </span>` : `<span class="text-[9px] font-bold opacity-40 uppercase">${formatDateTime(match.date)}</span>`}
      </div>
      <div class="flex justify-between items-center px-2">
        <div class="flex flex-col items-center gap-1 w-[40%] text-center">
          <span class="font-black italic text-sm md:text-lg tracking-tighter truncate w-full">${escapeHtml(match.homeName)}</span>
        </div>
        <div class="flex flex-col items-center w-[20%] text-center">
          <span class="text-xl md:text-2xl font-black italic text-primary">${escapeHtml(match.homeScore || '0')} - ${escapeHtml(match.awayScore || '0')}</span>
          <span class="text-[9px] font-bold opacity-40 uppercase mt-1">${match.status === 'live' ? "LIVE" : "FT"}</span>
        </div>
        <div class="flex flex-col items-center gap-1 w-[40%] text-center">
          <span class="font-black italic text-sm md:text-lg tracking-tighter truncate w-full">${escapeHtml(match.awayName)}</span>
        </div>
      </div>
    </a>`;
  };

  const renderTailwindUpcomingMatch = (match) => {
    return `
    <a href="${routeForMatch(match)}" data-link class="bg-surface-container p-6 rounded-lg border border-white/5 hover:border-primary/50 transition-colors cursor-pointer">
      <div class="flex justify-between text-[10px] font-bold text-on-surface-variant mb-6 uppercase tracking-widest">
        <span>${escapeHtml(match.leagueLabel)}</span>
        <span>${formatDateTime(match.date)}</span>
      </div>
      <div class="flex items-center justify-between mb-8">
        <div class="flex flex-col items-center gap-2 w-2/5 text-center">
          <div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-[10px] font-black overflow-hidden">${escapeHtml((match.homeName || '').substring(0,3).toUpperCase())}</div>
          <span class="text-[10px] font-bold uppercase tracking-tight truncate w-full">${escapeHtml(match.homeName)}</span>
        </div>
        <span class="text-xl font-black text-primary italic w-1/5 text-center">VS</span>
        <div class="flex flex-col items-center gap-2 w-2/5 text-center">
          <div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-[10px] font-black overflow-hidden">${escapeHtml((match.awayName || '').substring(0,3).toUpperCase())}</div>
          <span class="text-[10px] font-bold uppercase tracking-tight truncate w-full">${escapeHtml(match.awayName)}</span>
        </div>
      </div>
      <button class="w-full bg-surface-container-highest py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">Set Reminder</button>
    </a>`;
  };

  const heroHTML = heroMatch ? `
    <!-- Hero Slider Section -->
    <section class="relative w-full h-[716px] min-h-[500px] overflow-hidden group">
      <div class="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" data-alt="${escapeHtml(heroMatch.homeName)} vs ${escapeHtml(heroMatch.awayName)}" style="background-image: linear-gradient(to right, rgba(14,14,14,0.9), rgba(14,14,14,0.2)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2IvR-jmcJ0VGKTrBYh0phyyK-_fqQIU1lTkuSjtZkOMD0XZfu3NeXxF6ux9nvQOSMuKpnbFLyLS0MAMZ1LDBoWi55Ia3TNddkCs4xgHED83fU2eVbHkDKlxwmSDJvsTJRimIsPn6X8SEd6NuMwuRjxPLLghAJUKke3oinSA_WqlO0XqXLqKtBnZxZGlSymnrH2TVJ6qelV400MPhTFSQQxvanR9UNX0lDUZG8raTqs2qj8v_em1VMY6BIOwuIi3crBeDvm2Qv6lpB')"></div>
      <div class="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <span class="flex items-center gap-2 bg-[#CC1616] text-white px-3 py-1 rounded-sm text-xs font-black tracking-widest uppercase">
            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
          </span>
          <span class="text-on-surface-variant font-bold text-sm tracking-tighter uppercase">${escapeHtml(heroMatch.leagueLabel)} • ${formatDateTime(heroMatch.date)}</span>
        </div>
        <h1 class="font-headline font-black text-5xl md:text-8xl tracking-tighter leading-[0.9] mb-8 uppercase italic text-on-surface">
          <span class="truncate max-w-[40%] inline-block">${escapeHtml(heroMatch.homeName)}</span> <span class="text-primary">${escapeHtml(heroMatch.homeScore || '0')} - ${escapeHtml(heroMatch.awayScore || '0')}</span> <span class="truncate max-w-[40%] inline-block">${escapeHtml(heroMatch.awayName)}</span>
        </h1>
        <div class="flex flex-wrap gap-4 mb-12">
          <a href="${routeForMatch(heroMatch)}" data-link class="bg-gradient-to-r from-primary to-primary-container px-8 py-4 rounded-md text-on-primary font-black uppercase text-sm tracking-widest flex items-center gap-2 transition-transform active:scale-95">
            <span class="material-symbols-outlined">play_circle</span> Match Center
          </a>
        </div>
      </div>
    </section>
  ` : `
    <section class="relative w-full h-[400px] flex items-center justify-center bg-surface-container">
       <h1 class="text-2xl font-black text-on-surface">No Live Matches Available</h1>
    </section>
  `;

  container.innerHTML = `
    ${heroHTML}

    <!-- Multiverse (All Sports) Grid -->
    <section class="py-16 px-6 max-w-7xl mx-auto">
      <div class="flex justify-between items-end mb-10">
        <div>
          <h2 class="text-4xl font-black italic tracking-tighter uppercase mb-2">The Multiverse</h2>
          <p class="text-on-surface-variant text-sm tracking-wide">EXPLORE EVERY ARENA IN THE STREAM</p>
        </div>
        <div class="w-24 h-[1px] bg-primary"></div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${Object.entries(SPORT_GROUPS).map(([key, sport]) => `
          <a class="group glass-card p-6 rounded-xl flex flex-col items-center gap-4 hover:bg-primary-container transition-colors" data-link href="/sport/${key}">
            <span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">${getSportIcon(key) || 'sports_soccer'}</span>
            <span class="font-bold text-xs tracking-widest uppercase">${escapeHtml(sport.label)}</span>
          </a>
        `).join("")}
      </div>
    </section>

    <!-- Live Score All Matches Section -->
    <section class="py-16 px-6 max-w-7xl mx-auto">
      <div class="flex items-center gap-4 mb-10">
        <h2 class="text-3xl font-black italic tracking-tighter uppercase">Live Score All Matches</h2>
        <div class="flex-1 h-[1px] bg-white/10"></div>
        <div class="flex gap-2">
           <a href="/live" data-link class="text-xs font-bold uppercase tracking-widest text-primary hover:underline">View All</a>
        </div>
      </div>
      ${state.liveMatches.length > 0 ? `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${state.liveMatches.slice(0, 6).map(renderTailwindLiveMatch).join("")}
      </div>
      ` : `
        <div class="bg-surface-container p-10 text-center rounded-lg text-on-surface-variant font-bold">
          The arena is currently quiet. No matches are live right now.
        </div>
      `}
    </section>

    <!-- Upcoming Matches Grid -->
    <section class="py-16 px-6 bg-surface-container-low">
      <div class="max-w-7xl mx-auto">
        <h3 class="text-2xl font-black tracking-tighter uppercase mb-8 flex items-center gap-3">
          <span class="w-8 h-[2px] bg-primary"></span> Upcoming Matches Scheduled
        </h3>
        ${state.upcomingMatches.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          ${state.upcomingMatches.slice(0, 8).map(renderTailwindUpcomingMatch).join("")}
        </div>
        ` : `
          <div class="bg-surface-container p-10 text-center rounded-lg text-on-surface-variant font-bold">
            No upcoming matches scheduled.
          </div>
        `}
      </div>
    </section>

    <!-- News & Trending -->
    <section class="py-16 px-6 max-w-7xl mx-auto bg-surface-container-lowest">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div class="lg:col-span-3">
          <h4 class="text-3xl font-black italic uppercase tracking-tighter mb-8">Headline Reports</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8" id="home-news-grid">
             <div class="text-on-surface-variant">Fetching latest reports...</div>
          </div>
        </div>
      </div>
    </section>
  `;

  const leagueKey = TOP_LEAGUE_KEYS.find((key) => state.matches.some((match) => match.leagueKey === key)) || "eng.1";
  const mount = qs("#home-standings-card", container);
  if (mount) {
    void renderLeagueStandingsCard(mount, leagueKey, "Featured Table");
  }

  setTimeout(() => {
     const newsGrid = qs("#home-news-grid", container);
     if (newsGrid) {
         fetchApi('/news')
           .then(data => {
              if (data && data.articles && data.articles.length > 0) {
                  newsGrid.innerHTML = data.articles.slice(0, 2).map((article, i) => `
                    <a href="${escapeHtml(article.url || '#')}" target="_blank" class="group cursor-pointer block">
                      <div class="relative aspect-video rounded-xl overflow-hidden mb-4 bg-surface-container">
                        ${article.urlToImage ? `<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${escapeHtml(article.urlToImage)}" alt="news"/>` : ''}
                        ${i === 0 ? `<div class="absolute top-4 left-4 bg-primary text-on-primary px-2 py-1 text-[10px] font-black uppercase tracking-widest">Top Story</div>` : ''}
                      </div>
                      <h5 class="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">${escapeHtml(article.title)}</h5>
                      <p class="text-on-surface-variant text-sm mt-2 line-clamp-2">${escapeHtml(article.source?.name || 'News')}</p>
                    </a>
                  `).join("");
              } else {
                  newsGrid.innerHTML = '<div class="text-on-surface-variant">No reports found.</div>';
              }
           })
           .catch(() => {
              newsGrid.innerHTML = '<div class="text-on-surface-variant">Failed to load reports.</div>';
           });
     }
  }, 100);
}
