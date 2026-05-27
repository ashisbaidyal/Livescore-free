import {
  buildFeedMeta,
  dedupeById,
  fetchJson,
  jsonResponse,
  normalizeArticle,
  normalizeLeagueParam,
  normalizeScoreboardEvent,
  normalizeSportParam,
  siteApiUrl,
  SPORT_LEAGUES
} from "./_shared.js";

const SPORT_LABELS = {
  all: "All Sports",
  soccer: "Soccer",
  football: "Football",
  basketball: "Basketball",
  baseball: "Baseball",
  hockey: "Hockey",
  cricket: "Cricket",
  tennis: "Tennis",
  mma: "MMA",
  racing: "Racing",
  golf: "Golf",
  rugby: "Rugby",
  "rugby-league": "Rugby League",
  volleyball: "Volleyball",
  "water-polo": "Water Polo",
  lacrosse: "Lacrosse",
  "field-hockey": "Field Hockey",
  "australian-football": "Aussie Rules"
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "after", "before", "into", "about",
  "have", "will", "their", "they", "them", "your", "what", "when", "where", "while", "over",
  "under", "amid", "into", "out", "why", "how", "new", "now", "say", "says", "vs"
]);

function getLeaguePairs(sport, league, limit = 4) {
  if (league) {
    return [{ sport, league }];
  }

  if (sport === "all") {
    return [
      { sport: "soccer", league: "eng.1" },
      { sport: "soccer", league: "uefa.champions" },
      { sport: "basketball", league: "nba" },
      { sport: "football", league: "nfl" },
      { sport: "hockey", league: "nhl" },
      { sport: "baseball", league: "mlb" },
      { sport: "cricket", league: "ipl" },
      { sport: "tennis", league: "atp" },
      { sport: "mma", league: "ufc" },
      { sport: "racing", league: "f1" },
      { sport: "golf", league: "pga" }
    ];
  }

  return (SPORT_LEAGUES[sport] || []).slice(0, limit).map((slug) => ({ sport, league: slug }));
}

function toTimestamp(value = "") {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function titleCase(value = "") {
  return String(value || "")
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractDomain(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}

function getSourceFavicon(url = "") {
  const domain = extractDomain(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : "/icons/icon-192.png";
}

function trimSentence(value = "", limit = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function buildLeagueLabel(league = "", matches = []) {
  const liveLeague = matches.find((match) => match?.league)?.league;
  if (liveLeague) return liveLeague;
  if (!league) return "Global sports";
  return titleCase(league.replace(/\./g, " "));
}

function buildScoreboardDates() {
  const dates = [];
  const now = new Date();
  for (let offset = -1; offset <= 2; offset += 1) {
    const point = new Date(now);
    point.setDate(now.getDate() + offset);
    dates.push(
      `${point.getFullYear()}${String(point.getMonth() + 1).padStart(2, "0")}${String(point.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

async function fetchEditorialArticles(sport, league, limit = 18) {
  const pairs = getLeaguePairs(sport, league, sport === "all" ? 8 : 4);
  const responses = await Promise.all(
    pairs.map(async ({ sport: pairSport, league: pairLeague }) => {
      try {
        const data = await fetchJson(
          siteApiUrl(pairSport, pairLeague, "news", {
            limit: 14
          })
        );
        return (data.articles || []).map((rawArticle) => {
          const article = normalizeArticle(rawArticle);
          const domain = extractDomain(article.url);
          return {
            ...article,
            source: {
              name: rawArticle.source?.name || article.byline || domain || "Public sports source",
              url: article.url || "",
              domain,
              favicon: getSourceFavicon(article.url)
            },
            sport: pairSport,
            league: pairLeague
          };
        });
      } catch (error) {
        return [];
      }
    })
  );

  return {
    articles: dedupeById(responses.flat())
      .sort((left, right) => toTimestamp(right.published) - toTimestamp(left.published))
      .slice(0, limit),
    feeds: pairs.length
  };
}

async function fetchContextMatches(sport, league) {
  const dates = buildScoreboardDates();
  const pairs = getLeaguePairs(sport, league, sport === "all" ? 6 : 3);
  const responses = await Promise.all(
    pairs.flatMap(({ sport: pairSport, league: pairLeague }) =>
      dates.map(async (date) => {
        try {
          const data = await fetchJson(siteApiUrl(pairSport, pairLeague, "scoreboard", { dates: date, limit: 40 }));
          const leagueName = data.leagues?.[0]?.name || titleCase(pairLeague);
          return (data.events || []).map((event) => normalizeScoreboardEvent(event, pairSport, pairLeague, leagueName));
        } catch (error) {
          return [];
        }
      })
    )
  );

  return dedupeById(responses.flat())
    .sort((left, right) => toTimestamp(left.date) - toTimestamp(right.date))
    .slice(0, 32);
}

function scoreMatchAgainstArticle(article, match) {
  const haystack = `${article.headline || ""} ${article.description || ""} ${article.summary || ""}`.toLowerCase();
  const terms = [
    match?.homeTeam?.name,
    match?.homeTeam?.abbreviation,
    match?.awayTeam?.name,
    match?.awayTeam?.abbreviation,
    match?.league
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function findRelatedMatch(article, matches = []) {
  const scored = matches
    .map((match) => ({ match, score: scoreMatchAgainstArticle(article, match) }))
    .sort((left, right) => right.score - left.score);

  return scored[0]?.score > 0 ? scored[0].match : matches[0] || null;
}

function pickVertical(article, relatedMatch, sportLabel) {
  const text = `${article.headline || ""} ${article.description || ""}`.toLowerCase();
  if (/transfer|trade|sign|contract|loan/.test(text)) return "Transfer Radar";
  if (/injur|return|availability|absence/.test(text)) return "Availability Watch";
  if (relatedMatch?.status === "upcoming") return "Next Match Guide";
  if (relatedMatch?.status === "live") return "Live Form Brief";
  if (relatedMatch?.status === "finished") return "Final Whistle Takeaways";
  if (/draft|prospect|academy/.test(text)) return "Future Watch";
  return `${sportLabel} Fan Brief`;
}

function buildKeywords(article, sportLabel, leagueLabel, relatedMatch) {
  const keywords = new Set([
    sportLabel,
    `${sportLabel} news`,
    `${sportLabel} blog`,
    `${sportLabel} fan guide`,
    leagueLabel,
    `${leagueLabel} analysis`,
    article.source?.domain || article.source?.name || "public sports source"
  ]);

  (article.categories || []).forEach((category) => {
    if (category?.name) keywords.add(category.name);
  });

  [relatedMatch?.homeTeam?.name, relatedMatch?.awayTeam?.name, relatedMatch?.league].forEach((item) => {
    if (item) keywords.add(item);
  });

  String(article.headline || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
    .slice(0, 8)
    .forEach((word) => keywords.add(word));

  return Array.from(keywords).slice(0, 14);
}

function buildExcerpt(article, sportLabel, leagueLabel, relatedMatch, vertical) {
  const focus = relatedMatch
    ? `${relatedMatch.homeTeam.name} vs ${relatedMatch.awayTeam.name}`
    : leagueLabel;
  const summary = trimSentence(article.description || article.summary || article.headline, 120);
  return `${vertical} for ${sportLabel} fans: ${summary || "A rewritten evergreen update"} with context around ${focus}.`;
}

function buildSections(article, sportLabel, leagueLabel, relatedMatch, vertical, contextMatches = []) {
  const topic = trimSentence(article.headline || article.title || `${sportLabel} update`, 90);
  const summary = trimSentence(article.description || article.summary || "", 180);
  const nextMatch = contextMatches.find((match) => match.status === "upcoming") || relatedMatch;
  const recentFinal = contextMatches
    .filter((match) => match.status === "finished")
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))[0];

  return [
    {
      heading: `Why ${topic} matters right now`,
      paragraphs: [
        `${sportLabel} supporters tracking ${leagueLabel} need more than a fast headline. This fan brief rewrites the live news cycle into an evergreen read, so the core takeaway stays useful after the first rush of updates has passed.`,
        summary
          ? `${summary} The bigger angle is how this storyline changes the short-term mood around ${leagueLabel}, whether the focus is form, selection, tactics, or momentum.`
          : `The focus here is the bigger picture behind the headline and how it shifts expectations around ${leagueLabel}.`
      ]
    },
    {
      heading: `${vertical} for fans following ${leagueLabel}`,
      paragraphs: [
        relatedMatch
          ? `${relatedMatch.homeTeam.name} and ${relatedMatch.awayTeam.name} give this story a match-day frame. ${relatedMatch.status === "live" ? "With the game active, each update carries immediate tactical weight." : relatedMatch.status === "upcoming" ? "Because the fixture is still ahead, supporters can treat this as a preview of what matters next." : "With the final score already set, the discussion becomes about what comes next rather than what just happened."}`
          : `${leagueLabel} is moving quickly, so the best long-term blog angle is not the flashiest quote but the recurring theme behind it: selection pressure, form swings, and how supporters should read the next round of coverage.`,
        nextMatch
          ? `The next useful checkpoint for readers is ${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name}. That fixture gives the audience a concrete moment to measure whether this storyline fades or grows.`
          : `The next checkpoint is the upcoming slate around ${leagueLabel}, where reaction usually turns into evidence.`
      ]
    },
    {
      heading: `Form, schedule, and what to watch next`,
      paragraphs: [
        recentFinal
          ? `Recent results still shape the tone. ${recentFinal.homeTeam.name} ${recentFinal.homeTeam.score}-${recentFinal.awayTeam.score} ${recentFinal.awayTeam.name} is the kind of scoreline fans use to test whether the headline fits a larger pattern or only one cycle of attention.`
          : `Recent results remain the best filter for separating a real trend from a short burst of attention.`,
        `For searchers looking for ${sportLabel.toLowerCase()} analysis, ${leagueLabel.toLowerCase()} form, and reliable fan context, the strongest signal is whether the same theme keeps showing up across team news, match windows, and selection decisions.`
      ]
    }
  ];
}

function buildReadingTime(sections = []) {
  const totalWords = sections.reduce(
    (count, section) =>
      count +
      (section.paragraphs || []).reduce(
        (sectionCount, paragraph) => sectionCount + String(paragraph || "").split(/\s+/).filter(Boolean).length,
        0
      ),
    0
  );
  return Math.max(3, Math.round(totalWords / 165));
}

function buildPost(article, index, context) {
  const relatedMatch = findRelatedMatch(article, context.matches);
  const vertical = pickVertical(article, relatedMatch, context.sportLabel);
  const headlineSeed = trimSentence(article.headline || article.title || `${context.sportLabel} fan guide`, 96);
  const title = relatedMatch
    ? `${context.sportLabel} fan guide: what ${headlineSeed.toLowerCase()} means for ${relatedMatch.homeTeam.name} vs ${relatedMatch.awayTeam.name}`
    : `${context.sportLabel} fan guide: ${headlineSeed}`;
  const sections = buildSections(article, context.sportLabel, context.leagueLabel, relatedMatch, vertical, context.matches);
  const slugSeed = `${context.sport}-${context.league || "all"}-${article.id || article.headline || index}`;
  const keywords = buildKeywords(article, context.sportLabel, context.leagueLabel, relatedMatch);
  const excerpt = buildExcerpt(article, context.sportLabel, context.leagueLabel, relatedMatch, vertical);
  const quote = relatedMatch
    ? `Supporters will judge this story by what happens next in ${relatedMatch.homeTeam.name} vs ${relatedMatch.awayTeam.name}.`
    : `The headline moves fast, but the better fan read comes from the trend underneath it.`;

  return {
    id: article.id || slugSeed,
    slug: slugify(slugSeed),
    sport: context.sport,
    sportLabel: context.sportLabel,
    league: context.league,
    leagueLabel: context.leagueLabel,
    vertical,
    title,
    headline: article.headline || article.title || title,
    seoTitle: `${title} | ${context.sportLabel} blog`,
    seoDescription: trimSentence(excerpt, 158),
    excerpt,
    description: excerpt,
    image: article.image || "/icons/hero-fallback.svg",
    published: article.published || new Date().toISOString(),
    byline: article.byline || "LivescoreFree editorial desk",
    readingTime: buildReadingTime(sections),
    categories: article.categories || [],
    keywords,
    source: article.source,
    quote,
    sections,
    relatedMatch,
    relatedMatches: context.matches
      .filter((match) => match.id !== relatedMatch?.id)
      .slice(0, 3)
  };
}

function buildSectionBuckets(posts = []) {
  const bucketMap = new Map();
  posts.forEach((post) => {
    const key = post.vertical || "Fan Brief";
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key).push(post);
  });

  return Array.from(bucketMap.entries())
    .slice(0, 4)
    .map(([title, items]) => ({
      title,
      items: items.slice(0, 4)
    }));
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const sport = normalizeSportParam(url.searchParams.get("sport") || url.searchParams.get("s") || "all");
  const league = normalizeLeagueParam(url.searchParams.get("league") || url.searchParams.get("l") || "", sport === "all" ? "" : sport);
  const slug = String(url.searchParams.get("slug") || "").trim();
  const parsedLimit = parseInt(url.searchParams.get("limit") || "16", 10);
  const limit = Math.max(6, Math.min(Number.isFinite(parsedLimit) ? parsedLimit : 16, 24));

  try {
    const [editorialFeed, contextMatches] = await Promise.all([
      fetchEditorialArticles(sport, league, limit + 6),
      fetchContextMatches(sport, league)
    ]);

    const sportLabel = SPORT_LABELS[sport] || titleCase(sport);
    const leagueLabel = buildLeagueLabel(league, contextMatches);
    const contextData = {
      sport,
      league,
      sportLabel,
      leagueLabel,
      matches: contextMatches
    };

    const posts = editorialFeed.articles
      .slice(0, limit)
      .map((article, index) => buildPost(article, index, contextData));

    if (slug) {
      const post = posts.find((entry) => entry.slug === slug) || null;
      if (!post) {
        return jsonResponse(
          {
            post: null,
            relatedPosts: posts.slice(0, 4),
            meta: buildFeedMeta({
              sport,
              league,
              notFound: true
            })
          },
          120,
          404
        );
      }

      return jsonResponse(
        {
          post,
          relatedPosts: posts.filter((entry) => entry.slug !== slug).slice(0, 4),
          meta: buildFeedMeta({
            sport,
            league,
            feeds: editorialFeed.feeds,
            matches: contextMatches.length,
            view: "detail"
          })
        },
        300
      );
    }

    return jsonResponse(
      {
        featured: posts[0] || null,
        posts,
        trending: posts.slice(0, 5),
        sections: buildSectionBuckets(posts.slice(1)),
        meta: buildFeedMeta({
          sport,
          sportLabel,
          league,
          leagueLabel,
          feeds: editorialFeed.feeds,
          matches: contextMatches.length,
          view: "hub"
        })
      },
      300
    );
  } catch (error) {
    return jsonResponse(
      {
        featured: null,
        posts: [],
        trending: [],
        sections: [],
        error: error.message,
        meta: buildFeedMeta({
          sport,
          league,
          degraded: true
        })
      },
      60,
      500
    );
  }
}
