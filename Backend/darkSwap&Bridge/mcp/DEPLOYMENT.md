# MCP Production Deployment Guide

Complete guide for deploying the Obscura Swap MCP server to production.

## Deployment Options

### Option 1: Local MCP + Production API (Recommended)

**Best for**: Individual developers, small teams

**Architecture**:
```
AI Assistant (Local) → MCP Server (Local) → Backend API (Production)
```

**Pros**:
- Simple setup
- No server management
- Secure (MCP runs locally)
- Easy debugging

**Cons**:
- Requires local MCP server running
- Each user needs own setup

**Setup**:

1. Build MCP server:
```bash
cd mcp/server
pnpm build
```

2. Configure production API:
```env
# mcp/server/.env
OBSCURA_API_URL=https://api.obscuraswap.com
```

3. Configure AI assistant with local MCP server path

### Option 2: Remote MCP Server

**Best for**: Teams, shared infrastructure

**Architecture**:
```
AI Assistant → MCP Server (Remote) → Backend API (Production)
```

**Pros**:
- Centralized management
- Single source of truth
- Easy updates

**Cons**:
- Requires server hosting
- Network latency
- Security considerations

**Setup**:

1. Deploy to server (VPS, cloud instance)
2. Configure systemd service or PM2
3. Setup reverse proxy (optional)
4. Configure AI assistants with remote URL

### Option 3: Serverless Deployment

**Best for**: Scalable, on-demand usage

**Architecture**:
```
AI Assistant → Serverless Function → Backend API (Production)
```

**Pros**:
- Auto-scaling
- Pay per use
- No server management

**Cons**:
- Cold start latency
- May need custom MCP transport
- Platform-specific setup

**Platforms**:
- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Vercel Functions

## Detailed Deployment Steps

### Option 1: Local + Production (Detailed)

#### Step 1: Prepare Production Backend

```bash
# Deploy backend to production
# Ensure it's accessible at https://api.obscuraswap.com
```

#### Step 2: Build MCP Server

```bash
cd mcp/server
pnpm install --prod
pnpm build
```

#### Step 3: Configure Environment

```env
# mcp/server/.env
OBSCURA_API_URL=https://api.obscuraswap.com
NODE_ENV=production
```

#### Step 4: Test Connection

```bash
cd ../client
pnpm test
```

#### Step 5: Configure AI Assistant

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/server/dist/index.js"],
      "env": {
        "OBSCURA_API_URL": "https://api.obscuraswap.com",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Option 2: Remote Server (Detailed)

#### Step 1: Setup Server

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Clone or copy MCP server
git clone your-repo.git
cd your-repo/mcp/server
```

#### Step 2: Install & Build

```bash
pnpm install --prod
pnpm build
```

#### Step 3: Configure Environment

```bash
# Create .env
cat > .env << EOF
OBSCURA_API_URL=https://api.obscuraswap.com
NODE_ENV=production
PORT=3001
EOF
```

#### Step 4: Setup Process Manager

**Using PM2**:

```bash
# Install PM2
npm install -g pm2

# Start MCP server
pm2 start dist/index.js --name obscuraswap-mcp

# Save PM2 config
pm2 save

# Setup auto-start
pm2 startup
```

**Using systemd**:

```bash
# Create service file
sudo nano /etc/systemd/system/obscuraswap-mcp.service
```

```ini
[Unit]
Description=Obscura Swap MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/mcp/server
Environment=OBSCURA_API_URL=https://api.obscuraswap.com
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable obscuraswap-mcp
sudo systemctl start obscuraswap-mcp
sudo systemctl status obscuraswap-mcp
```

#### Step 5: Setup Reverse Proxy (Optional)

**Nginx**:

```nginx
server {
    listen 80;
    server_name mcp.obscuraswap.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 6: Configure AI Assistants

```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["connect-to-remote-mcp-server"],
      "url": "https://mcp.obscuraswap.com"
    }
  }
}
```

**Note**: May require custom MCP transport for remote connections.

### Option 3: Serverless (AWS Lambda Example)

#### Step 1: Prepare Lambda Package

```bash
cd mcp/server
pnpm install --prod
pnpm build

# Create deployment package
zip -r lambda.zip dist node_modules package.json
```

#### Step 2: Create Lambda Function

```bash
# Using AWS CLI
aws lambda create-function \
  --function-name obscuraswap-mcp \
  --runtime nodejs18.x \
  --handler dist/index.handler \
  --zip-file fileb://lambda.zip \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-role \
  --environment Variables="{OBSCURA_API_URL=https://api.obscuraswap.com}"
```

#### Step 3: Setup API Gateway

```bash
# Create API Gateway
aws apigatewayv2 create-api \
  --name obscuraswap-mcp \
  --protocol-type HTTP \
  --target arn:aws:lambda:region:account:function:obscuraswap-mcp
```

#### Step 4: Configure AI Assistant

**Note**: Serverless deployment may require custom MCP transport adapter.

## Security Considerations

### Environment Variables

**Never commit**:
- `.env` files
- API keys
- Private keys
- Production URLs

**Use**:
- Environment variables
- Secret management services (AWS Secrets Manager, etc.)
- `.env.example` for templates

### Network Security

**Firewall Rules**:
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**Rate Limiting**:
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=mcp:10m rate=10r/s;

location / {
    limit_req zone=mcp burst=20;
    proxy_pass http://localhost:3001;
}
```

### Access Control

**IP Whitelisting** (if needed):
```nginx
location / {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://localhost:3001;
}
```

**Authentication** (if needed):
- Add API key validation
- Implement OAuth
- Use VPN

## Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs obscuraswap-mcp

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Systemd Logging

```bash
# View logs
sudo journalctl -u obscuraswap-mcp -f

# View recent logs
sudo journalctl -u obscuraswap-mcp -n 100
```

### Application Logging

Add to `mcp/server/src/index.ts`:

```typescript
// Log all requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log(`[${new Date().toISOString()}] Tool called: ${request.params.name}`);
  // ... existing code
});
```

### Health Monitoring

**Create health check endpoint**:

```bash
# Check if MCP server is responding
curl http://localhost:3001/health
```

**Setup monitoring service**:
- UptimeRobot
- Pingdom
- AWS CloudWatch
- Custom monitoring script

## Backup & Recovery

### Backup Configuration

```bash
# Backup MCP server config
tar -czf mcp-backup-$(date +%Y%m%d).tar.gz \
  mcp/server/.env \
  mcp/server/package.json \
  mcp/server/dist/

# Upload to S3 (example)
aws s3 cp mcp-backup-*.tar.gz s3://your-backup-bucket/
```

### Recovery Procedure

```bash
# Download backup
aws s3 cp s3://your-backup-bucket/mcp-backup-20250122.tar.gz .

# Extract
tar -xzf mcp-backup-20250122.tar.gz

# Restore
cd mcp/server
pnpm install
pm2 restart obscuraswap-mcp
```

## Scaling

### Horizontal Scaling

**Load Balancer** (Nginx):

```nginx
upstream mcp_servers {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://mcp_servers;
    }
}
```

**Start multiple instances**:

```bash
# PM2 cluster mode
pm2 start dist/index.js -i 4 --name obscuraswap-mcp
```

### Vertical Scaling

**Increase resources**:
- More CPU cores
- More RAM
- Faster disk I/O

## Updates & Maintenance

### Update Procedure

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
cd mcp/server
pnpm install

# 3. Build
pnpm build

# 4. Test
cd ../client
pnpm test

# 5. Restart service
pm2 restart obscuraswap-mcp
# or
sudo systemctl restart obscuraswap-mcp
```

### Zero-Downtime Updates

```bash
# Using PM2
pm2 reload obscuraswap-mcp
```

### Rollback Procedure

```bash
# Revert to previous version
git checkout previous-tag
pnpm install
pnpm build
pm2 restart obscuraswap-mcp
```

## Cost Estimation

### Local + Production
- **Cost**: $0 (MCP runs locally)
- **Backend API**: Variable (depends on hosting)

### Remote Server (VPS)
- **Small**: $5-10/month (DigitalOcean, Linode)
- **Medium**: $20-40/month
- **Large**: $80+/month

### Serverless
- **AWS Lambda**: ~$0.20 per 1M requests
- **API Gateway**: ~$1.00 per 1M requests
- **Total**: ~$1.20 per 1M requests

## Troubleshooting Production Issues

### MCP Server Not Starting

```bash
# Check logs
pm2 logs obscuraswap-mcp
# or
sudo journalctl -u obscuraswap-mcp -n 50

# Check port availability
sudo netstat -tulpn | grep 3001

# Check environment variables
pm2 env obscuraswap-mcp
```

### High Memory Usage

```bash
# Check memory
pm2 monit

# Restart if needed
pm2 restart obscuraswap-mcp

# Increase memory limit
pm2 start dist/index.js --max-memory-restart 500M
```

### Connection Issues

```bash
# Test backend API
curl https://api.obscuraswap.com/health

# Test MCP server
cd mcp/client
pnpm test

# Check firewall
sudo ufw status
```

## Best Practices

1. **Use environment variables** for configuration
2. **Enable logging** for debugging
3. **Setup monitoring** for uptime
4. **Regular backups** of configuration
5. **Test updates** before deploying
6. **Use process manager** (PM2, systemd)
7. **Implement rate limiting** if public
8. **Keep dependencies updated**
9. **Monitor resource usage**
10. **Document your setup**

## Checklist

- [ ] Backend API deployed and accessible
- [ ] MCP server built successfully
- [ ] Environment variables configured
- [ ] Process manager setup (PM2/systemd)
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup procedure established
- [ ] Security measures implemented
- [ ] AI assistants configured
- [ ] Testing completed
- [ ] Documentation updated

## Support

For deployment issues:
1. Check logs first
2. Review [MCP_GUIDE.md](../Docs/MCP_GUIDE.md)
3. Test with local setup
4. Check backend API status

---

**Last Updated**: January 2025
**Version**: 1.0.0
