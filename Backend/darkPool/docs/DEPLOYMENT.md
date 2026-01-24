# Dark Pool Deployment Guide

Complete guide for deploying the production-ready dark pool backend with Arcium MPC integration.

## Prerequisites

### Required Software

1. **Node.js v18+**
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. **Rust & Solana CLI**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   solana --version
   ```

3. **Arcium CLI**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
   arcium --version
   ```

4. **Redis Server**
   ```bash
   # macOS
   brew install redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

5. **Docker (Optional)**
   - For containerized deployment
   - Install from https://docs.docker.com/get-docker/

### Solana Wallet Setup

1. **Create or import wallet**
   ```bash
   # Create new wallet
   solana-keygen new --outfile ~/.config/solana/id.json
   
   # Or import existing
   solana-keygen recover --outfile ~/.config/solana/id.json
   ```

2. **Set cluster**
   ```bash
   # For devnet
   solana config set --url devnet
   
   # For mainnet
   solana config set --url mainnet-beta
   ```

3. **Fund wallet (devnet only)**
   ```bash
   solana airdrop 2
   ```

## Installation

### 1. Clone and Install Dependencies

```bash
cd Backend/darkPool
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required: Your Solana wallet private key
SOLANA_PRIVATE_KEY=[1,2,3,...]  # Get from solana-keygen

# Required: Solana RPC endpoint
SOLANA_RPC_URL=https://api.devnet.solana.com

# Required: Redis connection
REDIS_URL=redis://localhost:6379

# Optional: API security
API_KEY=your-secret-api-key-change-this
```

### 3. Build Arcium Program

```bash
# Build encrypted instructions and Solana program
npm run build

# This compiles:
# - Rust encrypted instructions (encrypted-ixs/)
# - Solana program (programs/darkpool/)
```

### 4. Deploy to Solana

#### Devnet Deployment

```bash
# Deploy program
npm run deploy:devnet

# Note the program ID from output
# Update ARCIUM_MXE_PROGRAM_ID in .env
```

#### Mainnet Deployment

```bash
# Ensure wallet has sufficient SOL for deployment
solana balance

# Deploy to mainnet
npm run deploy:mainnet

# Update .env with mainnet configuration
```

### 5. Initialize Computation Definitions

After deployment, initialize the encrypted instruction definitions:

```bash
npm run init:comp-defs
```

This creates on-chain accounts for:
- `add_order` - Add encrypted orders to order book
- `match_orders` - Match orders via MPC
- `cancel_order` - Cancel orders securely
- `get_orderbook_depth` - Privacy-preserving order book depth

## Running the Server

### Development Mode

```bash
# Start Redis
redis-server

# Start backend (with auto-reload)
npm run dev
```

### Production Mode

```bash
# Start Redis
redis-server

# Start backend
npm start
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f darkpool

# Stop services
docker-compose down
```

## Verification

### 1. Check Server Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": 1234567890
}
```

### 2. Detailed Health Check

```bash
curl http://localhost:3001/api/health/detailed
```

Should show all services as healthy:
```json
{
  "success": true,
  "health": {
    "server": "healthy",
    "redis": "healthy",
    "solana": "healthy",
    "arcium": "healthy",
    "matchingEngine": "healthy"
  }
}
```

### 3. Test Order Submission

```bash
curl -X POST http://localhost:3001/api/orders/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "type": "limit",
    "side": "buy",
    "tokenPair": "SOL/USDC",
    "price": "100.50",
    "amount": "10.0",
    "userAddress": "YOUR_WALLET_ADDRESS"
  }'
```

### 4. WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3003');

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    channel: 'orderbook',
    tokenPair: 'SOL/USDC'
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Production Checklist

### Security

- [ ] Change default `API_KEY` in `.env`
- [ ] Enable HTTPS/TLS for REST API
- [ ] Enable WSS (WebSocket Secure)
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable DDoS protection
- [ ] Rotate Solana wallet keys regularly
- [ ] Use hardware wallet for mainnet

### Infrastructure

- [ ] Set up load balancer
- [ ] Configure Redis cluster/replication
- [ ] Set up backup and recovery
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Configure auto-scaling
- [ ] Set up CDN for static assets

### Monitoring

- [ ] Set up Prometheus/Grafana
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure log rotation
- [ ] Set up performance monitoring
- [ ] Configure alerting thresholds

### Testing

- [ ] Run integration tests
- [ ] Perform load testing
- [ ] Test failover scenarios
- [ ] Verify order matching accuracy
- [ ] Test WebSocket reconnection
- [ ] Verify encryption/decryption

## Monitoring

### Metrics Endpoint

```bash
curl http://localhost:3001/api/health/metrics
```

Returns:
- Active orders count
- Matched trades count
- Average matching time
- WebSocket connections
- Memory usage
- Uptime

### Logs

```bash
# View logs
tail -f logs/darkpool.log

# Docker logs
docker-compose logs -f darkpool
```

## Troubleshooting

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Check Redis connection
redis-cli -h localhost -p 6379
```

### Arcium MPC Timeout

```bash
# Check Arcium cluster status
arcium cluster status

# Verify program deployment
solana program show PROGRAM_ID
```

### WebSocket Connection Issues

```bash
# Check port is open
netstat -an | grep 3003

# Test WebSocket connection
wscat -c ws://localhost:3003
```

### Solana RPC Issues

```bash
# Test RPC connection
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check wallet balance
solana balance
```

## Scaling

### Horizontal Scaling

1. **Multiple API Instances**
   - Deploy multiple backend instances
   - Use load balancer (nginx, HAProxy)
   - Share Redis instance

2. **Redis Cluster**
   - Set up Redis cluster for high availability
   - Configure Redis Sentinel for failover

3. **WebSocket Scaling**
   - Use Redis pub/sub for WebSocket broadcasting
   - Deploy separate WebSocket servers

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize Redis memory settings
- Tune Node.js heap size

## Backup and Recovery

### Database Backup

```bash
# Backup Redis data
redis-cli BGSAVE

# Copy backup
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb
```

### Wallet Backup

```bash
# Backup Solana wallet
cp ~/.config/solana/id.json /secure/backup/wallet-backup.json

# Encrypt backup
gpg -c /secure/backup/wallet-backup.json
```

### Recovery

```bash
# Restore Redis
redis-cli SHUTDOWN
cp /backup/redis-20240124.rdb /var/lib/redis/dump.rdb
redis-server

# Restore wallet
cp /secure/backup/wallet-backup.json ~/.config/solana/id.json
```

## Support

- **Documentation**: See `README.md` and `resources.md`
- **Arcium Docs**: https://docs.arcium.com
- **Discord**: https://discord.gg/arcium
- **GitHub Issues**: Report bugs and feature requests

## License

MIT
