# Production Deployment Guide

## Overview

This guide covers deploying the Dark Pool backend to production with Arcium MPC integration for private order matching on Solana.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Clients   │────▶│  Load Balancer│────▶│  API Server │
│ (Web/Mobile)│     │   (nginx)     │     │  (Node.js)  │
└─────────────┘     └──────────────┘     └─────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────┐
                    │                             │             │
              ┌─────▼─────┐              ┌────────▼────────┐   │
              │   Redis   │              │  Arcium MPC     │   │
              │  Cluster  │              │   Network       │   │
              └───────────┘              └─────────────────┘   │
                                                                │
                                                         ┌──────▼──────┐
                                                         │   Solana    │
                                                         │  Blockchain │
                                                         └─────────────┘
```

## Infrastructure Requirements

### Minimum Specifications

**API Server:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- Network: 1 Gbps

**Redis Server:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD

### Recommended Specifications

**API Server (Production):**
- CPU: 8 cores
- RAM: 16 GB
- Storage: 100 GB NVMe SSD
- Network: 10 Gbps

**Redis Cluster:**
- 3+ nodes for high availability
- CPU: 4 cores per node
- RAM: 8 GB per node
- Storage: 50 GB SSD per node

## Pre-Deployment Checklist

### Security

- [ ] Generate production Solana wallet
- [ ] Secure wallet private key (use hardware wallet or HSM)
- [ ] Generate strong API keys
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable DDoS protection
- [ ] Configure rate limiting
- [ ] Set up VPN for admin access
- [ ] Enable audit logging

### Infrastructure

- [ ] Provision servers (cloud or on-premise)
- [ ] Set up load balancer
- [ ] Configure Redis cluster
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Set up backup system
- [ ] Configure auto-scaling
- [ ] Set up CDN (if needed)

### Solana

- [ ] Fund production wallet
- [ ] Deploy program to mainnet
- [ ] Initialize computation definitions
- [ ] Verify program deployment
- [ ] Test with small transactions
- [ ] Configure RPC endpoints (use private RPC for production)

## Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis
sudo apt install -y redis-server

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install monitoring tools
sudo apt install -y prometheus grafana
```

### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url>
cd Backend/darkPool

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Build application
npm run build

# Deploy Solana program
npm run deploy:mainnet

# Initialize computation definitions
npm run init:comp-defs
```

### 3. Redis Configuration

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Recommended settings:
# maxmemory 4gb
# maxmemory-policy allkeys-lru
# appendonly yes
# appendfsync everysec

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

### 4. Process Management

Using PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name darkpool

# Configure auto-restart
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### 5. Nginx Configuration

```nginx
# /etc/nginx/sites-available/darkpool

upstream darkpool_api {
    least_conn;
    server 127.0.0.1:3001;
    # Add more servers for load balancing
    # server 127.0.0.1:3002;
    # server 127.0.0.1:3003;
}

upstream darkpool_ws {
    ip_hash;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API endpoints
    location /api/ {
        proxy_pass http://darkpool_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://darkpool_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
```

Enable and restart nginx:

```bash
sudo ln -s /etc/nginx/sites-available/darkpool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring Setup

### Prometheus Configuration

```yaml
# /etc/prometheus/prometheus.yml

global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'darkpool'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/health/metrics'
```

### Grafana Dashboard

1. Add Prometheus data source
2. Import dashboard for Node.js applications
3. Create custom panels for:
   - Order submission rate
   - Matching engine performance
   - WebSocket connections
   - Redis operations
   - Solana transaction success rate

### Alerting Rules

```yaml
# /etc/prometheus/alerts.yml

groups:
  - name: darkpool
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: MatchingEngineDown
        expr: matching_engine_running == 0
        for: 1m
        annotations:
          summary: "Matching engine stopped"

      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        annotations:
          summary: "Redis connection lost"
```

## Backup Strategy

### Database Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-redis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"

# Create backup
redis-cli BGSAVE
sleep 5
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis-$DATE.rdb

# Compress
gzip $BACKUP_DIR/redis-$DATE.rdb

# Delete old backups (keep 30 days)
find $BACKUP_DIR -name "redis-*.rdb.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/redis-$DATE.rdb.gz s3://your-bucket/backups/
```

Schedule with cron:

```bash
# Run every 6 hours
0 */6 * * * /usr/local/bin/backup-redis.sh
```

### Wallet Backup

```bash
# Encrypt and backup wallet
gpg --symmetric --cipher-algo AES256 ~/.config/solana/id.json
aws s3 cp ~/.config/solana/id.json.gpg s3://your-secure-bucket/wallet-backup/
```

## Disaster Recovery

### Recovery Procedures

1. **Server Failure:**
   - Spin up new server from image
   - Restore Redis from backup
   - Deploy application
   - Update DNS/load balancer

2. **Redis Failure:**
   - Restore from latest backup
   - Replay transaction logs if available
   - Verify data integrity

3. **Solana Program Issue:**
   - Deploy program to new address
   - Update configuration
   - Migrate state if needed

### RTO/RPO Targets

- **RTO (Recovery Time Objective):** < 1 hour
- **RPO (Recovery Point Objective):** < 15 minutes

## Performance Optimization

### Node.js Tuning

```bash
# Increase heap size
NODE_OPTIONS="--max-old-space-size=4096" pm2 start src/server.js

# Enable cluster mode
pm2 start src/server.js -i max
```

### Redis Tuning

```conf
# /etc/redis/redis.conf

# Memory optimization
maxmemory 4gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### Solana RPC Optimization

- Use private RPC endpoints (Helius, QuickNode, Triton)
- Implement connection pooling
- Cache frequently accessed data
- Use WebSocket subscriptions for real-time updates

## Security Hardening

### Firewall Rules

```bash
# Allow SSH (from specific IPs only)
sudo ufw allow from YOUR_IP to any port 22

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable
```

### Fail2Ban Configuration

```ini
# /etc/fail2ban/jail.local

[darkpool-api]
enabled = true
port = 80,443
filter = darkpool-api
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
```

### Regular Security Updates

```bash
# Automated security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Maintenance

### Regular Tasks

**Daily:**
- Check system health
- Review error logs
- Monitor metrics

**Weekly:**
- Review security logs
- Check backup integrity
- Update dependencies (test first)

**Monthly:**
- Security audit
- Performance review
- Capacity planning

### Update Procedure

```bash
# 1. Test in staging
git pull origin main
npm install
npm run build
npm test

# 2. Backup production
./backup-redis.sh

# 3. Deploy to production
pm2 stop darkpool
git pull origin main
npm install
npm run build
pm2 start darkpool

# 4. Verify deployment
curl https://api.yourdomain.com/api/health
```

## Cost Optimization

### Cloud Provider Recommendations

**AWS:**
- EC2 t3.large for API server
- ElastiCache for Redis
- Application Load Balancer
- CloudWatch for monitoring

**GCP:**
- Compute Engine n2-standard-4
- Memorystore for Redis
- Cloud Load Balancing
- Cloud Monitoring

**DigitalOcean:**
- Droplet 8GB/4vCPU
- Managed Redis
- Load Balancer
- Monitoring included

### Cost Estimates

**Small Scale (< 1000 orders/day):**
- Server: $50-100/month
- Redis: $30-50/month
- Monitoring: $20/month
- **Total: ~$100-170/month**

**Medium Scale (< 10,000 orders/day):**
- Servers (2x): $200-300/month
- Redis Cluster: $100-150/month
- Load Balancer: $20/month
- Monitoring: $50/month
- **Total: ~$370-520/month**

**Large Scale (> 100,000 orders/day):**
- Servers (5x): $500-750/month
- Redis Cluster: $300-500/month
- Load Balancer: $50/month
- Monitoring: $100/month
- CDN: $50/month
- **Total: ~$1000-1450/month**

## Support and Maintenance

### Monitoring Contacts

- On-call engineer: [contact]
- DevOps team: [contact]
- Security team: [contact]

### Escalation Procedures

1. **Level 1:** Automated alerts → On-call engineer
2. **Level 2:** Service degradation → DevOps team
3. **Level 3:** Critical outage → All hands

### Documentation

- Runbooks: `/docs/runbooks/`
- Architecture diagrams: `/docs/architecture/`
- API documentation: `/docs/api/`

## Compliance

### Data Privacy

- GDPR compliance for EU users
- Data encryption at rest and in transit
- User data retention policies
- Right to deletion procedures

### Audit Trail

- All API requests logged
- Order modifications tracked
- Admin actions recorded
- Regular security audits

## Conclusion

This production deployment provides:

✓ High availability and fault tolerance
✓ Scalability for growing demand
✓ Security best practices
✓ Comprehensive monitoring
✓ Disaster recovery procedures
✓ Cost-effective infrastructure

For support, contact the development team or refer to the documentation.
