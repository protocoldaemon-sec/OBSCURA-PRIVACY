# Quick Start Guide

Get the Dark Pool backend running in 5 minutes.

## Prerequisites

- Node.js 18+
- Redis server
- Solana CLI
- Arcium CLI

## Installation

### 1. Install Arcium CLI

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

### 2. Install Dependencies

```bash
cd Backend/darkPool
npm install
```

### 3. Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your Solana private key:

```bash
SOLANA_PRIVATE_KEY=[1,2,3,...]  # Your wallet private key
```

Get your private key:
```bash
cat ~/.config/solana/id.json
```

### 5. Build & Deploy

```bash
# Build Arcium program
npm run build

# Deploy to devnet
npm run deploy:devnet

# Initialize computation definitions
npm run init:comp-defs
```

### 6. Start Server

```bash
npm start
```

Server will start on:
- REST API: http://localhost:3001
- WebSocket: ws://localhost:3003

## Verify Installation

### Check Health

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

### Run Tests

```bash
node test-api.js
```

## Submit Your First Order

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

## WebSocket Example

```javascript
const ws = new WebSocket('ws://localhost:3003');

ws.onopen = () => {
  // Subscribe to order book
  ws.send(JSON.stringify({
    action: 'subscribe',
    channel: 'orderbook',
    tokenPair: 'SOL/USDC'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Common Issues

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Port Already in Use

```bash
# Change port in .env
PORT=3002
WS_PORT=3004
```

### Arcium Build Failed

```bash
# Ensure Arcium CLI is installed
arcium --version

# Update Arcium
arcup update
```

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Read [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) for operations
- Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture
- Check [README.md](./README.md) for API documentation

## Support

- Arcium Docs: https://docs.arcium.com
- Discord: https://discord.gg/arcium
- GitHub Issues: Report bugs

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Docker Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

That's it! Your Dark Pool backend is now running with encrypted order matching via Arcium MPC. 🚀
