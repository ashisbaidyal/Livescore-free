# LiveScoreFree Hostinger DNS Setup Guide

## Overview
This guide explains how to configure your Hostinger DNS to point to both **GitHub Pages** (frontend) and **Vercel** (backend API endpoints) for the LiveScoreFree domain.

---

## Step 1: Configure GitHub Pages A Records

Go to your **Hostinger Control Panel** → **DNS Zone Editor** and add these four A records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |

**Explanation:** These are GitHub Pages' official IP addresses. All four must be configured for redundancy and load balancing.

---

## Step 2: Configure www Subdomain (Optional)

If you want **www.livescorefree.online** to work:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | www | livescorefree.online | 3600 |

---

## Step 3: Important - Do NOT Override API Routes

**DO NOT** create A records or CNAME records that would override `/api/*` routes, as these should be handled by Vercel.

Vercel automatically intercepts requests to:
- `https://livescorefree.online/api/live`
- `https://livescorefree.online/api/timeline`
- `https://livescorefree.online/api/standings`

No additional DNS records are needed—Vercel and GitHub Pages routing handles this automatically via `vercel.json` rewrites.

---

## Step 4: Verify Configuration

After adding the DNS records:

1. **Wait 24-48 hours** for DNS propagation (usually much faster)
2. **Test** via command line:
   ```bash
   nslookup livescorefree.online
   ```
   Should resolve to one of the GitHub Pages IPs.

3. **Test frontend:** Visit `https://livescorefree.online`
4. **Test API:** Visit `https://livescorefree.online/api/live`

---

## DNS Records Summary

### Root Domain (@)
- **4x A Records** → GitHub Pages IPs (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)

### Subdomain (www)
- **CNAME Record** → livescorefree.online (optional, for convenience)

### API Routes
- **Handled by:** Vercel + vercel.json rewrites (no DNS records needed)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Site shows "Page not found" | Ensure CNAME file exists in repo with `livescorefree.online` |
| API returns 404 | Check `vercel.json` rewrites configuration |
| DNS not resolving | Wait 24-48 hours, then flush DNS cache: `ipconfig /flushdns` |
| HTTPS not working | Enable HTTPS enforcement in GitHub Pages settings |
| API timeout | Check Vercel function logs in dashboard |

---

## References

- [GitHub Pages IP Addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/deployments/custom-domains)
- [Hostinger DNS Management](https://support.hostinger.com/en/articles/4419896-how-to-manage-dns-zone)
