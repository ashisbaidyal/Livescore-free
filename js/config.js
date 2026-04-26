/**
 * LivescoreFree Centralized API Configuration
 * Standardized relative paths for proxy endpoints.
 * All refresh intervals in milliseconds.
 */
window.LSF_CONFIG = {
    api: {
        live: '/api/live',
        match: '/api/match',
        upcoming: '/api/upcoming',
        results: '/api/results',
        info: '/api/info',
        blog: '/api/blog',
        standings: '/api/standings',
        teams: '/api/teams',
        players: '/api/players',
        news: '/api/news'
    },
    ws: {
        url: (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/api/ws'
    },
    refresh: {
        live: 8000,
        matchLive: 4000,
        matchPending: 20000,
        matchRetry: 10000,
        results: 60000,
        upcoming: 90000,
        standings: 300000,
        teams: 300000,
        players: 600000,
        news: 600000,
        blog: 600000,
        ticker: 15000,
        sidebar: 20000,
        hero: 60000
    },
    sources: [
        'https://site.api.espn.com/apis/site/v2/sports',
        'https://core.api.espn.com/v1/sports',
        'https://cdn.espn.com/core'
    ]
};
