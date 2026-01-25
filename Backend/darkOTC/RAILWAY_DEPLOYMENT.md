# Railway Deployment Guide

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway
- Supabase project for database

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Connect Repository to Railway**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `obscura-dark-otc-be` repository
   - Railway will auto-detect Dockerfile

2. **Configure Environment Variables**
   
   Go to your project settings and add these variables:

   ```env
   # Server
   PORT=3000
   NODE_ENV=production
   CORS_ORIGINS=https://your-frontend.com,https://your-frontend-2.com
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Solana
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_NETWORK=devnet
   
   # Ethereum
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-infura-key
   SEPOLIA_CHAIN_ID=11155111
   
   # Obscura-LLMS
   OBSCURA_LLMS_BASE_URL=https://obscura-api.daemonprotocol.com
   
   # Arcium
   ARCIUM_CLUSTER_OFFSET=456
   ARCIUM_PROGRAM_ID=arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg
   
   # Light Protocol
   LIGHT_PROTOCOL_ENABLED=true
   LIGHT_PROTOCOL_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-key
   
   # Whitelist
   WHITELIST_MODE=permissionless
   
   # Admin
   ADMIN_PUBLIC_KEY=your-admin-public-key
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Wait for build to complete (~3-5 minutes)
   - Check deployment logs for any errors

4. **Verify Deployment**
   ```bash
   curl https://your-app.railway.app/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": 1737640000000,
     "uptime": 123.456
   }
   ```

### Option 2: Deploy with Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Link to Existing Project (Optional)**
   ```bash
   railway link
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set PORT=3000
   railway variables set NODE_ENV=production
   # ... set all other variables
   ```

6. **Deploy**
   ```bash
   railway up
   ```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | `eyJhbGc...` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `OBSCURA_LLMS_BASE_URL` | Obscura API URL | `https://obscura-api.daemonprotocol.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `WHITELIST_MODE` | Whitelist mode | `permissionless` |
| `LIGHT_PROTOCOL_ENABLED` | Enable ZK compression | `true` |

## Database Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for provisioning (~2 minutes)

2. **Run Migrations**
   - Go to SQL Editor in Supabase dashboard
   - Copy SQL from `README.md` Database Setup section
   - Execute SQL

3. **Get Connection Details**
   - Go to Project Settings > API
   - Copy `URL` and `service_role` key
   - Add to Railway environment variables

## Custom Domain (Optional)

1. **Add Custom Domain in Railway**
   - Go to project settings
   - Click "Domains"
   - Add your domain
   - Copy CNAME record

2. **Configure DNS**
   - Add CNAME record to your DNS provider
   - Point to Railway's domain
   - Wait for DNS propagation (~5-60 minutes)

3. **Update CORS**
   ```bash
   railway variables set CORS_ORIGINS=https://yourdomain.com
   ```

## Monitoring

### Health Check

Railway automatically monitors `/health` endpoint:
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3

### View Logs

**Via Dashboard:**
- Go to your project
- Click "Deployments"
- Click on active deployment
- View logs in real-time

**Via CLI:**
```bash
railway logs
```

### Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count

## Troubleshooting

### Build Fails

**Error: `npm ci` fails**
```bash
# Solution: Check package-lock.json is committed
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

**Error: TypeScript build fails**
```bash
# Solution: Check tsconfig.json is correct
npm run build  # Test locally first
```

### Deployment Fails

**Error: Health check timeout**
```bash
# Solution: Check PORT environment variable
railway variables set PORT=3000

# Check application starts correctly
railway logs
```

**Error: Database connection fails**
```bash
# Solution: Verify Supabase credentials
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Runtime Errors

**Error: CORS issues**
```bash
# Solution: Add frontend domain to CORS_ORIGINS
railway variables set CORS_ORIGINS=https://your-frontend.com
```

**Error: RPC connection fails**
```bash
# Solution: Check RPC URLs are accessible
curl https://api.devnet.solana.com
```

## Scaling

### Vertical Scaling

Railway automatically scales based on usage:
- Starter: 512MB RAM, 0.5 vCPU
- Pro: Up to 32GB RAM, 8 vCPU

### Horizontal Scaling

For high traffic:
1. Enable multiple replicas in Railway dashboard
2. Railway handles load balancing automatically

## CI/CD

Railway automatically deploys on:
- Push to `main` branch
- Pull request merge
- Manual trigger

### Disable Auto-Deploy

```bash
railway environment
# Select environment
# Disable auto-deploy in settings
```

### Manual Deploy

```bash
railway up --detach
```

## Rollback

### Via Dashboard

1. Go to "Deployments"
2. Find previous successful deployment
3. Click "Redeploy"

### Via CLI

```bash
railway rollback
```

## Cost Estimation

Railway pricing (as of 2024):

**Starter Plan (Free):**
- $5 free credit/month
- 512MB RAM
- 1GB disk
- Good for development

**Pro Plan ($20/month):**
- $20 credit included
- Usage-based pricing
- Up to 32GB RAM
- Up to 100GB disk

**Estimated costs for this app:**
- Development: Free tier sufficient
- Production (low traffic): ~$5-10/month
- Production (high traffic): ~$20-50/month

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to git
   - Use Railway's encrypted variables
   - Rotate keys regularly

2. **Database**
   - Use Supabase Row Level Security
   - Enable SSL connections
   - Regular backups

3. **API**
   - Enable rate limiting
   - Use HTTPS only
   - Validate all inputs

4. **Monitoring**
   - Set up error alerts
   - Monitor logs regularly
   - Track API usage

## Support

**Railway Support:**
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Email: team@railway.app

**Project Issues:**
- GitHub: https://github.com/fikriaf/obscura-dark-otc-be/issues

## Checklist

Before deploying to production:

- [ ] Database migrations executed
- [ ] All environment variables set
- [ ] Health check endpoint working
- [ ] CORS configured correctly
- [ ] Admin public key configured
- [ ] RPC endpoints accessible
- [ ] Supabase connection verified
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Next Steps

After successful deployment:

1. Test all API endpoints
2. Configure frontend to use production URL
3. Set up monitoring and alerts
4. Document production URLs
5. Create backup schedule
6. Plan scaling strategy

## Production URL

After deployment, your API will be available at:
```
https://your-app-name.railway.app
```

Update this in:
- Frontend configuration
- Documentation
- API clients
- Third-party integrations
