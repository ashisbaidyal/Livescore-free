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
      <section id="standings-wrapper-${leagueId}" class="section standings-section">
        <div class="section-head">
          <h2>League Standings</h2>
        </div>
        <div class="table-responsive">
          <table class="standings-table">
            <thead>
              <tr>
                <th>POS</th>
                <th>TEAM</th>
                <th>MP</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GD</th>
                <th>PTS</th>
              </tr>
            </thead>
            <tbody id="standings-body-${leagueId}">
              ${table.map(row => `
                <tr>
                  <td>${row.intRank}</td>
                  <td class="team-cell">
                    <img src="${row.strTeamBadge}" alt="" class="team-badge-sm" onerror="this.src='/logo-mark.png'">
                    <span>${escapeHtml(row.strTeam)}</span>
                  </td>
                  <td>${row.intPlayed}</td>
                  <td>${row.intWin}</td>
                  <td>${row.intDraw}</td>
                  <td>${row.intLoss}</td>
                  <td>${row.intGoalDifference}</td>
                  <td><strong>${row.intPoints}</strong></td>
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
