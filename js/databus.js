/**
 * LivescoreFree DataBus - Centralized Reactive Data Hub
 * Manages auto-refresh subscriptions for every page section.
 * Loaded after script.js to extend the existing architecture.
 */
(function () {
  'use strict';

  const LSF = window.LSF_CONFIG || {};
  const REFRESH = LSF.refresh || {
    live: 8000, results: 60000, upcoming: 90000, standings: 300000,
    teams: 300000, players: 600000, news: 600000, blog: 600000,
    ticker: 15000, sidebar: 20000, hero: 60000
  };
  const API_LIVE = LSF.api?.live || '/api/live';
  const API_RESULTS = LSF.api?.results || '/api/results';
  const API_UPCOMING = LSF.api?.upcoming || '/api/upcoming';
  const API_STANDINGS = LSF.api?.standings || '/api/standings';
  const API_TEAMS = LSF.api?.teams || '/api/teams';
  const API_PLAYERS = LSF.api?.players || '/api/players';
  const API_NEWS = LSF.api?.news || '/api/news';
  const API_BLOG = LSF.api?.blog || '/api/blog';
  const API_INFO = LSF.api?.info || '/api/info';
  const FALLBACK_LOGO = '/icons/icon-192.png';
  const FALLBACK_HERO_IMAGE = '/icons/hero-fallback.svg';

  // Helpers from script.js (safe references)
  const _buildApiUrl = typeof buildApiUrl === 'function' ? buildApiUrl : function (path, params) {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(function (kv) {
      if (kv[1] !== undefined && kv[1] !== null && kv[1] !== '') q.set(kv[0], kv[1]);
    });
    var s = q.toString();
    return s ? path + '?' + s : path;
  };
  const _filterRenderableMatches = typeof filterRenderableMatches === 'function' ? filterRenderableMatches : function (m) { return m; };
  const _sortMatchesForDisplay = typeof sortMatchesForDisplay === 'function' ? sortMatchesForDisplay : function (m) { return m; };
  const _escapeHtml = typeof escapeHtml === 'function' ? escapeHtml : function (v) { return String(v || ''); };
  const _getSafeImageUrl = typeof getSafeImageUrl === 'function' ? getSafeImageUrl : function (u, f) { return u || f; };
  const _buildTeamProfileUrl = typeof buildTeamProfileUrl === 'function' ? buildTeamProfileUrl : function () { return '#'; };
  const _buildPlayerProfileUrl = typeof buildPlayerProfileUrl === 'function' ? buildPlayerProfileUrl : function () { return '#'; };
  const _buildBlogArticleUrl = typeof buildBlogArticleUrl === 'function' ? buildBlogArticleUrl : function () { return '#'; };
  const _getArticleImageUrl = typeof getArticleImageUrl === 'function' ? getArticleImageUrl : function (a) { return a?.image || FALLBACK_HERO_IMAGE; };

  // =========================================================================
  // DataBus CLASS
  // =========================================================================
  class LSFDataBus {
    constructor() {
      this._subscriptions = new Map();
      this._timers = new Map();
      this._cache = new Map();
      this._listeners = new Map();
      this._inflightKeys = new Set();
    }

    _broadcast(channel, data) {
      this._cache.set(channel, { data: data, updatedAt: Date.now() });
      var listeners = this._listeners.get(channel);
      if (listeners) {
        listeners.forEach(function (fn) {
          try { fn(data, channel); } catch (e) { console.error('DataBus listener error:', e); }
        });
      }
    }

    on(channel, listener) {
      if (!this._listeners.has(channel)) this._listeners.set(channel, new Set());
      this._listeners.get(channel).add(listener);
      var cached = this._cache.get(channel);
      if (cached) { try { listener(cached.data, channel); } catch (e) { /* */ } }
      var self = this;
      return function () { var s = self._listeners.get(channel); if (s) s.delete(listener); };
    }

    _fetchAndBroadcast(channel, apiPath, params) {
      var cacheKey = channel + ':' + apiPath + ':' + JSON.stringify(params || {});
      if (this._inflightKeys.has(cacheKey)) return Promise.resolve();
      this._inflightKeys.add(cacheKey);
      var self = this;
      return fetch(_buildApiUrl(apiPath, params), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) { self._broadcast(channel, data); })
        .catch(function () { /* silent */ })
        .finally(function () { self._inflightKeys.delete(cacheKey); });
    }

    subscribe(channel, apiPath, params, intervalMs) {
      var timerKey = channel + ':' + apiPath;
      if (this._timers.has(timerKey)) return;
      this._fetchAndBroadcast(channel, apiPath, params);
      var self = this;
      var timer = setInterval(function () {
        if (document.hidden) return;
        self._fetchAndBroadcast(channel, apiPath, params);
      }, intervalMs || 60000);
      this._timers.set(timerKey, timer);
      this._subscriptions.set(timerKey, { channel: channel, apiPath: apiPath, params: params, intervalMs: intervalMs });
    }

    unsubscribe(channel, apiPath) {
      var timerKey = channel + ':' + apiPath;
      var timer = this._timers.get(timerKey);
      if (timer) clearInterval(timer);
      this._timers.delete(timerKey);
      this._subscriptions.delete(timerKey);
    }

    refresh(channel, apiPath, params) {
      this._fetchAndBroadcast(channel, apiPath, params);
    }

    wsSubscribeChannels(channels) {
      if (typeof realtime === 'undefined' || !realtime.isConnected) return;
      (channels || []).forEach(function (ch) {
        realtime.subscribe(ch.target || ch.type, {
          sport: ch.sport || (typeof currentTab !== 'undefined' ? currentTab : 'all'),
          league: ch.league || (typeof currentLeagueFilter !== 'undefined' ? currentLeagueFilter : ''),
          days: ch.days, id: ch.id, limit: ch.limit
        });
      });
    }
  }

  window._lsfDataBus = window._lsfDataBus || new LSFDataBus();
  var dataBus = window._lsfDataBus;

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================
  function renderStandingsTable(container, entries, sport, league) {
    if (!container || !entries || !entries.length) return;
    var findStat = function (entry, names) {
      var stats = Array.isArray(entry.stats) ? entry.stats : [];
      var found = stats.find(function (s) { return names.indexOf(String(s && s.name || '').toLowerCase()) >= 0; });
      return found && found.displayValue ? found.displayValue : '-';
    };
    var isSoccer = sport === 'soccer' || /eng|esp|ger|ita|fra|uefa/.test(league || '');
    var isCricket = sport === 'cricket';

    var headerCols;
    if (isCricket) {
      headerCols = '<th class="px-2 py-2 text-center">Mat</th><th class="px-2 py-2 text-center">W</th><th class="px-2 py-2 text-center">L</th><th class="px-2 py-2 text-center">NRR</th><th class="px-2 py-2 text-center">Pts</th>';
    } else if (isSoccer) {
      headerCols = '<th class="px-2 py-2 text-center">MP</th><th class="px-2 py-2 text-center">W</th><th class="px-2 py-2 text-center">D</th><th class="px-2 py-2 text-center">L</th><th class="px-2 py-2 text-center">GD</th><th class="px-2 py-2 text-center">Pts</th>';
    } else {
      headerCols = '<th class="px-2 py-2 text-center">GP</th><th class="px-2 py-2 text-center">W</th><th class="px-2 py-2 text-center">L</th><th class="px-2 py-2 text-center">Pts</th>';
    }

    var rows = entries.slice(0, 20).map(function (entry, idx) {
      var team = entry.team || {};
      var logo = (team.logos && team.logos[0] && team.logos[0].href) || team.logo || FALLBACK_LOGO;
      var name = team.displayName || team.name || team.shortDisplayName || 'Team';
      var profileUrl = _buildTeamProfileUrl({ id: team.id, name: name, logo: logo }, sport || '', league || '');
      var sc;
      if (isCricket) {
        sc = '<td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['matchesplayed', 'gamesplayed']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['matcheswon', 'wins']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['matcheslost', 'losses']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['netrr', 'netrunrate']) + '</td><td class="px-2 py-2 text-center font-black text-primary">' + findStat(entry, ['matchpoints', 'points']) + '</td>';
      } else if (isSoccer) {
        sc = '<td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['gamesplayed']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['wins']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['ties', 'draws']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['losses']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['pointdifferential', 'goaldifference']) + '</td><td class="px-2 py-2 text-center font-black text-primary">' + findStat(entry, ['points']) + '</td>';
      } else {
        sc = '<td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['gamesplayed']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['wins']) + '</td><td class="px-2 py-2 text-center text-on-surface/60">' + findStat(entry, ['losses']) + '</td><td class="px-2 py-2 text-center font-black text-primary">' + findStat(entry, ['points', 'winpercent']) + '</td>';
      }
      return '<tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors"><td class="px-3 py-2 text-center text-on-surface/40 text-xs font-black">' + (idx + 1) + '</td><td class="px-3 py-2"><a href="' + profileUrl + '" class="flex items-center gap-3 group"><img src="' + _getSafeImageUrl(logo, FALLBACK_LOGO) + '" class="w-6 h-6 object-contain" onerror="this.src=\'' + FALLBACK_LOGO + '\'"><span class="text-xs font-black uppercase tracking-wider group-hover:text-primary transition-colors truncate">' + _escapeHtml(name) + '</span></a></td>' + sc + '</tr>';
    }).join('');

    container.innerHTML = '<div class="overflow-x-auto"><table class="w-full text-[11px]"><thead><tr class="border-b border-white/10 text-on-surface/40 font-black uppercase tracking-widest text-[9px]"><th class="px-3 py-2 text-center">#</th><th class="px-3 py-2 text-left">Team</th>' + headerCols + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function slugifyLabel(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32); }

  function renderMultiLeagueStandings(container, leagues) {
    if (!container || !leagues || !leagues.length) return;
    var valid = leagues.filter(function (l) { return l.entries && l.entries.length > 0; }).slice(0, 6);
    container.innerHTML = valid.map(function (ld) {
      var label = ld.league || ld.sport || 'League';
      return '<div class="mb-8"><div class="flex items-center gap-2 mb-4"><span class="w-2 h-2 rounded-full bg-primary"></span><h3 class="text-xs font-black uppercase tracking-[0.2em] text-on-surface/60">' + _escapeHtml(String(label).toUpperCase()) + '</h3></div><div id="standings-sub-' + slugifyLabel(label) + '"></div></div>';
    }).join('');
    valid.forEach(function (ld) {
      var sub = document.getElementById('standings-sub-' + slugifyLabel(ld.league || ld.sport || 'League'));
      if (sub) renderStandingsTable(sub, ld.entries, ld.sport || 'soccer', ld.league || '');
    });
  }

  function renderTeamsGrid(container, teams) {
    if (!container || !teams || !teams.length) return;
    container.innerHTML = teams.slice(0, 30).map(function (team) {
      var logo = team.logo || (team.logos && team.logos[0] && team.logos[0].href) || FALLBACK_LOGO;
      var profileUrl = _buildTeamProfileUrl(team, team.sport || '', team.league || '');
      return '<a href="' + profileUrl + '" class="bg-surface-container border border-white/5 hover:border-primary/30 rounded-xl p-4 flex flex-col items-center gap-3 transition-all group"><div class="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><img src="' + _getSafeImageUrl(logo, FALLBACK_LOGO) + '" class="w-10 h-10 object-contain" onerror="this.src=\'' + FALLBACK_LOGO + '\'"></div><span class="text-[10px] font-black uppercase tracking-widest text-center truncate w-full group-hover:text-primary transition-colors">' + _escapeHtml(team.name || team.displayName || 'Team') + '</span>' + (team.record ? '<span class="text-[8px] text-on-surface/40 font-bold">' + _escapeHtml(team.record) + '</span>' : '') + '</a>';
    }).join('');
  }

  function renderPlayersGrid(container, athletes) {
    if (!container || !athletes || !athletes.length) return;
    container.innerHTML = athletes.slice(0, 24).map(function (player) {
      var headshot = (player.headshot && player.headshot.href) || player.headshot || FALLBACK_LOGO;
      var profileUrl = _buildPlayerProfileUrl(player, player.sport || '', player.league || '');
      var teamLogo = (player.team && player.team.logo) || FALLBACK_LOGO;
      return '<a href="' + profileUrl + '" class="bg-surface-container border border-white/5 hover:border-primary/30 rounded-xl p-4 flex items-center gap-4 transition-all group"><div class="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"><img src="' + _getSafeImageUrl(headshot, FALLBACK_LOGO) + '" class="w-full h-full object-cover" onerror="this.src=\'' + FALLBACK_LOGO + '\'"></div><div class="flex-1 min-w-0"><div class="text-xs font-black uppercase tracking-wider truncate group-hover:text-primary transition-colors">' + _escapeHtml(player.fullName || player.shortName || 'Player') + '</div><div class="flex items-center gap-2 mt-1"><img src="' + _getSafeImageUrl(teamLogo, FALLBACK_LOGO) + '" class="w-4 h-4 object-contain" onerror="this.src=\'' + FALLBACK_LOGO + '\'"><span class="text-[9px] text-on-surface/40 font-bold truncate">' + _escapeHtml((player.team && player.team.name) || '') + (player.position && player.position.displayName ? ' - ' + _escapeHtml(player.position.displayName) : '') + '</span></div></div></a>';
    }).join('');
  }

  function renderRelatedBlogPosts(container, posts) {
    if (!container || !posts || !posts.length) return;
    var params = new URLSearchParams(window.location.search);
    var currentSlug = params.get('slug') || '';
    var filtered = posts.filter(function (p) { return p.slug !== currentSlug; }).slice(0, 4);
    if (!filtered.length) return;
    container.innerHTML = filtered.map(function (post) {
      return '<a href="' + _buildBlogArticleUrl(post) + '" class="block bg-surface-container border border-white/5 hover:border-primary/30 rounded-xl overflow-hidden transition-all group"><img src="' + _getArticleImageUrl(post) + '" class="w-full h-32 object-cover" onerror="this.src=\'' + FALLBACK_HERO_IMAGE + '\'"><div class="p-4"><div class="text-[9px] font-black uppercase tracking-widest text-primary mb-2">' + _escapeHtml(post.vertical || post.sportLabel || 'Fan Brief') + '</div><h4 class="text-xs font-black uppercase tracking-wider leading-relaxed group-hover:text-primary transition-colors line-clamp-2">' + _escapeHtml(post.title || post.headline || 'Article') + '</h4></div></a>';
    }).join('');
  }

  // Make renderers globally available
  window.renderStandingsTable = renderStandingsTable;
  window.renderMultiLeagueStandings = renderMultiLeagueStandings;
  window.renderTeamsGrid = renderTeamsGrid;
  window.renderPlayersGrid = renderPlayersGrid;
  window.renderRelatedBlogPosts = renderRelatedBlogPosts;

  // =========================================================================
  // PAGE-LEVEL AUTO-REFRESH WIRING
  // =========================================================================
  function initPageDataBus() {
    var path = window.location.pathname;
    var fileName = (path.split('/').pop() || 'index.html').replace('.html', '') || 'index';
    var sport = typeof currentTab !== 'undefined' ? currentTab : 'all';
    var league = typeof currentLeagueFilter !== 'undefined' ? currentLeagueFilter : '';

    // --- RESULTS PAGE ---
    if (fileName === 'results') {
      dataBus.subscribe('results', API_RESULTS, { sport: sport, league: league || undefined, days: 7 }, REFRESH.results);
      dataBus.on('results', function (data) {
        if (!data || !data.matches) return;
        var finished = _filterRenderableMatches(data.matches).filter(function (m) { return m.status === 'finished'; });
        window._cachedResults = finished;
        if (typeof renderMatches === 'function' && typeof currentPageFilter !== 'undefined' && currentPageFilter === 'finished') {
          renderMatches(_sortMatchesForDisplay(finished, 'finished'));
        }
        if (typeof updateResultsSectionMeta === 'function') updateResultsSectionMeta(finished);
      });
      if (typeof realtime !== 'undefined' && realtime.isConnected) {
        realtime.subscribe('results', { sport: sport, league: league, days: 7 });
      }
    }

    // --- UPCOMING PAGE ---
    if (fileName === 'upcoming' || fileName === 'upcoming_match_detail') {
      dataBus.subscribe('upcoming', API_UPCOMING, { sport: sport, league: league || undefined, days: 7 }, REFRESH.upcoming);
      dataBus.on('upcoming', function (data) {
        if (!data || !data.matches) return;
        var upcoming = _filterRenderableMatches(data.matches).filter(function (m) { return m.status === 'upcoming'; });
        window._cachedUpcoming = upcoming;
        window._cachedUpcomingMatches = upcoming;
        if (typeof renderArenaSchedule === 'function' && document.getElementById('arena-schedule-container')) {
          renderArenaSchedule(upcoming.slice(0, 12));
        }
      });
      if (typeof realtime !== 'undefined' && realtime.isConnected) {
        realtime.subscribe('upcoming', { sport: sport, league: league, days: 7 });
      }
    }

    // --- STANDINGS PAGE ---
    if (fileName === 'standings') {
      dataBus.subscribe('standings', API_STANDINGS, { sport: sport, league: league || undefined }, REFRESH.standings);
      dataBus.on('standings', function (data) {
        var container = document.getElementById('standings-container') || document.getElementById('standings-table-container') || document.getElementById('standings-content');
        if (!container) return;
        if (data && data.entries && data.entries.length > 0) renderStandingsTable(container, data.entries, sport, league);
        else if (data && data.leagues && data.leagues.length > 0) renderMultiLeagueStandings(container, data.leagues);
      });
    }

    // --- TEAMS PAGE ---
    if (fileName === 'teams') {
      dataBus.subscribe('teams', API_TEAMS, { sport: sport, league: league || undefined }, REFRESH.teams);
      dataBus.on('teams', function (data) {
        var container = document.getElementById('teams-grid') || document.getElementById('teams-container');
        if (!container || !data || !data.teams) return;
        renderTeamsGrid(container, data.teams);
      });
    }

    // --- TEAM PROFILE PAGE ---
    if (fileName === 'team') {
      var params = new URLSearchParams(window.location.search);
      var teamId = params.get('id') || '';
      var teamName = params.get('name') || '';
      if (teamId || teamName) {
        dataBus.subscribe('team-profile', API_INFO, {
          type: 'team', sport: sport, league: league || undefined, id: teamId, name: teamName
        }, 120000);
        dataBus.on('team-profile', function (data) {
          if (typeof renderTeamProfile === 'function' && data && data.team) renderTeamProfile(data);
        });
      }
    }

    // --- PLAYER PROFILE PAGE ---
    if (fileName === 'player') {
      var params2 = new URLSearchParams(window.location.search);
      var playerId = params2.get('id') || '';
      if (playerId) {
        dataBus.subscribe('player-profile', API_INFO, {
          type: 'player', sport: sport, league: league || undefined, id: playerId
        }, 120000);
        dataBus.on('player-profile', function (data) {
          if (typeof renderPlayerProfile === 'function' && data && data.athlete) renderPlayerProfile(data);
        });
      }
    }

    // --- PLAYERS DIRECTORY PAGE ---
    if (fileName === 'players') {
      dataBus.subscribe('players', API_PLAYERS, { sport: sport, league: league || undefined, limit: 24 }, REFRESH.players);
      dataBus.on('players', function (data) {
        var container = document.getElementById('players-grid') || document.getElementById('players-container');
        if (!container || !data || !data.athletes) return;
        renderPlayersGrid(container, data.athletes);
      });
    }

    // --- NEWS PAGE ---
    if (fileName === 'news') {
      dataBus.subscribe('news-feed', API_NEWS, { sport: sport, league: league || undefined, limit: 20 }, REFRESH.news);
      dataBus.on('news-feed', function (data) {
        if (data && data.articles) window._cachedNews = data.articles;
      });
    }

    // --- BLOG HUB ---
    if (fileName === 'blog_hub' || fileName === 'blog') {
      dataBus.subscribe('blog-feed', API_BLOG, { sport: sport, league: league || undefined, limit: 16 }, REFRESH.blog);
      dataBus.on('blog-feed', function (data) {
        window._cachedBlogPosts = (data && data.posts) || [];
      });
    }

    // --- BLOG ARTICLE ---
    if (fileName === 'blog_article') {
      dataBus.subscribe('blog-related', API_BLOG, { sport: sport, league: league || undefined, limit: 8 }, REFRESH.blog);
      dataBus.on('blog-related', function (data) {
        var container = document.getElementById('related-articles') || document.getElementById('related-posts');
        if (!container || !data || !data.posts) return;
        renderRelatedBlogPosts(container, data.posts);
      });
    }

    // --- LEAGUES PAGE ---
    if (fileName === 'leagues') {
      dataBus.subscribe('leagues-standings', API_STANDINGS, { sport: 'all' }, REFRESH.standings);
      dataBus.on('leagues-standings', function (data) {
        var container = document.getElementById('league-standings-container') || document.getElementById('standings-table-container');
        if (!container) return;
        if (data && data.leagues && data.leagues.length > 0) renderMultiLeagueStandings(container, data.leagues);
        else if (data && data.entries && data.entries.length > 0) renderStandingsTable(container, data.entries, 'all', '');
      });
      dataBus.subscribe('leagues-teams', API_TEAMS, { sport: 'all' }, REFRESH.teams);
    }

    // --- SPORT HUB PAGE ---
    if (fileName === 'sport') {
      var sparams = new URLSearchParams(window.location.search);
      var hubSport = sparams.get('s') || sparams.get('sport') || 'soccer';
      var hubLeague = sparams.get('l') || sparams.get('league') || '';

      dataBus.subscribe('sport-live', API_LIVE, { sport: hubSport, league: hubLeague || undefined }, REFRESH.live || 10000);
      dataBus.subscribe('sport-standings', API_STANDINGS, { sport: hubSport, league: hubLeague || undefined }, 120000);
      dataBus.subscribe('sport-teams', API_TEAMS, { sport: hubSport, league: hubLeague || undefined }, REFRESH.teams);
      dataBus.subscribe('sport-news', API_NEWS, { sport: hubSport, league: hubLeague || undefined, limit: 10 }, REFRESH.news);

      dataBus.on('sport-standings', function (data) {
        var container = document.getElementById('sport-standings-container') || document.getElementById('standings-container');
        if (!container) return;
        if (data && data.entries && data.entries.length > 0) renderStandingsTable(container, data.entries, hubSport, hubLeague);
        else if (data && data.leagues && data.leagues.length > 0) renderMultiLeagueStandings(container, data.leagues);
      });

      dataBus.on('sport-teams', function (data) {
        var container = document.getElementById('sport-teams-container') || document.getElementById('teams-grid');
        if (!container || !data || !data.teams) return;
        renderTeamsGrid(container, data.teams);
      });
    }

    // --- TRENDING PAGE ---
    if (fileName === 'trending') {
      dataBus.subscribe('trending-results', API_RESULTS, { sport: sport, days: 3 }, 30000);
      dataBus.on('trending-results', function (data) {
        if (data && data.matches) window._cachedResults = _filterRenderableMatches(data.matches).filter(function (m) { return m.status === 'finished'; });
      });
      dataBus.subscribe('trending-upcoming', API_UPCOMING, { sport: sport, days: 3 }, 60000);
      dataBus.on('trending-upcoming', function (data) {
        if (data && data.matches) {
          window._cachedUpcoming = _filterRenderableMatches(data.matches).filter(function (m) { return m.status === 'upcoming'; });
          window._cachedUpcomingMatches = window._cachedUpcoming;
        }
      });
    }

    // --- INDEX (HOME) PAGE ---
    if (fileName === 'index' || fileName === '') {
      dataBus.subscribe('home-results', API_RESULTS, { sport: sport, days: 3 }, REFRESH.results);
      dataBus.on('home-results', function (data) {
        if (data && data.matches) window._cachedResults = _filterRenderableMatches(data.matches).filter(function (m) { return m.status === 'finished'; });
      });
      dataBus.subscribe('home-upcoming', API_UPCOMING, { sport: sport, days: 4 }, REFRESH.upcoming);
      dataBus.on('home-upcoming', function (data) {
        if (data && data.matches) {
          window._cachedUpcoming = _filterRenderableMatches(data.matches).filter(function (m) { return m.status === 'upcoming'; });
          window._cachedUpcomingMatches = window._cachedUpcoming;
        }
      });
      dataBus.subscribe('home-news', API_BLOG, { sport: sport, limit: 10 }, REFRESH.news);
      dataBus.on('home-news', function (data) {
        var posts = (data && data.posts) || (data && data.trending) || [];
        if (posts.length) window._cachedNews = posts;
      });
    }

    // --- LIVE PAGE ---
    if (fileName === 'live') {
      dataBus.subscribe('live-standings', API_STANDINGS, { sport: sport, league: league || undefined }, REFRESH.standings);
      dataBus.on('live-standings', function (data) {
        var container = document.getElementById('live-standings-sidebar') || document.getElementById('standings-container');
        if (!container) return;
        if (data && data.entries && data.entries.length > 0) renderStandingsTable(container, data.entries, sport, league);
        else if (data && data.leagues && data.leagues.length > 0) renderMultiLeagueStandings(container, data.leagues);
      });
    }

    // --- WebSocket multi-channel subscriptions ---
    var wsChannels = [];
    if (['index', '', 'live', 'results', 'upcoming', 'trending', 'sport'].indexOf(fileName) >= 0) {
      wsChannels.push({ target: 'live', sport: sport, league: league });
    }
    if (['results', 'index', '', 'trending'].indexOf(fileName) >= 0) {
      wsChannels.push({ target: 'results', sport: sport, league: league, days: 7 });
    }
    if (['upcoming', 'index', '', 'trending'].indexOf(fileName) >= 0) {
      wsChannels.push({ target: 'upcoming', sport: sport, league: league, days: 7 });
    }
    if (wsChannels.length > 0) dataBus.wsSubscribeChannels(wsChannels);

    // --- Visibility change: refresh when tab becomes visible ---
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      dataBus._subscriptions.forEach(function (sub) {
        dataBus._fetchAndBroadcast(sub.channel, sub.apiPath, sub.params);
      });
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageDataBus);
  } else {
    setTimeout(initPageDataBus, 0);
  }
})();
