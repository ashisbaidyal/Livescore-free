import { 
  qs, 
  escapeHtml 
} from "./utils.js";
import { 
  cachedJson,
  SPORTSDB_BASE
} from "./api.js";

export async function renderStandingsTable(container, leagueId) {
  if (!container || !leagueId) return;

  container.innerHTML = `<div class="loading-standings">Loading Standings...</div>`;

  try {
    const data = await cachedJson(`${SPORTSDB_BASE}/lookuptable.php?l=${leagueId}&s=${new Date().getFullYear()}`, 1000 * 60 * 60);
    const table = data?.table || [];

    if (!table.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <section id="standings-wrapper-${leagueId}" class="standings-section">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black tracking-tighter uppercase italic border-l-4 border-primary pl-4">League Standings</h2>
        </div>
        <div class="w-full bg-surface-container-lowest overflow-x-auto border border-white/5">
          <table class="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-surface-container border-b border-white/5 text-[10px] font-black tracking-widest text-on-surface/40 uppercase">
                <th class="py-4 px-6 w-12 text-center">RK</th>
                <th class="py-4 px-6">CLUB</th>
                <th class="py-4 px-4 text-center">PL</th>
                <th class="py-4 px-4 text-center">W</th>
                <th class="py-4 px-4 text-center">D</th>
                <th class="py-4 px-4 text-center">L</th>
                <th class="py-4 px-4 text-center">GD</th>
                <th class="py-4 px-6 text-right">PTS</th>
              </tr>
            </thead>
            <tbody id="standings-body-${leagueId}" class="divide-y divide-white/5 font-headline">
              ${table.map((row, i) => `
                <tr class="hover:bg-white/5 transition-colors cursor-pointer group">
                  <td class="py-5 px-6 font-black italic text-center ${i < 4 ? 'text-primary' : 'text-on-surface/40'}">${String(row.intRank).padStart(2, '0')}</td>
                  <td class="py-5 px-6">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-surface-container flex items-center justify-center p-2 rounded">
                        <img src="${row.strTeamBadge}" alt="" class="w-full h-full object-contain" onerror="this.src='/logo-mark.png'">
                      </div>
                      <div>
                        <p class="font-black uppercase italic tracking-tighter text-sm">${escapeHtml(row.strTeam)}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-5 px-4 text-center font-bold text-sm text-on-surface/60">${row.intPlayed}</td>
                  <td class="py-5 px-4 text-center font-bold text-sm text-on-surface/60">${row.intWin}</td>
                  <td class="py-5 px-4 text-center font-bold text-sm text-on-surface/60">${row.intDraw}</td>
                  <td class="py-5 px-4 text-center font-bold text-sm text-on-surface/60">${row.intLoss}</td>
                  <td class="py-5 px-4 text-center font-bold text-sm ${parseInt(row.intGoalDifference) > 0 ? 'text-secondary' : 'text-on-surface/40'}">${row.intGoalDifference}</td>
                  <td class="py-5 px-6 text-right font-black text-xl italic tracking-tighter">${row.intPoints}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  } catch (error) {
    console.error("Failed to load standings:", error);
    container.innerHTML = "";
  }
}



