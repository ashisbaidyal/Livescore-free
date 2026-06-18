(() => {
  const IPL_CONTEXT = { sport: "cricket", league: "ipl" };
  const IPL_API = window.LSF_CONFIG?.api || {};
  const IPL_FALLBACK = "/icons/icon-192.png";
  const iplState = {
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

  function iplEscape(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function iplNormalizeMatches(items) {
    const list = Array.isArray(items) ? items : [];
    return typeof filterRenderableMatches === "function" ? filterRenderableMatches(list) : list;
  }

  function iplGetStat(entry, names) {
    const stats = Array.isArray(entry?.stats) ? entry.stats : [];
    const stat = stats.find((item) => names.includes(String(item?.name || "").toLowerCase()));
    return stat ? (stat.displayValue || stat.value || "-") : "-";
  }

  function iplFormatDate(value, options = {}) {
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

  function iplSortMatches(left, right) {
    const order = { live: 0, upcoming: 1, finished: 2 };
    const statusDiff = (order[left?.status] ?? 9) - (order[right?.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(left?.date || 0) - new Date(right?.date || 0);
  }

  function iplCombineMatches() {
    const seen = new Map();
    [...iplState.live, ...iplState.upcoming, ...iplState.results].forEach((match) => {
      if (!match?.id) return;
      if (!seen.has(match.id)) {
        seen.set(match.id, match);
      }
    });
    return Array.from(seen.values()).sort(iplSortMatches);
  }

  function iplRenderSidebarLive() {
    const container = document.getElementById("ipl-sidebar-live-container");
    if (!container) return;

    if (!iplState.live.length) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-8 text-center text-[10px] font-black uppercase tracking-[0.25em] text-on-surface/35">
          No live IPL games right now
        </div>
      `;
      return;
    }

    container.innerHTML = iplState.live.slice(0, 4).map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-primary/40 hover:bg-white/10 transition-all">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-[9px] font-black uppercase tracking-[0.22em] text-primary">Live</span>
          <span class="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface/40">${iplEscape(match.time || match.status)}</span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <span class="truncate text-[10px] font-black uppercase">${iplEscape(match.homeTeam?.name || "Home")}</span>
            <span class="text-sm font-black italic text-primary">${iplEscape(match.homeTeam?.score || "0")}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="truncate text-[10px] font-black uppercase">${iplEscape(match.awayTeam?.name || "Away")}</span>
            <span class="text-sm font-black italic text-primary">${iplEscape(match.awayTeam?.score || "0")}</span>
          </div>
        </div>
      </a>
    `).join("");
  }

  function iplRenderTicker() {
    const track = document.getElementById("ipl-ticker-track");
    if (!track) return;
    const items = iplCombineMatches().slice(0, 10);
    if (!items.length) {
      track.classList.remove("ticker-scroll");
      track.innerHTML = `
        <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/50">
          <span class="material-symbols-outlined text-primary text-sm">radio_button_checked</span>
          IPL board loading
        </div>
      `;
      return;
    }

    const doubled = items.concat(items);
    track.classList.add("ticker-scroll");
    track.innerHTML = doubled.map((match) => `
      <a href="${buildMatchUrl(match)}" class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] hover:border-primary/40 hover:bg-white/10 transition-colors">
        <span class="text-on-surface/40">${iplEscape(match.league || "IPL")}</span>
        <span>${iplEscape(match.homeTeam?.abbreviation || match.homeTeam?.name || "HOME")} ${iplEscape(match.homeTeam?.score || "0")} - ${iplEscape(match.awayTeam?.score || "0")} ${iplEscape(match.awayTeam?.abbreviation || match.awayTeam?.name || "AWAY")}</span>
        <span class="${match.status === "live" ? "text-primary" : "text-on-surface/40"}">${iplEscape(match.time || match.status)}</span>
      </a>
    `).join("");
  }

  function iplPickFeaturedMatch() {
    return iplState.live[0] || iplState.upcoming[0] || iplState.results[0] || null;
  }

  function iplRosterCount() {
    return Array.from(iplState.rosters.values()).reduce((sum, roster) => sum + (Array.isArray(roster) ? roster.length : 0), 0);
  }

  function iplRenderHero() {
    const featured = iplPickFeaturedMatch();
    const backdrop = document.getElementById("ipl-hero-backdrop");
    const badge = document.getElementById("ipl-featured-badge");
    const league = document.getElementById("ipl-featured-league");
    const homeLogo = document.getElementById("ipl-featured-home-logo");
    const awayLogo = document.getElementById("ipl-featured-away-logo");
    const homeName = document.getElementById("ipl-featured-home-name");
    const awayName = document.getElementById("ipl-featured-away-name");
    const score = document.getElementById("ipl-featured-score");
    const time = document.getElementById("ipl-featured-time");
    const meta = document.getElementById("ipl-featured-meta");
    const link = document.getElementById("ipl-featured-link");

    document.getElementById("ipl-stat-live").textContent = String(iplState.live.length || 0);
    document.getElementById("ipl-stat-upcoming").textContent = String(iplState.upcoming.length || 0);
    document.getElementById("ipl-stat-teams").textContent = String(iplState.teams.length || 10);
    document.getElementById("ipl-stat-players").textContent = String(iplRosterCount() || iplState.players.length || 0);

    if (!featured) {
      if (backdrop) backdrop.innerHTML = "";
      if (badge) badge.textContent = "Awaiting feed";
      if (league) league.textContent = "IPL board loading";
      if (homeName) homeName.textContent = "Home";
      if (awayName) awayName.textContent = "Away";
      if (homeLogo) homeLogo.alt = "Featured IPL home team logo";
      if (awayLogo) awayLogo.alt = "Featured IPL away team logo";
      if (score) score.textContent = "0-0";
      if (time) time.textContent = "Loading";
      if (meta) meta.textContent = "Watching for live or upcoming IPL matches";
      if (link) link.href = "/upcoming?s=cricket&l=ipl";
      return;
    }

    const statusLabel = featured.status === "live" ? "Live now" : (featured.status === "finished" ? "Final" : "Scheduled");
    if (badge) badge.textContent = statusLabel.toUpperCase();
    if (league) league.textContent = featured.league || "Indian Premier League";
    if (homeLogo) {
      homeLogo.src = featured.homeTeam?.logo || IPL_FALLBACK;
      homeLogo.alt = `${featured.homeTeam?.name || "Home team"} logo`;
    }
    if (awayLogo) {
      awayLogo.src = featured.awayTeam?.logo || IPL_FALLBACK;
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
        ? iplFormatDate(featured.date, { time: true, weekday: true })
        : (featured.time || statusLabel);
    }
    if (meta) {
      meta.textContent = featured.status === "upcoming"
        ? `${featured.venue || "Venue TBA"} | ${featured.broadcast || featured.league || "IPL"}`
        : `${featured.homeTeam?.name || "Home"} vs ${featured.awayTeam?.name || "Away"} | ${featured.broadcast || featured.league || "IPL"}`;
    }
    if (link) {
      link.href = buildMatchUrl(featured);
      link.textContent = featured.status === "upcoming" ? "Open Fixture Centre" : "Open Match Centre";
    }
    if (backdrop) {
      const home = featured.homeTeam?.logo || IPL_FALLBACK;
      const away = featured.awayTeam?.logo || IPL_FALLBACK;
      backdrop.innerHTML = `
        <div class="absolute inset-y-0 left-[-6%] w-[44%] opacity-[0.12] blur-[1px]" style="background:url('${home}') center/contain no-repeat;"></div>
        <div class="absolute inset-y-0 right-[-6%] w-[44%] opacity-[0.12] blur-[1px]" style="background:url('${away}') center/contain no-repeat;"></div>
      `;
    }
  }

  function iplRenderLiveGrid() {
    const container = document.getElementById("ipl-live-grid");
    if (!container) return;
    const matches = iplState.live.length ? iplState.live : iplState.upcoming.slice(0, 4);

    if (!matches.length) {
      container.innerHTML = `
        <div class="lg:col-span-2 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No live or upcoming IPL matches available
        </div>
      `;
      return;
    }

    container.innerHTML = matches.slice(0, 6).map((match) => {
      const upcoming = match.status === "upcoming";
      const live = match.status === "live";
      const badge = live ? "Live" : (upcoming ? "Upcoming" : "Final");
      const score = upcoming
        ? iplFormatDate(match.date, { time: true, weekday: true })
        : `${match.homeTeam?.score || "0"} - ${match.awayTeam?.score || "0"}`;

      return `
        <a href="${buildMatchUrl(match)}" class="block group">
          <article class="rounded-3xl border border-white/5 bg-surface-container-high p-6 h-full hover:border-primary/40 hover:-translate-y-1 transition-all">
            <div class="flex items-center justify-between gap-4 mb-5">
              <span class="text-[10px] font-black uppercase tracking-[0.26em] text-on-surface/40">${iplEscape(match.league || "IPL")}</span>
              <span class="rounded-full border ${live ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-on-surface/45"} px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em]">${badge}</span>
            </div>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
              <div class="text-center">
                <img src="${iplEscape(match.homeTeam?.logo || IPL_FALLBACK)}" alt="" class="w-14 h-14 object-contain mx-auto mb-3" onerror="this.src='${IPL_FALLBACK}'"/>
                <div class="text-sm font-black italic uppercase tracking-tight line-clamp-2">${iplEscape(match.homeTeam?.name || "Home")}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-black italic ${live ? "text-primary" : "text-on-surface"}">${score}</div>
                <div class="text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40 mt-2">${iplEscape(match.time || match.status)}</div>
              </div>
              <div class="text-center">
                <img src="${iplEscape(match.awayTeam?.logo || IPL_FALLBACK)}" alt="" class="w-14 h-14 object-contain mx-auto mb-3" onerror="this.src='${IPL_FALLBACK}'"/>
                <div class="text-sm font-black italic uppercase tracking-tight line-clamp-2">${iplEscape(match.awayTeam?.name || "Away")}</div>
              </div>
            </div>
            <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/45">${iplEscape(match.venue || match.broadcast || "Match centre available")}</div>
          </article>
        </a>
      `;
    }).join("");
  }

  function iplRenderSchedule() {
    const container = document.getElementById("ipl-schedule-grid");
    if (!container) return;
    if (!iplState.upcoming.length) {
      container.innerHTML = `
        <div class="rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No upcoming IPL fixtures available
        </div>
      `;
      return;
    }

    container.innerHTML = iplState.upcoming.slice(0, 14).map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-3xl border border-white/5 bg-surface-container-high p-5 hover:border-primary/40 hover:bg-surface-container transition-all">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div class="text-[10px] font-black uppercase tracking-[0.24em] text-primary mb-2">${iplFormatDate(match.date, { time: true, weekday: true })}</div>
            <h3 class="text-lg font-black italic uppercase tracking-tight">${iplEscape(match.homeTeam?.name || "Home")} vs ${iplEscape(match.awayTeam?.name || "Away")}</h3>
            <div class="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/40 mt-2">${iplEscape(match.venue || match.broadcast || "Venue TBA")}</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center"><img src="${iplEscape(match.homeTeam?.logo || IPL_FALLBACK)}" class="w-7 h-7 object-contain" alt="" onerror="this.src='${IPL_FALLBACK}'"/></div>
            <span class="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface/45">vs</span>
            <div class="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center"><img src="${iplEscape(match.awayTeam?.logo || IPL_FALLBACK)}" class="w-7 h-7 object-contain" alt="" onerror="this.src='${IPL_FALLBACK}'"/></div>
          </div>
        </div>
      </a>
    `).join("");
  }

  function iplRenderTeams() {
    const container = document.getElementById("ipl-teams-grid");
    if (!container) return;
    if (!iplState.teams.length) {
      container.innerHTML = `
        <div class="md:col-span-2 xl:col-span-3 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          Team list unavailable right now
        </div>
      `;
      return;
    }

    container.innerHTML = iplState.teams.map((team) => `
      <a href="${buildTeamProfileUrl(team, IPL_CONTEXT.sport, IPL_CONTEXT.league)}" class="block group rounded-3xl border border-white/5 bg-surface-container-high p-6 hover:border-primary/40 hover:-translate-y-1 transition-all">
        <div class="flex items-start justify-between gap-4 mb-6">
          <img src="${iplEscape(team.logo || IPL_FALLBACK)}" alt="" class="w-16 h-16 object-contain" onerror="this.src='${IPL_FALLBACK}'"/>
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-on-surface/40">${iplEscape(team.abbreviation || "IPL")}</span>
        </div>
        <h3 class="text-2xl font-black italic uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">${iplEscape(team.name || "Team")}</h3>
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/40 mb-4">${iplEscape(team.location || team.shortName || "India")}</div>
        <div class="grid gap-3 text-sm">
          <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40 mb-1">Record</div>
            <div class="font-bold">${iplEscape(team.record || "Season feed")}</div>
          </div>
          <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
            <div class="text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40 mb-1">Home Venue</div>
            <div class="font-bold">${iplEscape(team.venue || "Venue TBA")}</div>
          </div>
        </div>
      </a>
    `).join("");
  }

  function iplRenderPointsTable() {
    const container = document.getElementById("ipl-points-table");
    if (!container) return;
    if (!iplState.standings.length) {
      container.innerHTML = `
        <div class="rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No standings data available
        </div>
      `;
      return;
    }
    container.innerHTML = `
      <div class="overflow-hidden rounded-[1.75rem] border border-white/5 bg-white/5">
        <div class="grid grid-cols-[40px_minmax(0,1fr)_42px_42px_42px_48px_56px] gap-3 border-b border-white/5 px-4 py-4 text-[9px] font-black uppercase tracking-[0.24em] text-on-surface/35">
          <span>#</span>
          <span>Team</span>
          <span>P</span>
          <span>W</span>
          <span>L</span>
          <span>Pts</span>
          <span>NRR</span>
        </div>
        ${iplState.standings.slice(0, 10).map((entry, index) => {
          const team = entry?.team || {};
          const teamUrl = buildTeamProfileUrl({
            id: team.id,
            name: team.displayName || team.name,
            logo: team.logos?.[0]?.href,
            league: IPL_CONTEXT.league,
            sport: IPL_CONTEXT.sport
          }, IPL_CONTEXT.sport, IPL_CONTEXT.league);
          const rowRank = index + 1;
          return `
            <a href="${teamUrl}" class="lsf-standings-row grid grid-cols-[40px_minmax(0,1fr)_42px_42px_42px_48px_56px] gap-3 border-b border-white/5 px-4 py-4 text-[10px] font-black uppercase tracking-[0.18em] last:border-b-0 ${rowRank <= 3 ? 'lsf-standings-rank-top3' : ''}">
              <span class="text-on-surface/45">${iplEscape(entry?.stats?.find((stat) => stat.name === "rank")?.displayValue || entry?.stats?.find((stat) => stat.name === "rank")?.value || index + 1)}</span>
              <span class="min-w-0 flex items-center gap-3">
                <img src="${iplEscape(team.logos?.[0]?.href || IPL_FALLBACK)}" alt="" class="h-8 w-8 rounded-full bg-white/5 object-contain p-1" onerror="this.src='${IPL_FALLBACK}'"/>
                <span class="truncate text-on-surface">${iplEscape(team.shortDisplayName || team.displayName || team.name || "Team")}</span>
              </span>
              <span class="text-on-surface/60">${iplEscape(iplGetStat(entry, ["gamesplayed", "games_played"]))}</span>
              <span class="text-primary">${iplEscape(iplGetStat(entry, ["wins", "winsoverall"]))}</span>
              <span class="text-on-surface/60">${iplEscape(iplGetStat(entry, ["losses", "loss"]))}</span>
              <span class="text-on-surface">${iplEscape(iplGetStat(entry, ["points"]))}</span>
              <span class="text-on-surface/60">${iplEscape(iplGetStat(entry, ["netrunrate", "nrr"]))}</span>
            </a>
          `;
        }).join("")}
      </div>
    `;
  }

  function iplRenderPlayers() {
    const container = document.getElementById("ipl-player-spotlights");
    if (!container) return;
    if (!iplState.players.length) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-10 text-center text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/35">
          Player feed loading
        </div>
      `;
      return;
    }

    container.innerHTML = iplState.players.slice(0, 6).map((player) => `
      <a href="${buildPlayerProfileUrl(player, IPL_CONTEXT.sport, IPL_CONTEXT.league)}" class="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-4 hover:border-primary/40 hover:bg-white/10 transition-all">
        <img src="${iplEscape(player.headshot?.href || IPL_FALLBACK)}" alt="" class="h-14 w-14 rounded-2xl bg-surface object-cover" onerror="this.src='${IPL_FALLBACK}'"/>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-black italic uppercase tracking-tight">${iplEscape(player.fullName || player.shortName || "IPL Player")}</div>
          <div class="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-primary">${iplEscape(player.team?.name || player.team?.abbreviation || "Squad pool")}</div>
          <div class="mt-2 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">
            ${iplEscape(player.position?.displayName || player.position?.name || "Cricket")} ${player.jersey ? `| #${iplEscape(player.jersey)}` : ""}
          </div>
        </div>
      </a>
    `).join("");
  }

  function iplRenderRosters() {
    const container = document.getElementById("ipl-rosters-grid");
    if (!container) return;

    const rosterCards = iplState.teams
      .map((team) => ({
        team,
        roster: iplState.rosters.get(team.id) || []
      }))
      .filter((entry) => entry.roster.length > 0);

    if (!rosterCards.length) {
      const message = rosterLoading ? "Loading team squads" : "Team rosters will appear once the feed resolves";
      container.innerHTML = `
        <div class="xl:col-span-2 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          ${message}
        </div>
      `;
      return;
    }

    container.innerHTML = rosterCards.slice(0, 6).map(({ team, roster }) => `
      <article class="rounded-3xl border border-white/5 bg-surface-container-high overflow-hidden">
        <div class="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-5">
          <div class="flex items-center gap-4 min-w-0">
            <img src="${iplEscape(team.logo || IPL_FALLBACK)}" alt="" class="h-12 w-12 object-contain" onerror="this.src='${IPL_FALLBACK}'"/>
            <div class="min-w-0">
              <h3 class="truncate text-xl font-black italic uppercase tracking-tight">${iplEscape(team.name || "Team Squad")}</h3>
              <p class="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">${roster.length} listed players</p>
            </div>
          </div>
          <a href="${buildTeamProfileUrl(team, IPL_CONTEXT.sport, IPL_CONTEXT.league)}" class="text-[9px] font-black uppercase tracking-[0.22em] text-primary hover:underline">Open team</a>
        </div>
        <div class="grid gap-3 p-5 sm:grid-cols-2">
          ${roster.slice(0, 8).map((player) => `
            <a href="${buildPlayerProfileUrl(player, IPL_CONTEXT.sport, IPL_CONTEXT.league)}" class="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 hover:border-primary/30 transition-colors">
              <img src="${iplEscape(player.headshot?.href || IPL_FALLBACK)}" alt="" class="h-11 w-11 rounded-xl bg-surface object-cover" onerror="this.src='${IPL_FALLBACK}'"/>
              <div class="min-w-0">
                <div class="truncate text-sm font-black uppercase tracking-tight">${iplEscape(player.fullName || player.shortName || "Player")}</div>
                <div class="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">
                  ${iplEscape(player.position?.displayName || player.position?.name || "Squad")} ${player.jersey ? `| #${iplEscape(player.jersey)}` : ""}
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function iplRenderResults() {
    const container = document.getElementById("ipl-results-grid");
    if (!container) return;
    if (!iplState.results.length) {
      container.innerHTML = `
        <div class="md:col-span-2 rounded-3xl border border-white/5 bg-white/5 px-6 py-20 text-center text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/35">
          No recent IPL results available
        </div>
      `;
      return;
    }

    container.innerHTML = iplState.results.slice(0, 8).map((match) => `
      <a href="${buildMatchUrl(match)}" class="block rounded-3xl border border-white/5 bg-surface-container-high p-5 hover:border-primary/40 transition-all">
        <div class="flex items-center justify-between gap-4 mb-4">
          <span class="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/40">${iplEscape(iplFormatDate(match.date, { weekday: true }))}</span>
          <span class="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-primary">Final</span>
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div class="text-center">
            <img src="${iplEscape(match.homeTeam?.logo || IPL_FALLBACK)}" alt="" class="mx-auto mb-3 h-12 w-12 object-contain" onerror="this.src='${IPL_FALLBACK}'"/>
            <div class="text-sm font-black italic uppercase tracking-tight">${iplEscape(match.homeTeam?.name || "Home")}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-black italic text-primary">${iplEscape(match.homeTeam?.score || "0")} - ${iplEscape(match.awayTeam?.score || "0")}</div>
            <div class="mt-2 text-[9px] font-black uppercase tracking-[0.22em] text-on-surface/40">${iplEscape(match.time || "Final")}</div>
          </div>
          <div class="text-center">
            <img src="${iplEscape(match.awayTeam?.logo || IPL_FALLBACK)}" alt="" class="mx-auto mb-3 h-12 w-12 object-contain" onerror="this.src='${IPL_FALLBACK}'"/>
            <div class="text-sm font-black italic uppercase tracking-tight">${iplEscape(match.awayTeam?.name || "Away")}</div>
          </div>
        </div>
      </a>
    `).join("");
  }

  function iplRenderBlog() {
    const container = document.getElementById("ipl-blog-list");
    if (!container) return;
    if (!iplState.posts.length) {
      container.innerHTML = `
        <div class="rounded-2xl border border-white/5 bg-white/5 px-4 py-10 text-center text-[10px] font-black uppercase tracking-[0.24em] text-on-surface/35">
          IPL fan briefs loading
        </div>
      `;
      return;
    }

    container.innerHTML = iplState.posts.slice(0, 4).map((post) => `
      <a href="${buildBlogArticleUrl(post)}" class="block rounded-2xl border border-white/5 bg-white/5 p-4 hover:border-primary/40 hover:bg-white/10 transition-all">
        <div class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-primary">
          <img src="${iplEscape(getSourceFaviconUrl(post.source))}" alt="" class="h-4 w-4 rounded-full object-cover" onerror="this.src='${IPL_FALLBACK}'"/>
          <span>${iplEscape(post.source?.domain || post.source?.name || "Source")}</span>
        </div>
        <h3 class="mt-3 text-lg font-black italic uppercase tracking-tight leading-tight">${iplEscape(post.title || post.headline || "IPL fan brief")}</h3>
        <p class="mt-3 text-[11px] leading-relaxed text-on-surface/60 line-clamp-3">${iplEscape(post.excerpt || post.description || "")}</p>
      </a>
    `).join("");
  }

  function iplUpdateCaches() {
    const combined = iplCombineMatches();
    window.currentTab = IPL_CONTEXT.sport;
    window.currentLeagueFilter = IPL_CONTEXT.league;
    window._cachedMatches = combined;
    window._cachedLiveMatches = iplState.live.slice();
    window._cachedUpcoming = iplState.upcoming.slice();
    window._cachedUpcomingMatches = iplState.upcoming.slice();
    window._cachedResults = iplState.results.slice();
    window._cachedBlogPosts = iplState.posts.slice();

    const liveCountText = document.getElementById("live-count-text");
    if (liveCountText) {
      liveCountText.textContent = iplState.live.length
        ? `${iplState.live.length} IPL LIVE`
        : `${iplState.upcoming.length} IPL NEXT`;
    }

    if (typeof updatePageTitle === "function") {
      updatePageTitle(iplState.live);
    }
  }

  function iplRenderAll() {
    iplUpdateCaches();
    iplRenderHero();
    iplRenderSidebarLive();
    iplRenderTicker();
    iplRenderLiveGrid();
    iplRenderSchedule();
    iplRenderTeams();
    iplRenderRosters();
    iplRenderResults();
    iplRenderPointsTable();
    iplRenderPlayers();
    iplRenderBlog();
  }

  async function iplLoadRosters() {
    if (!IPL_API.info || rosterLoading || !iplState.teams.length) return;

    const nextTeams = iplState.teams.filter((team) => team?.id && !iplState.rosters.has(team.id));
    if (!nextTeams.length) return;

    rosterLoading = true;
    const token = ++rosterRequestToken;
    iplRenderRosters();

    try {
      const results = await Promise.all(nextTeams.map(async (team) => {
        try {
          const response = await fetch(buildApiUrl(IPL_API.info, {
            type: "team",
            sport: IPL_CONTEXT.sport,
            league: IPL_CONTEXT.league,
            id: team.id
          }));
          if (!response.ok) return { teamId: team.id, roster: [] };
          const payload = await response.json();
          return { teamId: team.id, roster: Array.isArray(payload.roster) ? payload.roster : [] };
        } catch (error) {
          return { teamId: team.id, roster: [] };
        }
      }));

      if (token !== rosterRequestToken) return;
      results.forEach(({ teamId, roster }) => {
        iplState.rosters.set(teamId, roster);
      });
    } finally {
      if (token === rosterRequestToken) {
        rosterLoading = false;
        iplRenderAll();
      }
    }
  }

  function iplSubscribe() {
    if (!window.LSFDataStore) return;

    window.LSFDataStore.subscribe({
      path: IPL_API.live,
      params: { sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league },
      refreshMs: 30000,
      maxAgeMs: 12000
    }, (snapshot) => {
      if (!snapshot.data?.matches) return;
      iplState.live = iplNormalizeMatches(snapshot.data.matches).filter((match) => match.status === "live");
      iplRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: IPL_API.upcoming,
      params: { sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league, days: 21 },
      refreshMs: 180000,
      maxAgeMs: 60000
    }, (snapshot) => {
      if (!snapshot.data?.matches) return;
      iplState.upcoming = iplNormalizeMatches(snapshot.data.matches).filter((match) => match.status === "upcoming").sort(iplSortMatches);
      iplRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: IPL_API.results,
      params: { sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league, days: 14 },
      refreshMs: 180000,
      maxAgeMs: 60000
    }, (snapshot) => {
      if (!snapshot.data?.matches) return;
      iplState.results = iplNormalizeMatches(snapshot.data.matches).filter((match) => match.status === "finished").sort((left, right) => new Date(right?.date || 0) - new Date(left?.date || 0));
      iplRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: IPL_API.info,
      params: { type: "standings", sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league },
      refreshMs: 300000,
      maxAgeMs: 120000
    }, (snapshot) => {
      if (!snapshot.data) return;
      iplState.standings = Array.isArray(snapshot.data.entries)
        ? snapshot.data.entries
        : (snapshot.data.standings?.[0]?.entries || snapshot.data.children?.[0]?.standings?.entries || []);
      iplRenderAll();
    });

    window.LSFDataStore.subscribe({
      path: IPL_API.info,
      params: { type: "teams", sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league },
      refreshMs: 300000,
      maxAgeMs: 120000
    }, (snapshot) => {
      if (!snapshot.data?.teams) return;
      iplState.teams = snapshot.data.teams.slice().sort((left, right) => String(left?.name || "").localeCompare(String(right?.name || "")));
      iplRenderAll();
      iplLoadRosters();
    });

    window.LSFDataStore.subscribe({
      path: IPL_API.info,
      params: { type: "players", sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league, limit: 24 },
      refreshMs: 300000,
      maxAgeMs: 120000
    }, (snapshot) => {
      if (!snapshot.data?.athletes) return;
      iplState.players = snapshot.data.athletes;
      iplRenderAll();
    });

    if (IPL_API.blog) {
      window.LSFDataStore.subscribe({
        path: IPL_API.blog,
        params: { sport: IPL_CONTEXT.sport, league: IPL_CONTEXT.league, limit: 6 },
        refreshMs: 300000,
        maxAgeMs: 120000
      }, (snapshot) => {
        if (!snapshot.data?.posts) return;
        iplState.posts = snapshot.data.posts;
        iplRenderAll();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.currentTab = IPL_CONTEXT.sport;
    window.currentLeagueFilter = IPL_CONTEXT.league;

    document.querySelectorAll(".copyright-year").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    iplRenderAll();
    iplSubscribe();
  });
})();
