import useSWR from 'swr';

const PROXY_URL = '/api/proxy?url=';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Map our local UI tabs to ESPN feed paths
const SPORT_FEEDS: Record<string, string[]> = {
  football: ['soccer/eng.1', 'soccer/esp.1', 'soccer/uefa.champions', 'soccer/ita.1'],
  cricket: ['cricket'],
  basketball: ['basketball/nba'],
  tennis: ['tennis/atp'],
};

export interface DisplayMatch {
  id: string;
  leagueName: string;
  homeTeam: { name: string; logo: string; score: string };
  awayTeam: { name: string; logo: string; score: string };
  status: 'live' | 'upcoming' | 'final';
  statusDetail: string;
  date: string;
  link: string;
}

export function useLiveMatches(sportGroup: string) {
  const feeds = SPORT_FEEDS[sportGroup] || [];
  
  // We use Promise.all under the hood of a single SWR key by creating a compound fetcher
  // However, SWR handles single URLs best. We can fetch them concurrently in our fetcher.
  const compoundKey = feeds.length > 0 ? `espn-${sportGroup}` : null;

  const { data, error, isLoading } = useSWR<DisplayMatch[]>(
    compoundKey,
    async () => {
      const promises = feeds.map(feed => {
        const url = `${PROXY_URL}${encodeURIComponent(`${ESPN_BASE}/${feed}/scoreboard`)}`;
        return fetcher(url).catch(() => null); // Catch individual errors so Promise.all succeeds
      });
      
      const results = await Promise.all(promises);
      const allMatches: DisplayMatch[] = [];

      results.forEach((leagueData) => {
        if (!leagueData || !leagueData.events) return;
        
        const leagueName = leagueData.leagues?.[0]?.name || 'Sports';
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leagueData.events.forEach((event: any) => {
          const comp = event.competitions?.[0];
          if (!comp) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const home = comp.competitors?.find((c: any) => c.homeAway === 'home') || comp.competitors?.[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const away = comp.competitors?.find((c: any) => c.homeAway === 'away') || comp.competitors?.[1];

          const rawStatus = event.status?.type?.name?.toLowerCase() || '';
          let calcStatus: 'live' | 'upcoming' | 'final' = 'upcoming';
          if (rawStatus.includes('in') || rawStatus.includes('live') || rawStatus.includes('half')) calcStatus = 'live';
          else if (rawStatus.includes('post') || rawStatus.includes('final') || rawStatus.includes('ft')) calcStatus = 'final';

          allMatches.push({
            id: event.id,
            leagueName: leagueName,
            homeTeam: {
              name: home?.team?.shortDisplayName || home?.team?.name || 'Home',
              logo: home?.team?.logo || '',
              score: home?.score || '-',
            },
            awayTeam: {
              name: away?.team?.shortDisplayName || away?.team?.name || 'Away',
              logo: away?.team?.logo || '',
              score: away?.score || '-',
            },
            status: calcStatus,
            statusDetail: event.status?.type?.shortDetail || 'TBD',
            date: event.date,
            link: `/match/${sportGroup}-${event.id}`,
          });
        });
      });

      // Sort by status: live first, then upcoming, then final
      allMatches.sort((a, b) => {
        const rank = { live: 1, upcoming: 2, final: 3 };
        return rank[a.status] - rank[b.status];
      });

      return allMatches;
    },
    { refreshInterval: 15000 } // Poll every 15s like the legacy kinetic engine
  );

  return {
    matches: data,
    isLoading,
    isError: error
  };
}
