/**
 * LivescoreFree Centralized API Configuration
 * Standardized relative paths for proxy endpoints.
 */
window.LSF_CONFIG = {
    api: {
        live: '/api/live',
        match: '/api/match',
        upcoming: '/api/upcoming',
        results: '/api/results',
        info: '/api/info',
        blog: '/api/blog'
    },
    ws: {
        url: (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/api/ws'
    },
    sources: [
        'https://site.api.espn.com/apis/site/v2/sports',
        'https://core.api.espn.com/v1/sports',
        'https://cdn.espn.com/core'
    ]
};
