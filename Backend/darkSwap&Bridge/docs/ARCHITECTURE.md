# Architecture Documentation

## Overview

The darkSwap & Bridge backend is a Node.js/Express REST API that provides cross-chain bridging and private swap functionality using the SilentSwap SDK.

## Technology Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **SDK**: @silentswap/sdk
- **Blockchain Libraries**: 
  - viem (EVM interactions)
  - @solana/web3.js (Solana support)
- **Utilities**: BigNumber.js, dotenv

## Project Structure

```
Backend/darkSwap&Bridge/
├── src/
│   ├── config/
│   │   └── index.js              # Configuration management & validation
│   │
│   ├── middleware/
│   │   ├── auth.js               # API key authentication
│   │   └── errorHandler.js       # Global error handling
│   │
│   ├── routes/
│   │   ├── health.js             # Health check endpoints
│   │   ├── bridge.js             # Bridge operation endpoints
│   │   └── swap.js               # Silent swap endpoints
│   │
│   ├── services/
│   │   ├── bridgeService.js      # Bridge business logic
│   │   └── silentSwapService.js  # Silent swap business logic
│   │
│   ├── utils/
│   │   └── clients.js            # Client initialization utilities
│   │
│   └── server.js                 # Express app setup & startup
│
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── .gitignore
├── package.json
├── README.md                     # Main documentation
├── QUICKSTART.md                 # Quick start guide
├── ARCHITECTURE.md               # This file
├── postman_collection.json       # Postman API collection
├── test-api.js                   # API test script
└── resources.md                  # SilentSwap SDK documentation
```

## Architecture Layers

### 1. API Layer (Routes)

**Responsibilities:**
- HTTP request/response handling
- Input validation
- Route definition
- Response formatting

**Files:**
- `src/routes/health.js` - Health check
- `src/routes/bridge.js` - Bridge operations
- `src/routes/swap.js` - Silent swap operations

### 2. Service Layer

**Responsibilities:**
- Business logic implementation
- SDK integration
- Transaction orchestration
- Error handling

**Files:**
- `src/services/bridgeService.js` - Bridge logic
- `src/services/silentSwapService.js` - Swap logic

### 3. Middleware Layer

**Responsibilities:**
- Request preprocessing
- Authentication
- Error handling
- Logging

**Files:**
- `src/middleware/auth.js` - API key auth
- `src/middleware/errorHandler.js` - Error handling

### 4. Utility Layer

**Responsibilities:**
- Client initialization
- Helper functions
- Configuration management

**Files:**
- `src/utils/clients.js` - Client factories
- `src/config/index.js` - Configuration

## Data Flow

### Bridge Quote Request Flow

```
Client Request
    ↓
Express Router (bridge.js)
    ↓
Input Validation
    ↓
Bridge Service (bridgeService.js)
    ↓
SilentSwap SDK (getBridgeQuote)
    ↓
Multiple Bridge Providers (Relay, deBridge)
    ↓
Best Quote Selection
    ↓
Response Formatting
    ↓
Client Response
```

### Silent Swap Execution Flow

```
Client Request
    ↓
Express Router (swap.js)
    ↓
Input Validation
    ↓
Silent Swap Service (silentSwapService.js)
    ↓
1. Authentication & Entropy Derivation
    ↓
2. Facilitator Group Creation
    ↓
3. Quote Request
    ↓
4. Order Creation & Signing
    ↓
5. Deposit Transaction Execution
    ↓
Response with Transaction Hash
    ↓
Client Response
```

## Key Components

### Configuration Management

**File**: `src/config/index.js`

Manages environment variables and validates required configuration:
- EVM private key (required)
- RPC URLs (with defaults)
- SilentSwap API settings
- Security settings

### Client Factories

**File**: `src/utils/clients.js`

Creates and configures blockchain clients:
- **EVM Clients**: Ethereum, Avalanche wallet clients
- **Solana Client**: Solana connection and keypair
- **SilentSwap Client**: SDK client instance

### Bridge Service

**File**: `src/services/bridgeService.js`

Provides bridge operations:
- `getQuote()` - Compare providers and get best quote
- `executeBridge()` - Execute bridge transaction
- `checkStatus()` - Check transaction status
- `solveUsdcAmount()` - Calculate optimal USDC amount
- `pollBridgeStatus()` - Poll until completion

### Silent Swap Service

**File**: `src/services/silentSwapService.js`

Provides swap operations:
- `authenticateAndDeriveEntropy()` - User authentication
- `createFacilitatorGroup()` - HD wallet generation
- `getSwapQuote()` - Get swap quote
- `createOrder()` - Create and sign order
- `executeDeposit()` - Execute deposit transaction
- `executeSilentSwap()` - Complete swap flow

## Security Considerations

### Authentication

- Optional API key authentication via `X-API-Key` header
- Configurable via `API_KEY` environment variable
- Middleware: `src/middleware/auth.js`

### Private Key Management

- Private keys stored in environment variables
- Never logged or exposed in responses
- Used only for transaction signing

### Error Handling

- Global error handler catches all errors
- Sensitive information filtered from responses
- Stack traces only in development mode

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Bridge Operations
- `POST /api/bridge/quote` - Get bridge quote
- `POST /api/bridge/execute` - Execute bridge
- `GET /api/bridge/status/:requestId` - Check status
- `POST /api/bridge/solve-usdc` - Solve optimal USDC
- `POST /api/bridge/poll-status` - Poll status

### Silent Swap Operations
- `POST /api/swap/quote` - Get swap quote
- `POST /api/swap/execute` - Execute swap

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Environment Variables

### Required
- `EVM_PRIVATE_KEY` - EVM wallet private key

### Optional
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `EVM_RPC_URL_ETHEREUM` - Ethereum RPC URL
- `EVM_RPC_URL_AVALANCHE` - Avalanche RPC URL
- `SOLANA_SECRET_KEY` - Solana keypair (for Solana swaps)
- `SOLANA_RPC_URL` - Solana RPC URL
- `SILENTSWAP_API_URL` - SilentSwap API URL
- `SILENTSWAP_ENVIRONMENT` - mainnet/testnet
- `API_KEY` - API authentication key

## Deployment Considerations

### Production Checklist

1. **Security**
   - [ ] Enable API key authentication
   - [ ] Use HTTPS
   - [ ] Secure private key storage (e.g., AWS Secrets Manager)
   - [ ] Implement rate limiting
   - [ ] Add request logging

2. **Performance**
   - [ ] Use production RPC endpoints (Alchemy, Infura)
   - [ ] Implement caching for quotes
   - [ ] Add connection pooling
   - [ ] Monitor API response times

3. **Reliability**
   - [ ] Add health checks
   - [ ] Implement retry logic
   - [ ] Set up monitoring/alerting
   - [ ] Add request timeouts
   - [ ] Implement circuit breakers

4. **Scalability**
   - [ ] Use load balancer
   - [ ] Implement horizontal scaling
   - [ ] Add queue for long-running operations
   - [ ] Cache frequently accessed data

## Testing

### Manual Testing
```bash
node test-api.js
```

### Using Postman
Import `postman_collection.json` into Postman

### Using curl
See examples in `QUICKSTART.md`

## Monitoring

### Health Check
Monitor `/api/health` endpoint for:
- Server status
- Uptime
- Timestamp

### Logging
All requests logged with:
- Timestamp
- HTTP method
- Path

### Error Tracking
Errors logged with:
- Error message
- Stack trace (development only)
- Request context

## Future Enhancements

1. **Database Integration**
   - Store transaction history
   - Cache quotes
   - User management

2. **WebSocket Support**
   - Real-time status updates
   - Live quote streaming

3. **Advanced Features**
   - Multi-hop routing
   - Gas optimization
   - Batch operations

4. **Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Error tracking (Sentry)

5. **Testing**
   - Unit tests
   - Integration tests
   - Load testing

## Support & Resources

- **SilentSwap SDK**: https://docs.silentswap.com
- **Viem Documentation**: https://viem.sh
- **Express.js**: https://expressjs.com
- **Project Resources**: See `resources.md`
