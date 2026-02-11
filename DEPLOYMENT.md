# Shotlin CRM — Deploy to AWS t3.small (Ubuntu)

> **Server**: AWS t3.small (2 vCPU, 2 GB RAM) — perfect for 3–4 users  
> **Stack**: Docker + PostgreSQL + Next.js + Nginx + SSL  
> **Time**: ~15 minutes

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:
   - **Name**: `shotlin-crm`
   - **AMI**: Ubuntu Server 24.04 LTS
   - **Instance type**: `t3.small`
   - **Key pair**: Create new → download `.pem` file
   - **Security Group**: Allow **SSH (22)**, **HTTP (80)**, **HTTPS (443)**
   - **Storage**: 20 GB gp3
3. Click **Launch Instance**
4. Note your **Public IP**

### Point your domain

Go to your DNS provider and create an **A record**:
```
app.shotlin.com → YOUR_SERVER_IP
```

---

## Step 2: Connect to Server

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

---

## Step 3: One-Command Server Setup

Copy-paste this entire block — it installs Docker, sets up firewall, and secures SSH:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx fail2ban -y

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Auto security updates
sudo apt install unattended-upgrades -y
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades

# Re-login so docker group takes effect
exit
```

**Now reconnect:**
```bash
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

---

## Step 4: Upload Your Project

**Option A — Git (recommended):**
```bash
mkdir -p ~/apps && cd ~/apps
git clone YOUR_REPO_URL shotlin-crm
cd shotlin-crm
```

**Option B — SCP from your Mac:**
```bash
# Run this on your Mac (NOT on the server)
cd "/Users/sayanmondal/Documents/shotlin CRM"
scp -i your-key.pem -r shotlin-crm ubuntu@YOUR_SERVER_IP:~/apps/shotlin-crm
```

Then on the server:
```bash
cd ~/apps/shotlin-crm
```

---

## Step 5: Create Environment File

```bash
cd ~/apps/shotlin-crm

# Generate secure passwords
DB_PASS=$(openssl rand -base64 24)
AUTH_SECRET=$(openssl rand -base64 48)

cat > .env << EOF
# Database
DB_USER=shotlin
DB_PASSWORD=$DB_PASS
DB_NAME=shotlin_crm
DATABASE_URL=postgresql://shotlin:$DB_PASS@db:5432/shotlin_crm

# NextAuth — CHANGE THE URL TO YOUR DOMAIN
NEXTAUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=https://app.shotlin.com
EOF

# Lock down permissions
chmod 600 .env

# Show the generated values (save these somewhere safe!)
echo ""
echo "========================================="
echo "  SAVE THESE CREDENTIALS SOMEWHERE SAFE"
echo "========================================="
echo "DB Password: $DB_PASS"
echo "Auth Secret: $AUTH_SECRET"
echo "========================================="
```

> ⚠️ **Replace `app.shotlin.com`** in `NEXTAUTH_URL` with your actual domain!

---

## Step 6: Build & Start (One Command)

```bash
cd ~/apps/shotlin-crm
docker compose up -d --build
```

Wait ~2 minutes for the build. Check status:
```bash
docker compose ps
```

You should see both `shotlin-db` (healthy) and `shotlin-app` (running).

### Run database migrations:
```bash
docker compose exec app npx prisma migrate deploy
```

### Create your admin user:
```bash
# Generate password hash (replace YourPassword123 with your chosen password)
HASH=$(docker compose exec app node -e "require('bcryptjs').hash('YourPassword123', 12).then(h => process.stdout.write(h))")

docker compose exec db psql -U shotlin -d shotlin_crm -c "
INSERT INTO \"User\" (id, name, email, password, role, \"isActive\", \"createdAt\", \"updatedAt\")
VALUES (gen_random_uuid()::text, 'Admin', 'admin@shotlin.com', '$HASH', 'SUPER_ADMIN', true, NOW(), NOW());
"
```

### Verify the app is running:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
# Should print: 200
```

---

## Step 7: Setup Nginx + SSL

### Create Nginx config:
```bash
sudo tee /etc/nginx/sites-available/shotlin-crm << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

server {
    listen 80;
    server_name app.shotlin.com;

    location /api/auth/ {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
EOF
```

> ⚠️ **Replace `app.shotlin.com`** with your actual domain in the config above!

### Enable and start:
```bash
sudo ln -sf /etc/nginx/sites-available/shotlin-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### Get SSL certificate (free, auto-renewing):
```bash
sudo certbot --nginx -d app.shotlin.com
```
Follow the prompts (enter email, agree to terms, select redirect).

---

## Step 8: Verify Everything

```bash
# Check containers are running
docker compose ps

# Test HTTPS
curl -sI https://app.shotlin.com | head -20

# Check security headers
curl -sI https://app.shotlin.com | grep -E "X-Frame|X-Content|Strict-Transport"
```

**Open in browser**: `https://app.shotlin.com` → login with your admin credentials.

---

## Step 9: Enable Auto-Restart & Backups

### Auto-restart on server reboot:
```bash
sudo systemctl enable docker
# Docker Compose services already have restart: always
```

### Daily database backup (2 AM):
```bash
mkdir -p ~/backups

cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
docker compose -f ~/apps/shotlin-crm/docker-compose.yml exec -T db \
  pg_dump -U shotlin shotlin_crm | gzip > ~/backups/shotlin_$(date +%Y%m%d).sql.gz
find ~/backups -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x ~/backup-db.sh
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-db.sh") | crontab -
```

---

## Quick Reference

| Task | Command |
|------|---------|
| **View logs** | `docker compose -f ~/apps/shotlin-crm/docker-compose.yml logs -f app` |
| **Restart app** | `docker compose -f ~/apps/shotlin-crm/docker-compose.yml restart app` |
| **Update code** | `cd ~/apps/shotlin-crm && git pull && docker compose up -d --build` |
| **Run migrations** | `docker compose -f ~/apps/shotlin-crm/docker-compose.yml exec app npx prisma migrate deploy` |
| **Check disk** | `df -h && docker system df` |
| **Backup now** | `~/backup-db.sh` |
| **Restore backup** | `gunzip -c ~/backups/shotlin_DATE.sql.gz \| docker compose exec -T db psql -U shotlin -d shotlin_crm` |
| **Renew SSL** | `sudo certbot renew` |

---

## Memory Optimization for t3.small (2 GB)

The `docker-compose.yml` already limits services to localhost-only. For 3–4 users on 2 GB RAM:

- **PostgreSQL**: ~200 MB
- **Next.js app**: ~300 MB  
- **Nginx**: ~20 MB
- **OS + buffers**: ~500 MB
- **Free**: ~1 GB headroom ✅

No additional tuning needed. This setup comfortably handles 3–4 concurrent users.

---

## Security Checklist

After deployment, verify all of these:

- [x] Firewall: only ports 22, 80, 443 open
- [x] PostgreSQL: NOT exposed to internet (127.0.0.1 only)
- [x] SSL/HTTPS: active and auto-renewing
- [x] Fail2Ban: protecting SSH against brute-force
- [x] Nginx: rate limiting on login (5/min) and API (30/min)
- [x] Auto security updates: enabled
- [x] Daily backups: running at 2 AM
- [x] `.env`: locked with chmod 600
