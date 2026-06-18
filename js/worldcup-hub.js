(() => {
  const WC_CONTEXT = { sport: "soccer", league: "fifa.world" };
  const WC_API = window.LSF_CONFIG?.api || {};
  const WC_FALLBACK = "/icons/icon-192.png";
  const wcState = {
    live: [],
    upcoming: [],
    results: [],
    standings: [],
    teams: [],
    players: [],
    posts: [],
    rosters: new Map()
  };
  let rosterLoading = false;
  let rosterRequestToken = 0;

  function wcEscape(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function wcNormalizeMatches(items) {
    const list = Array.isArray(items) ? items : [];
    return typeof filterRenderableMatches === "function" ? filterRenderableMatches(list) : list;
  }

  function wcGetStat(entry, names) {
    const stats = Array.isArray(entry?.stats) ? entry.stats : [];
    const stat = stats.find((item) => names.includes(String(item?.name || "").toLowerCase()));
    return stat ? (stat.displayValue || stat.value || "-") : "-";
  }

  function wcFormatDate(value, options = {}) {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return "TBD";
    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: options.time ? "2-digit" : undefined,
      minute: options.time ? "2-digit" : undefined,
      hour12: true,
      weekday: options.weekday ? "short" : undefined
    }).replace(",", " -");
  }

  function wcSortMatches(left, right) {
    const order = { live: 0, upcoming: 1, finished: 2 };
    const statusDiff = (order[left?.status] ?? 9) - (order[right?.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(left?.date || 0) - new Date(right?.date || 0);
  }

  function wcCombineMatches() {
    const seen = new Map();
    [...wcState.live, ...wcState.upcoming, ...wcState.results].forEach((match) => {
      if (!match?.id) return;
      if (!seen.has(match.id)) seen.set(match.id, match);
    });
    return Array.from(seen.values()).sort(wcSortMatches);
  }

  function wcRosterCount() {
    return Array.from(wcState.rosters.values()).reduce((sum, roster) => sum + (Array.isArray(roster) ? roster.length : 0), 0);
  }

  function wcRenderSidebarLive() {
    const container = document.getElementById("wc-sidebar-live-container");
    if (!container) return;
    if (!wcState.live.length) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-8 text-center text-[10px] font-black uppercase tracking-[0.25em] text-on-surface/35">
          No live World Cup matches right now
        </div>
      `;
      return;
    }
    container.innerHTML = wcState.live.slice(0, 4).map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-primary/40 hover:bg-white/10 transition-all">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-[9px] font-black uppercase tracking-[0.22em] text-primary">Live</span>
          <span class="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface/40">${wcEscape(match.time || match.status)}</span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <span class="truncate text-[10px] font-black uppercase">${wcEscape(match.homeTeam?.name || "Home")}</span>
            <span class="text-sm font-black italic text-primary">${wcEscape(match.homeTeam?.score || "0")}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="truncate text-[10px] font-black uppercase">${wcEscape(match.awayTeam?.name || "Away")}</span>
            <span class="text-sm font-black italic text-primary">${wcEscape(match.awayTeam?.score || "0")}</span>
          </div>
        </div>
      </a>
    `).join("");
  }

  function wcRenderTicker() {
    const track = document.getElementById("wc-ticker-track");
    if (!track) return;
    const items = wcCombineMatches().slice(0, 10);
    if (!items.length) {
      track.classList.remove("ticker-scroll");
      track.innerHTML = `
        <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/50">
          <span class="material-symbols-outlined text-primary text-sm">radio_button_checked</span>
          World Cup board loading
        </div>
      `;
      return;
    }
    const doubled = items.concat(items);
    track.classList.add("ticker-scroll");
    track.innerHTML = doubled.map((match) => `
      <a href="${buildMatchUrl(match)}" class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] hover:border-primary/40 hover:bg-white/10 transition-colors">
        <span class="text-on-surface/40">${wcEscape(match.league || "FIFA WC 2026")}</span>
        <span>${wcEscape(match.homeTeam?.abbreviation || match.homeTeam?.name || "HOME")} ${wcEscape(match.homeTeam?.score || "0")} - ${wcEscape(match.awayTeam?.score || "0")} ${wcEscape(match.awayTeam?.abbreviation || match.awayTeam?.name || "AWAY")}</span>
        <span class="${match.status === "live" ? "text-primary" : "text-on-surface/40"}">${wcEscape(match.time || match.status)}</span>
      </a>
    `).join("");
  }

  function wcPickFeaturedMatch() {
    return wcState.live[0] || wcState.upcoming[0] || wcState.results[0] || null;
  }

  function wcRenderHero() {
    const featured = wcPickFeaturedMatch();
    const backdrop = document.getElementById("wc-hero-backdrop");
    const badge = document.getElementById("wc-featured-badge");
    const league = document.getElementById("wc-featured-league");
    const homeLogo = document.getElementById("wc-featured-home-logo");
    const awayLogo = document.getElementById("wc-featured-away-logo");
    const homeName = document.getElementById("wc-featured-home-name");
    const awayName = document.getElementById("wc-featured-away-name");
    const score = document.getElementById("wc-featured-score");
    const time = document.getElementById("wc-featured-time");
    const meta = document.getElementById("wc-featured-meta");
    const link = document.getElementById("wc-featured-link");

    const statEl = (id) => document.getElementById(id);
    if (statEl("wc-stat-live")) statEl("wc-stat-live").textContent = String(wcState.live.length || 0);
    if (statEl("wc-stat-upcoming")) statEl("wc-stat-upcoming").textContent = String(wcState.upcoming.length || 0);
    if (statEl("wc-stat-teams")) statEl("wc-stat-teams").textContent = String(wcState.teams.length || 32);
    if (statEl("wc-stat-players")) statEl("wc-stat-players").textContent = String(wcRosterCount() || wcState.players.length || 0);

    if (!featured) {
      if (backdrop) backdrop.innerHTML = "";
      if (badge) badge.textContent = "Awaiting feed";
      if (league) league.textContent = "World Cup board loading";
      if (homeName) homeName.textContent = "Home";
      if (awayName) awayName.textContent = "Away";
      if (score) score.textContent = "vs";
      if (time) time.textContent = "Loading";
      if (meta) meta.textContent = "Watching for live or upcoming World Cup matches";
      if (link) link.href = "/upcoming?s=soccer&l=fifa.world";
      return;
    }

    const statusLabel = featured.status === "live" ? "Live now" : (featured.status === "finished" ? "Final" : "Scheduled");
    if (badge) badge.textContent = statusLabel.toUpperCase();
    if (league) league.textContent = featured.league || "FIFA World Cup 2026";
    if (homeLogo) {
      homeLogo.src = featured.homeTeam?.logo || WC_FALLBACK;
      homeLogo.alt = `${featured.homeTeam?.name || "Home team"} logo`;
    }
    if (awayLogo) {
      awayLogo.src = featured.awayTeam?.logo || WC_FALLBACK;
      awayLogo.alt = `${featured.awayTeam?.name || "Away team"} logo`;
    }
    if (homeName) homeName.textContent = featured.homeTeam?.name || "Home";
    if (awayName) awayName.textContent = featured.awayTeam?.name || "Away";
    if (score) {
      score.textContent = featured.status === "upcoming"
        ? "VS"
        : `${featured.homeTeam?.score || "0"}-${featured.awayTeam?.score || "0"}`;
    }
    if (time) {
      time.textContent = featured.status === "upcoming"
        ? wcFormatDate(featured.date, { time: true, weekday: true })
        : (featured.time || statusLabel);
    }
    if (meta) {
      meta.textContent = featured.status === "upcoming"
        ? `${featured.venue || "Venue TBA"} | ${featured.broadcast || featured.league || "FIFA World Cup 2026"}`
        : `${featured.homeTeam?.name || "Home"} vs ${featured.awayTeam?.name || "Away"} | ${featured.broadcast || featured.league || "FIFA World Cup 2026"}`;
    }
    if (link) {
      link.href = buildMatchUrl(featured);
      link.textContent = featured.status === "upcoming" ? "Open Fixture Centre" : "Open Match Centre";
    }
    if (backdrop) {
      const home = featured.homeTeam?.logo || WC_FALLBACK;
      const away = featured.awayTeam?.logo || WC_FALLBACK;
      backdrop.innerHTML = `
        <div class="absolute inset-y-0 left-[-6%] w-[44%] opacity-[0.12] blur-[1px]" style="background:url('${home}') center/contain no-repeat;"></div>
        <div class="absolute inset-y-0 right-[-6%] w-[44%] opacity-[0.12] blur-[1px]" style="background:url('${away}') center/contain no-repeat;"></div>
      `;
    }
  }

  function wcRenderLiveGrid() {
    const container = document.getElementById("wc-live-grid");
    if (!container) return;
    const matches = wcState.live.length ? wcState.live : wcState.upcoming.slice(0, 4);
    if (!matches.length) {
      container.innerHTML = `
        <div class="lg:col-span-2 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No live or upcoming World Cup matches available
        </div>
      `;
      return;
    }
    container.innerHTML = matches.slice(0, 6).map((match) => {
      const upcoming = match.status === "upcoming";
      const live = match.status === "live";
      const badge = live ? "Live" : (upcoming ? "Upcoming" : "Final");
      const scoreDisplay = upcoming
        ? wcFormatDate(match.date, { time: true, weekday: true })
        : `${match.homeTeam?.score || "0"} - ${match.awayTeam?.score || "0"}`;
      return `
        <a href="${buildMatchUrl(match)}" class="block group">
          <article class="rounded-3xl border border-white/5 bg-surface-container-high p-6 h-full hover:border-primary/40 hover:-translate-y-1 transition-all">
            <div class="flex items-center justify-between gap-4 mb-5">
              <span class="text-[10px] font-black uppercase tracking-[0.26em] text-on-surface/40">${wcEscape(match.league || "FIFA World Cup 2026")}</span>
              <span class="rounded-full border ${live ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-on-surface/45"} px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em]">${badge}</span>
            </div>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
              <div class="text-center">
                <img src="${wcEscape(match.homeTeam?.logo || WC_FALLBACK)}" alt="" class="w-14 h-14 object-contain mx-auto mb-3" onerror="this.src='${WC_FALLBACK}'"/>
                <div class="text-sm font-black italic uppercase tracking-tight line-clamp-2">${wcEscape(match.homeTeam?.name || "Home")}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-black italic ${live ? "text-primary" : "text-on-surface"}">${scoreDisplay}</div>
                <div class="text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40 mt-2">${wcEscape(match.time || match.status)}</div>
              </div>
              <div class="text-center">
                <img src="${wcEscape(match.awayTeam?.logo || WC_FALLBACK)}" alt="" class="w-14 h-14 object-contain mx-auto mb-3" onerror="this.src='${WC_FALLBACK}'"/>
                <div class="text-sm font-black italic uppercase tracking-tight line-clamp-2">${wcEscape(match.awayTeam?.name || "Away")}</div>
              </div>
            </div>
            <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/45">${wcEscape(match.venue || match.broadcast || "Match centre available")}</div>
          </article>
        </a>
      `;
    }).join("");
  }

  function wcRenderSchedule() {
    const container = document.getElementById("wc-schedule-grid");
    if (!container) return;
    if (!wcState.upcoming.length) {
      container.innerHTML = `
        <div class="rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No upcoming World Cup fixtures available
        </div>
      `;
      return;
    }
    container.innerHTML = wcState.upcoming.slice(0, 14).map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-3xl border border-white/5 bg-surface-container-high p-5 hover:border-primary/40 hover:bg-surface-container transition-all">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div class="text-[10px] font-black uppercase tracking-[0.24em] text-primary mb-2">${wcFormatDate(match.date, { time: true, weekday: true })}</div>
            <h3 class="text-lg font-black italic uppercase tracking-tight">${wcEscape(match.homeTeam?.name || "Home")} vs ${wcEscape(match.awayTeam?.name || "Away")}</h3>
            <div class="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/40 mt-2">${wcEscape(match.venue || match.broadcast || "Venue TBA")}</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center"><img src="${wcEscape(match.homeTeam?.logo || WC_FALLBACK)}" class="w-7 h-7 object-contain" alt="" onerror="this.src='${WC_FALLBACK}'"/></div>
            <span class="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/45">vs</span>
            <div class="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center"><img src="${wcEscape(match.awayTeam?.logo || WC_FALLBACK)}" class="w-7 h-7 object-contain" alt="" onerror="this.src='${WC_FALLBACK}'"/></div>
          </div>
        </div>
      </a>
    `).join("");
  }

  function wcRenderTeams() {
    const container = document.getElementById("wc-teams-grid");
    if (!container) return;
    if (!wcState.teams.length) {
      container.innerHTML = `
        <div class="md:col-span-2 xl:col-span-3 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          Team list unavailable right now
        </div>
      `;
      return;
    }
    container.innerHTML = wcState.teams.map((team) => `
      <a href="${buildTeamProfileUrl(team, WC_CONTEXT.sport, WC_CONTEXT.league)}" class="block group rounded-3xl border border-white/5 bg-surface-container-high p-6 hover:border-primary/40 hover:-translate-y-1 transition-all">
        <div class="flex items-start justify-between gap-4 mb-6">
          <img src="${wcEscape(team.logo || WC_FALLBACK)}" alt="" class="w-16 h-16 object-contain" onerror="this.src='${WC_FALLBACK}'"/>
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-on-surface/40">${wcEscape(team.abbreviation || "FIFA")}</span>
        </div>
        <h3 class="text-xl font-black italic uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">${wcEscape(team.name || "Team")}</h3>
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/40 mb-4">${wcEscape(team.location || team.shortName || "")}</div>
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
          <div class="text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40 mb-1">Record</div>
          <div class="font-bold text-sm">${wcEscape(team.record || "Group stage feed")}</div>
        </div>
      </a>
    `).join("");
  }

  function wcRenderGroups() {
    const container = document.getElementById("wc-groups-table");
    if (!container) return;
    if (!wcState.standings.length) {
      container.innerHTML = `
        <div class="rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          Group standings loading
        </div>
      `;
      return;
    }

    // ESPN returns standings that may be grouped (children) or flat entries
    const groups = Array.isArray(wcState.standings)
      ? wcState.standings
      : [];

    // Attempt to parse as grouped standings (children array) or flat entries
    const renderGroup = (groupName, entries) => {
      if (!entries || !entries.length) return "";
      return `
        <div class="mb-6">
          <div class="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-3 px-4">${wcEscape(groupName)}</div>
          <div class="overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/5">
            <div class="grid grid-cols-[minmax(0,1fr)_32px_32px_32px_36px] gap-2 border-b border-white/5 px-4 py-3 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/35">
              <span>Team</span><span>P</span><span>W</span><span>L</span><span>Pts</span>
            </div>
            ${entries.slice(0, 4).map((entry, idx) => {
              const team = entry?.team || {};
              const teamUrl = buildTeamProfileUrl({
                id: team.id,
                name: team.displayName || team.name,
                logo: team.logos?.[0]?.href,
                league: WC_CONTEXT.league,
                sport: WC_CONTEXT.sport
              }, WC_CONTEXT.sport, WC_CONTEXT.league);
              const rowPos = idx + 1;
              return `
                <a href="${teamUrl}" class="lsf-standings-row grid grid-cols-[minmax(0,1fr)_32px_32px_32px_36px] gap-2 border-b border-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] last:border-b-0 ${rowPos <= 2 ? 'lsf-standings-rank-top3' : ''}">
                  <span class="flex items-center gap-2 min-w-0">
                    <img src="${wcEscape(team.logos?.[0]?.href || WC_FALLBACK)}" alt="" class="h-6 w-6 rounded-full bg-white/5 object-contain" onerror="this.src='${WC_FALLBACK}'"/>
                    <span class="truncate">${wcEscape(team.shortDisplayName || team.displayName || team.name || "Team")}</span>
                  </span>
                  <span class="text-on-surface/60">${wcEscape(wcGetStat(entry, ["gamesplayed", "games_played"]))}</span>
                  <span class="text-primary">${wcEscape(wcGetStat(entry, ["wins", "winsoverall"]))}</span>
                  <span class="text-on-surface/60">${wcEscape(wcGetStat(entry, ["losses", "loss"]))}</span>
                  <span class="text-on-surface">${wcEscape(wcGetStat(entry, ["points"]))}</span>
                </a>
              `;
            }).join("")}
          </div>
        </div>
      `;
    };

    // Check if standings have children (grouped by group A, B, C...)
    const firstEntry = groups[0];
    if (firstEntry?.children && Array.isArray(firstEntry.children)) {
      // Grouped standings
      container.innerHTML = firstEntry.children.slice(0, 8).map((group) => {
        const groupName = group.name || group.abbreviation || "Group";
        const entries = group.standings?.entries || group.entries || [];
        return renderGroup(groupName, entries);
      }).join("");
    } else if (firstEntry?.standings?.entries || firstEntry?.entries) {
      // Single level with children
      container.innerHTML = groups.slice(0, 8).map((group) => {
        const groupName = group.name || group.abbreviation || "Group";
        const entries = group.standings?.entries || group.entries || [];
        return renderGroup(groupName, entries);
      }).join("");
    } else {
      // Flat standings (knockout or no groups yet)
      container.innerHTML = `
        <div class="overflow-hidden rounded-[1.75rem] border border-white/5 bg-white/5">
          <div class="grid grid-cols-[minmax(0,1fr)_36px_36px_36px_44px] gap-2 border-b border-white/5 px-4 py-4 text-[9px] font-black uppercase tracking-[0.24em] text-on-surface/35">
            <span>Team</span><span>P</span><span>W</span><span>L</span><span>Pts</span>
          </div>
          ${groups.slice(0, 16).map((entry, index) => {
            const team = entry?.team || {};
            const teamUrl = buildTeamProfileUrl({
              id: team.id,
              name: team.displayName || team.name,
              logo: team.logos?.[0]?.href,
              league: WC_CONTEXT.league,
              sport: WC_CONTEXT.sport
            }, WC_CONTEXT.sport, WC_CONTEXT.league);
            return `
              <a href="${teamUrl}" class="grid grid-cols-[minmax(0,1fr)_36px_36px_36px_44px] gap-2 border-b border-white/5 px-4 py-4 text-[10px] font-black uppercase tracking-[0.18em] hover:bg-white/5 last:border-b-0 transition-colors">
                <span class="flex items-center gap-3 min-w-0">
                  <img src="${wcEscape(team.logos?.[0]?.href || WC_FALLBACK)}" alt="" class="h-7 w-7 rounded-full bg-white/5 object-contain p-0.5" onerror="this.src='${WC_FALLBACK}'"/>
                  <span class="truncate">${wcEscape(team.shortDisplayName || team.displayName || team.name || "Team")}</span>
                </span>
                <span class="text-on-surface/60">${wcEscape(wcGetStat(entry, ["gamesplayed", "games_played"]))}</span>
                <span class="text-primary">${wcEscape(wcGetStat(entry, ["wins", "winsoverall"]))}</span>
                <span class="text-on-surface/60">${wcEscape(wcGetStat(entry, ["losses", "loss"]))}</span>
                <span class="text-on-surface">${wcEscape(wcGetStat(entry, ["points"]))}</span>
              </a>
            `;
          }).join("")}
        </div>
      `;
    }
  }

  function wcRenderPlayers() {
    const container = document.getElementById("wc-player-spotlights");
    if (!container) return;
    if (!wcState.players.length) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-10 text-center text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/35">
          Player feed loading
        </div>
      `;
      return;
    }
    container.innerHTML = wcState.players.slice(0, 6).map((player) => `
      <a href="${buildPlayerProfileUrl(player, WC_CONTEXT.sport, WC_CONTEXT.league)}" class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-4 hover:border-primary/40 hover:bg-white/10 transition-all">
        <img src="${wcEscape(player.headshot?.href || player.headshot?.url || WC_FALLBACK)}" alt="" class="h-14 w-14 rounded-2xl bg-surface object-cover" onerror="this.src='${WC_FALLBACK}'"/>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-black italic uppercase tracking-tight">${wcEscape(player.fullName || player.shortName || "Player")}</div>
          <div class="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-primary">${wcEscape(player.team?.name || player.team?.abbreviation || "National team")}</div>
          <div class="mt-2 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">
            ${wcEscape(player.position?.displayName || player.position?.name || "Soccer")} ${player.jersey ? `| #${wcEscape(player.jersey)}` : ""}
          </div>
        </div>
      </a>
    `).join("");
  }

  function wcRenderRosters() {
    const container = document.getElementById("wc-rosters-grid");
    if (!container) return;
    const rosterCards = wcState.teams
      .map((team) => ({ team, roster: wcState.rosters.get(team.id) || [] }))
      .filter((entry) => entry.roster.length > 0);

    if (!rosterCards.length) {
      const message = rosterLoading ? "Loading national team squads" : "Team rosters will appear once the feed resolves";
      container.innerHTML = `
        <div class="xl:col-span-2 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          ${message}
        </div>
      `;
      return;
    }

    container.innerHTML = rosterCards.slice(0, 8).map(({ team, roster }) => `
      <article class="rounded-3xl border border-white/5 bg-surface-container-high overflow-hidden">
        <div class="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div class="flex items-center gap-4 min-w-0">
            <img src="${wcEscape(team.logo || WC_FALLBACK)}" alt="" class="h-12 w-12 object-contain" onerror="this.src='${WC_FALLBACK}'"/>
            <div class="min-w-0">
              <h3 class="truncate text-xl font-black italic uppercase tracking-tight">${wcEscape(team.name || "National Squad")}</h3>
              <p class="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">${roster.length} squad players</p>
            </div>
          </div>
          <a href="${buildTeamProfileUrl(team, WC_CONTEXT.sport, WC_CONTEXT.league)}" class="text-[9px] font-black uppercase tracking-[0.22em] text-primary hover:underline">Open team</a>
        </div>
        <div class="grid gap-3 p-5 sm:grid-cols-2">
          ${roster.slice(0, 8).map((player) => `
            <a href="${buildPlayerProfileUrl(player, WC_CONTEXT.sport, WC_CONTEXT.league)}" class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 hover:border-primary/30 transition-colors">
              <img src="${wcEscape(player.headshot?.href || player.headshot?.url || WC_FALLBACK)}" alt="" class="h-11 w-11 rounded-xl bg-surface object-cover" onerror="this.src='${WC_FALLBACK}'"/>
              <div class="min-w-0">
                <div class="truncate text-sm font-black uppercase tracking-tight">${wcEscape(player.fullName || player.shortName || "Player")}</div>
                <div class="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">
                  ${wcEscape(player.position?.displayName || player.position?.name || "Squad")} ${player.jersey ? `| #${wcEscape(player.jersey)}` : ""}
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function wcRenderResults() {
    const container = document.getElementById("wc-results-grid");
    if (!container) return;
    if (!wcState.results.length) {
      container.innerHTML = `
        <div class="md:col-span-2 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No recent World Cup results available
        </div>
      `;
      return;
    }
    container.innerHTML = wcState.results.slice(0, 8).map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-3xl border border-white/5 bg-surface-container-high p-5 hover:border-primary/40 transition-all">
        <div class="flex items-center justify-between gap-4 mb-4">
          <span class="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/40">${wcEscape(wcFormatDate(match.date, { weekday: true }))}</span>
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-primary">Final</span>
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div class="text-center">
            <img src="${wcEscape(match.homeTeam?.logo || WC_FALLBACK)}" alt="" class="mx-auto mb-3 h-12 w-12 object-contain" onerror="this.src='${WC_FALLBACK}'"/>
            <div class="text-sm font-black italic uppercase tracking-tight">${wcEscape(match.homeTeam?.name || "Home")}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-black italic text-primary">${wcEscape(match.homeTeam?.score || "0")} - ${wcEscape(match.awayTeam?.score || "0")}</div>
            <div class="mt-2 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">${wcEscape(match.time || "Final")}</div>
          </div>
          <div class="text-center">
            <img src="${wcEscape(match.awayTeam?.logo || WC_FALLBACK)}" alt="" class="mx-auto mb-3 h-12 w-12 object-contain" onerror="this.src='${WC_FALLBACK}'"/>
            <div class="text-sm font-black italic uppercase tracking-tight">${wcEscape(match.awayTeam?.name || "Away")}</div>
          </div>
        </div>
      </a>
    `).join("");
  }

  function wcRenderBlog() {
    const container = document.getElementById("wc-blog-list");
    if (!container) return;
    if (!wcState.posts.length) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-10 text-center text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/35">
          World Cup coverage loading
        </div>
      `;
      return;
    }
    container.innerHTML = wcState.posts.slice(0, 4).map((post) => `
      <a href="${buildBlogArticleUrl(post)}" class="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-primary/40 hover:bg-white/10 transition-all">
        <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-primary">
          <img src="${wcEscape(typeof getSourceFaviconUrl === "function" ? getSourceFaviconUrl(post.source) : WC_FALLBACK)}" alt="" class="h-4 w-4 rounded-full object-cover" onerror="this.src='${WC_FALLBACK}'"/>
          <span>${wcEscape(post.source?.domain || post.source?.name || "Source")}</span>
        </div>
        <h3 class="mt-3 text-lg font-black italic uppercase tracking-tight leading-tight">${wcEscape(post.title || post.headline || "World Cup brief")}</h3>
        <p class="mt-3 text-[11px] leading-relaxed text-on-surface/60 line-clamp-3">${wcEscape(post.excerpt || post.description || "")}</p>
      </a>
    `).join("");
  }

  function wcUpdateCaches() {
    const combined = wcCombineMatches();
    window.currentTab = WC_CONTEXT.sport;
    window.currentLeagueFilter = WC_CONTEXT.league;
    window._cachedMatches = combined;
    window._cachedLiveMatches = wcState.live.slice();
    window._cachedUpcoming = wcState.upcoming.slice();
    window._cachedUpcomingMatches = wcState.upcoming.slice();
    window._cachedResults = wcState.results.slice();
    window._cachedBlogPosts = wcState.posts.slice();

    const liveCountText = document.getElementById("live-count-text");
    if (liveCountText) {
      liveCountText.textContent = wcState.live.length
        ? `${wcState.live.length} WC LIVE`
        : `${wcState.upcoming.length} WC NEXT`;
    }

    if (typeof updatePageTitle === "function") {
      updatePageTitle(wcState.live);
    }
  }

  function wcRenderAll() {
    wcUpdateCaches();
    wcRenderHero();
    wcRenderSidebarLive();
    wcRenderTicker();
    wcRenderLiveGrid();
    wcRenderSchedule();
    wcRenderTeams();
    wcRenderRosters();
    wcRenderResults();
    wcRenderGroups();
    wcRenderPlayers();
    wcRenderBlog();
  }

  async function wcLoadRosters() {
    if (!WC_API.info || rosterLoading || !wcState.teams.length) return;
    const nextTeams = wcState.teams.filter((team) => team?.id && !wcState.rosters.has(team.id));
    if (!nextTeams.length) return;

    rosterLoading = true;
    const token = ++rosterRequestToken;
    wcRenderRosters();

    try {
      const results = await Promise.all(nextTeams.map(async (team) => {
        try {
          const response = await fetch(buildApiUrl(WC_API.info, {
            type: "team",
            sport: WC_CONTEXT.sport,
            league: WC_CONTEXT.league,
            id: team.id
          }));
          if (!response.ok) return { teamId: team.id, roster: [] };
          const payload = await response.json();
          return { teamId: team.id, roster: Array.isArray(payload.roster) ? payload.roster : [] };
        } catch {
          return { teamId: team.id, roster: [] };
        }
      }));

      if (token !== rosterRequestToken) return;
      results.forEach(({ teamId, roster }) => {
        wcState.rosters.set(teamId, roster);
      });
    } finally {
      if (token === rosterRequestToken) {
        rosterLoading = false;
        wcRenderAll();
      }
    }
  }

  function wcSubscribe() {
    if (!window.LSFDataStore) return;

    window.LSFDataStore.subscribe({
      path: WC_API.live,
      params: { sport: WC_CONTEXT.sport, league: WC_CONTEXT.league },
      refreshMs: 30000,
      maxAgeMs: 12000
    }, (snapshot) => {
      if (!snapshot.data?.matches) return;
      wcState.live = wcNormalizeMatches(snapshot.data.matches).filter((m) => m.status === "live");
      wcRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: WC_API.upcoming,
      params: { sport: WC_CONTEXT.sport, league: WC_CONTEXT.league, days: 30 },
      refreshMs: 180000,
      maxAgeMs: 60000
    }, (snapshot) => {
      if (!snapshot.data?.matches) return;
      wcState.upcoming = wcNormalizeMatches(snapshot.data.matches).filter((m) => m.status === "upcoming").sort(wcSortMatches);
      wcRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: WC_API.results,
      params: { sport: WC_CONTEXT.sport, league: WC_CONTEXT.league, days: 30 },
      refreshMs: 180000,
      maxAgeMs: 60000
    }, (snapshot) => {
      if (!snapshot.data?.matches) return;
      wcState.results = wcNormalizeMatches(snapshot.data.matches).filter((m) => m.status === "finished").sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
      wcRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: WC_API.info,
      params: { type: "standings", sport: WC_CONTEXT.sport, league: WC_CONTEXT.league },
      refreshMs: 300000,
      maxAgeMs: 120000
    }, (snapshot) => {
      if (!snapshot.data) return;
      // Handle grouped standings (children) or flat entries or array of groups
      wcState.standings = snapshot.data.children
        || (Array.isArray(snapshot.data.entries) ? snapshot.data.entries : [])
        || snapshot.data.standings
        || [];
      wcRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: WC_API.info,
      params: { type: "teams", sport: WC_CONTEXT.sport, league: WC_CONTEXT.league },
      refreshMs: 300000,
      maxAgeMs: 120000
    }, (snapshot) => {
      if (!snapshot.data?.teams) return;
      wcState.teams = snapshot.data.teams.slice().sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
      wcRenderAll();
      wcLoadRosters();
    });

    window.LSFDataStore.subscribe({
      path: WC_API.info,
      params: { type: "players", sport: WC_CONTEXT.sport, league: WC_CONTEXT.league, limit: 24 },
      refreshMs: 300000,
      maxAgeMs: 120000
    }, (snapshot) => {
      if (!snapshot.data?.athletes) return;
      wcState.players = snapshot.data.athletes;
      wcRenderAll();
    });

    if (WC_API.blog) {
      window.LSFDataStore.subscribe({
        path: WC_API.blog,
        params: { sport: WC_CONTEXT.sport, league: WC_CONTEXT.league, limit: 6 },
        refreshMs: 300000,
        maxAgeMs: 120000
      }, (snapshot) => {
        if (!snapshot.data?.posts) return;
        wcState.posts = snapshot.data.posts;
        wcRenderAll();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.currentTab = WC_CONTEXT.sport;
    window.currentLeagueFilter = WC_CONTEXT.league;

    document.querySelectorAll(".copyright-year").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    wcRenderAll();
    wcSubscribe();
  });
})();
