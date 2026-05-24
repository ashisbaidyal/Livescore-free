const SITE_ORIGIN = "https://livescorefree.online";
const INDEXNOW_KEY = "9d4f7b2c8a1e4f03b6c9d0a5e7f21834";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function decodeXml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function getArgValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function readSitemapUrls() {
  const sitemapUrl = getArgValue("sitemap", `${SITE_ORIGIN}/sitemap.xml`);
  const response = await fetch(sitemapUrl, {
    headers: {
      Accept: "application/xml,text/xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch sitemap ${sitemapUrl}: ${response.status}`);
  }

  const xml = await response.text();
  const urls = Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g))
    .map((match) => decodeXml(match[1]).trim())
    .filter((url) => url.startsWith(`${SITE_ORIGIN}/`));

  return [...new Set(urls)];
}

async function submitBatch(urlList) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      host: new URL(SITE_ORIGIN).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList
    })
  });

  if (!response.ok && response.status !== 202) {
    const body = await response.text().catch(() => "");
    throw new Error(`IndexNow rejected batch: ${response.status} ${body}`.trim());
  }

  return response.status;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limit = Number.parseInt(getArgValue("limit", "10000"), 10);
  const urls = (await readSitemapUrls()).slice(0, Number.isFinite(limit) ? limit : 10000);

  if (dryRun) {
    console.log(`IndexNow dry run: ${urls.length} URLs ready.`);
    urls.slice(0, 10).forEach((url) => console.log(url));
    return;
  }

  let submitted = 0;
  for (const batch of chunk(urls, 10000)) {
    await submitBatch(batch);
    submitted += batch.length;
  }

  console.log(`Submitted ${submitted} URLs to IndexNow.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
