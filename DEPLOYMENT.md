# Deployment

**Recommended:** Railway (runs the `Dockerfile`) + Supabase Free + Cloudflare DNS.
No server to maintain. A self-managed VPS setup is described at the end.

```
Visitor → Railway (HTTPS, Docker container: Next.js) → Supabase (data, login, images)
```

Run **one** instance (replicas = 1): the page cache and rate limiter live in that process.

## 1. Supabase

1. Run the SQL files as described in `SETUP.md`, including `p0_security.sql`.
2. Check that RLS is enabled on every table.
3. **Authentication → Sign In / Providers**: disable public sign-up if only admins log in.
4. Keep product photos under about 300 KB. The free plan's 5 GB egress is the main limit.

Never put the `service_role` key in this app.

## 2. Railway

1. Sign up at railway.com with GitHub and choose the **Hobby** plan.
2. **New Project → Deploy from GitHub repo** → this repository. Railway detects the `Dockerfile`.
3. **Settings**:
   - Source branch: `main`, with automatic deploys on.
   - Region: **EU West (Amsterdam)**.
   - Replicas: **1**.
   - Health check path: `/api/health`.
   - Restart policy: **On failure**.
4. **Variables** (Railway also passes them to the Docker build):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
| `TRUST_CLOUDFLARE_IP` | `false` |

   The `NEXT_PUBLIC_*` values are compiled into the site: after changing one, **redeploy**.
5. Optional: add a **volume** mounted at `/app/.next/cache/images`, so optimized images survive deploys.
6. **Workspace → Usage**: set a usage limit (for example $15) so a traffic spike can't run up the bill.
7. Deploy and check that the logs show `Ready` and the generated `*.up.railway.app` address works.

If the build log says "Missing NEXT_PUBLIC_* build arguments", the variables were not passed to the
build: check their names and redeploy.

## 3. Domain and Cloudflare

1. Buy the domain, add it to Cloudflare (Free) and change the nameservers at the registrar.
2. Railway → **Settings → Networking → Custom Domain**: add `your-domain.com` and `www.your-domain.com`.
   Railway shows the DNS records to create.
3. In Cloudflare create those records as **DNS only (grey cloud)**. Railway issues the HTTPS certificate.
4. Add a Cloudflare redirect rule from `www` to the main domain if you prefer one address.

Keep the records grey (DNS only) and leave `TRUST_CLOUDFLARE_IP=false`: the app is also reachable
at its Railway address, where visitors could forge the Cloudflare IP header.

## 4. Backups

The **Database backup** workflow (`.github/workflows/backup.yml`) runs nightly and keeps an
encrypted dump for 14 days.

1. GitHub → **Settings → Secrets and variables → Actions** → add:
   - `DATABASE_URL`: Supabase → **Connect → Session pooler** connection string
   - `BACKUP_PASSPHRASE`: a long random password. **Store it in your password manager**;
     without it the backups cannot be opened.
2. **Actions → Database backup → Run workflow** once, and check that an artifact appears.
3. Once a month, download the latest artifact and keep it on your PC or cloud drive.

The backup covers the database (`public` and `auth`). Product images live in Supabase Storage:
download the `product-images` bucket from the dashboard now and then, or add an rclone copy.

### Restore (test this every 3 months, into a spare Supabase project)

```bash
gpg --decrypt db.dump.gpg > db.dump
pg_restore --no-owner --clean --if-exists -d "TARGET_DATABASE_URL" db.dump
```

## 5. Monitoring

Point a free uptime monitor (UptimeRobot or Better Stack) at `https://your-domain.com/ar` and
`/api/health` every 5 minutes. Check Supabase **Usage** and the Railway bill monthly.

## Release checklist

- [ ] CI passes, then merge `develop` into `main` (Railway deploys automatically)
- [ ] `/ar`, `/fr` and `/en` load with images
- [ ] Admin login works, and an edit shows in the store
- [ ] A test order opens WhatsApp
- [ ] `robots.txt` and `sitemap.xml` use the real domain

To roll back, open the previous deployment in Railway and choose **Redeploy**.

## Maintenance

| When | Task |
|---|---|
| Monthly | `npm audit` and Next.js patch updates; check backups, Supabase usage and the Railway bill |
| Every 3 months | Test a restore |
| Before April 2027 | Node.js 22 support ends: change `node:22-slim` to `node:24-slim` in the `Dockerfile`, test, deploy |
| Yearly | Domain renewal (keep auto-renew on and the card valid) |

Turn on **Dependabot security updates** in GitHub (Settings → Code security).

---

## Alternative: self-managed VPS (Coolify + Cloudflare proxy)

Cheaper at higher traffic, but you maintain the server.

```
Visitor → Cloudflare (DNS, HTTPS, CDN) → VPS (Coolify → Docker → Next.js) → Supabase
```

The app ships as a Docker image (`Dockerfile`). Run **one** instance: the page
cache and rate limiter live in that process.

### 1. Supabase

1. Use a European region. Run the SQL files as described in `SETUP.md`, including `p0_security.sql`.
2. Check that RLS is enabled on every table.
3. **Authentication → Sign In / Providers**: disable public sign-up if only admins log in.
4. Keep product photos under about 300 KB. The free plan's egress limit is the main constraint.

Never put the `service_role` key in this app.

### 2. VPS

1. Create an Ubuntu LTS server in Germany or Finland with 4 GB RAM (builds need more memory than running does).
2. Log in with an SSH key, disable password login, and enable `unattended-upgrades`.
3. Install Coolify using the command on <https://coolify.io/docs>, and create its admin account **immediately**.
4. In the **hosting provider's firewall** (Docker can bypass `ufw`), allow only:

| Port | Allowed from |
|---|---|
| 22 (SSH) and 8000, 6001, 6002 (Coolify) | Your IP only |
| 80, 443 | Cloudflare ranges only: <https://www.cloudflare.com/ips/> |

With `TRUST_CLOUDFLARE_IP=true` the app trusts `CF-Connecting-IP` for rate limiting, so the Cloudflare-only rule is required.
Because the dashboard is closed, GitHub webhooks cannot reach Coolify: deploy
with the **Deploy** button, or allow GitHub's webhook IP ranges on port 8000.

### 3. Coolify application

1. New resource → GitHub repository → branch `main` → build pack **Dockerfile** → port `3000`.
2. Set the domain to `https://your-domain`.
3. Add these variables and mark each one as a **build variable**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` |
| `NEXT_PUBLIC_STORE_ID` | optional |
| `TRUST_CLOUDFLARE_IP` | `true` (runtime variable; only Cloudflare can reach the server) |

4. Add a persistent **volume** mounted at `/app/.next/cache/images`.
5. Set the health check path to `/api/health`.

These values are compiled into the site: after changing one, **redeploy**.

### 4. Cloudflare

1. Add the domain and create proxied (orange cloud) records for `@` and `www` pointing to the VPS.
2. **SSL/TLS → Full (strict)**. Create a Cloudflare **Origin Certificate** and install it in Coolify's proxy: Let's Encrypt validation can fail behind the Cloudflare-only firewall.
3. Enable **Always Use HTTPS**, and HSTS once HTTPS is confirmed.
4. Redirect `www` to the main domain.
5. Do **not** add a "Cache Everything" rule: it could cache admin pages and delay product updates.

### 5. Backups

Install `rclone` and configure an off-site remote (`rclone config`). To include images, also add
the Supabase Storage S3 endpoint as a remote. Then create `/etc/store-backup.env` (`chmod 600`):

```bash
DATABASE_URL='postgresql://...'            # Supabase → Connect → Session pooler
RCLONE_DEST='r2:store-backups'
RCLONE_IMAGES='supabase:product-images'
```

Copy `scripts/backup.sh` to `/usr/local/bin/store-backup`, make it executable, and run it once by hand.
Then add to root's crontab:

```cron
15 3 * * * /usr/local/bin/store-backup >> /var/log/store-backup.log 2>&1
```

Use a `pg_dump` image at least as new as your Supabase Postgres version. Test a restore into a
spare Supabase project before relying on the backups.

### 6. Monitoring

Point a free uptime monitor at `https://your-domain/ar` (every 5 minutes). Check Supabase
**Usage** monthly and upgrade if egress nears the free limit.

### Release checklist

- [ ] CI passes, then merge `develop` into `main` and deploy
- [ ] `/ar`, `/fr` and `/en` load with images
- [ ] Admin login works, and an edit shows in the store
- [ ] A test order opens WhatsApp
- [ ] `robots.txt` and `sitemap.xml` use the real domain

To roll back, redeploy the previous version from Coolify's deployment history.

### Maintenance

Monthly: apply OS and Coolify updates, run `npm audit`, and check that backups exist.
