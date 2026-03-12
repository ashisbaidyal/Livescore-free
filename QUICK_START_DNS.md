# Quick Start: Hostinger DNS Configuration for LiveScoreFree

**⏱️ Time Required:** 10 minutes DNS setup + 24-48 hours propagation  
**Domain:** livescorefree.online  
**Nameservers:** Hostinger's DNS Parking  

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Change Nameservers (CRITICAL - Do First!)

1. Go to: **https://hpanel.hostinger.com**
2. Login with your account
3. Click: **Domains** in left menu
4. Select: **livescorefree.online**
5. Click: **Nameservers** tab
6. Select: **Custom Nameservers**
7. **Replace** the nameservers with:
   ```
   ns1.dns-parking.com
   ns2.dns-parking.com
   ```
8. Click: **Save Changes**
9. ⏳ **Wait 24 hours** for nameserver propagation

---

### Step 2: Add DNS Records (After nameserver update)

Once nameservers are updated (Step 1), add these records:

1. Go to: **Domains** → **livescorefree.online** → **DNS Zone Editor**
2. Click: **Add Record** for each row below

#### Copy-Paste DNS Records

| # | Type | Name/Host | Value | TTL |
|---|------|-----------|-------|-----|
| 1 | A | @ | `185.199.108.153` | 3600 |
| 2 | A | @ | `185.199.109.153` | 3600 |
| 3 | A | @ | `185.199.110.153` | 3600 |
| 4 | A | @ | `185.199.111.153` | 3600 |
| 5 | CNAME | www | `livescorefree.online` | 3600 |
| 6 | CNAME | api | `cname.vercel-dns.com` | 3600 |

**Action for each row:**
1. Click **Add Record**
2. Select **Type** (A or CNAME)
3. Enter **Name/Host** (@ for root, or www/api)
4. Enter **Value** (IP or domain from table)
5. Set **TTL** to 3600
6. Click **Add**
7. Repeat for next row

---

## ✅ VERIFICATION

### Immediate Check (After DNS records added)

```bash
# Check if nameservers are updated
nslookup -type=ns livescorefree.online

# Expected: ns1.dns-parking.com and ns2.dns-parking.com
```

### After 15-30 minutes (DNS propagation)

```bash
# Check root domain
nslookup livescorefree.online

# Expected: One of:
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

# Check www subdomain
nslookup www.livescorefree.online

# Expected: Same as above (redirects to root)

# Check API subdomain
nslookup api.livescorefree.online

# Expected: Vercel IP (different from GitHub)
```

### After 24-48 hours (Full DNS propagation)

**Visit in browser:**
1. https://livescorefree.online → ✅ Should load
2. Check HTTPS certificate (🔒 in address bar)
3. Should show no warnings or errors

---

## 🔧 DNS RECORDS REFERENCE

### GitHub Pages A Records (4x)

These point the root domain to GitHub Pages servers.

```
Type: A
Host: @
Values:
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
```

**Why 4 records?** For redundancy and load balancing across GitHub's datacenters.

### www Subdomain CNAME

Redirects www.livescorefree.online to the root domain.

```
Type: CNAME
Host: www
Value: livescorefree.online
```

**Why CNAME?** Allows www and root to point to same place.

### API Subdomain CNAME

Routes API calls to Vercel serverless functions.

```
Type: CNAME
Host: api
Value: cname.vercel-dns.com
```

**Why cname.vercel-dns.com?** Allows Vercel to auto-provision SSL and manage the endpoint.

---

## ⚠️ COMMON ISSUES & FIX

### Issue: "DNS didn't propagate" (Takes 24-48 hours)

```bash
# Check status before propagation
nslookup livescorefree.online
# May return Hostinger's nameserver IP (old)

# Solution: Wait longer
# Nameserver changes can take up to 48 hours
# Check again in 12-24 hours
```

### Issue: "HTTPS certificate not valid"

```bash
# Certificate is issued by Let's Encrypt
# May take 5-10 minutes after DNS is live

# Solution:
1. Clear browser cache
2. Wait 10 minutes
3. Try again
4. All green ✅ in address bar
```

### Issue: "API endpoint not found (404)"

```bash
# Verify Vercel deployment
# Check: https://vercel.com → livescorefree

# The api.livescorefree.online CNAME must point:
# → cname.vercel-dns.com

# Solution: Verify CNAME record is exactly:
# api → cname.vercel-dns.com
```

### Issue: "Site loads but API doesn't work"

```bash
# Check API DNS resolution
nslookup api.livescorefree.online

# It should resolve to Vercel IP
# (Different from GitHub Pages IP)

# If it shows GitHub IP, the CNAME wasn't added
```

---

## 📋 VERIFICATION CHECKLIST

After DNS setup complete, verify:

```
☐ Nameservers updated to Hostinger DNS parking
☐ 4x A records added for root domain
☐ 1x CNAME added for www subdomain
☐ 1x CNAME added for api subdomain
☐ Waited 24-48 hours for full propagation
☐ https://livescorefree.online loads
☐ https://www.livescorefree.online works
☐ https://api.livescorefree.online responds
☐ No HTTPS certificate warnings
☐ Service worker installs (DevTools → Application)
☐ Live matches display on home page
☐ API calls complete (<500ms response)
```

---

## 🎯 WHAT'S DEPLOYED

### Frontend (GitHub Pages)
- https://livescorefree.online → Serves index.html + app.js
- Automatic HTTPS via Let's Encrypt
- Global CDN for fast loading
- Service worker for offline support

### Backend (Vercel)
- https://api.livescorefree.online/live → Live matches
- https://api.livescorefree.online/timeline → Match timeline
- https://api.livescorefree.online/standings → League standings
- Auto-scales, auto-HTTPS, global distribution

### Status
🟢 **Frontend:** Deployed immediately (GitHub Pages auto-deploy)  
🟢 **Backend:** Deployed immediately (Vercel auto-deploy)  
🟡 **Domain:** Awaiting DNS setup (your action)  

---

## 📞 SUPPORT

**Issue during DNS setup?**
- Check: https://hpanel.hostinger.com (DNS Zone Editor)
- Wait: Full propagation takes 24-48 hours
- Test: Use `nslookup livescorefree.online` command

**Technical questions?**
- Email: hello@livescorefree.com
- See: PRODUCTION_DEPLOYMENT_GUIDE.md for detailed info

---

**Status:** 🟢 READY FOR LAUNCH  
**Next Action:** Update Hostinger DNS records (see table above)  
**Expected Completion:** 24-48 hours after DNS update
