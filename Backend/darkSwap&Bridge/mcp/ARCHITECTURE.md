# MCP Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Assistant Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Claude    │  │     Kiro     │  │    Custom    │          │
│  │   Desktop    │  │     IDE      │  │  MCP Client  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │    MCP Protocol (stdio)             │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────────┐
│                      MCP Server Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Obscura Swap MCP Server                     │   │
│  │                  (Node.js + TypeScript)                  │   │
│  │                                                          │   │
│  │  Tools:                                                  │   │
│  │  ├─ get_health              Check API status            │   │
│  │  ├─ get_supported_assets    List chains & tokens        │   │
│  │  ├─ get_swap_quote          Get best quote              │   │
│  │  └─ get_chain_info          Chain details               │   │
│  └──────────────────┬───────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │    HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Backend API Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Obscura Swap Backend API                    │   │
│  │                  (Express + Node.js)                     │   │
│  │                                                          │   │
│  │  Endpoints:                                              │   │
│  │  ├─ GET  /health                                         │   │
│  │  ├─ GET  /api/swap/assets                               │   │
│  │  ├─ GET  /api/swap/quote                                │   │
│  │  └─ POST /api/webhooks/swap-status                      │   │
│  └──────────────────┬───────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │    SDK Integration
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   SilentSwap SDK Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  @silentswap/sdk                         │   │
│  │                                                          │   │
│  │  Features:                                               │   │
│  │  ├─ Simple Bridge (cross-chain transfers)               │   │
│  │  ├─ Silent Swap (private swaps)                         │   │
│  │  ├─ Multi-chain support                                 │   │
│  │  └─ Provider comparison (Relay.link, deBridge)          │   │
│  └──────────────────┬───────────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      │    Bridge APIs
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                  External Bridge Providers                       │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │  Relay.link  │              │   deBridge   │                 │
│  └──────────────┘              └──────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Example: Get Swap Quote

```
1. User asks AI:
   "Get me a quote to swap 1 USDC from Ethereum to Avalanche"
   
2. AI Assistant:
   ├─ Parses user intent
   ├─ Identifies required tool: get_swap_quote
   └─ Prepares parameters:
      ├─ fromChainId: 1 (Ethereum)
      ├─ toChainId: 43114 (Avalanche)
      ├─ fromToken: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
      ├─ toToken: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
      ├─ amount: "1000000"
      └─ userAddress: 0x...

3. MCP Server:
   ├─ Receives tool call via stdio
   ├─ Validates parameters
   └─ Makes HTTP request to backend:
      GET /api/swap/quote?fromChainId=1&toChainId=43114&...

4. Backend API:
   ├─ Receives HTTP request
   ├─ Calls SilentSwap SDK
   └─ Returns quote data

5. SilentSwap SDK:
   ├─ Queries Relay.link API
   ├─ Queries deBridge API
   ├─ Compares quotes
   └─ Returns best quote

6. Response flows back:
   Backend → MCP Server → AI Assistant → User

7. AI presents result:
   "Here's your quote:
    - Provider: relay
    - Output: 0.995 USDC
    - Fee: $0.50
    - Retention: 99.5%
    - Time: ~3 minutes"
```

## Component Details

### MCP Server

**Location**: `mcp/server/`

**Technology**:
- TypeScript
- @modelcontextprotocol/sdk
- Axios for HTTP
- stdio transport

**Responsibilities**:
- Expose tools to AI assistants
- Validate tool parameters
- Make HTTP requests to backend
- Format responses
- Handle errors

**Tools**:
1. `get_health` - No params
2. `get_supported_assets` - No params
3. `get_swap_quote` - 6 params
4. `get_chain_info` - 1 param

### MCP Client

**Location**: `mcp/client/`

**Technology**:
- TypeScript
- @modelcontextprotocol/sdk
- stdio transport

**Responsibilities**:
- Connect to MCP server
- Test tool functionality
- Provide usage examples
- Automated testing

**Features**:
- Connection management
- Tool wrappers
- Error handling
- Test suite

### Backend API

**Location**: `backend/`

**Technology**:
- Node.js + Express
- @silentswap/sdk
- viem for blockchain

**Responsibilities**:
- REST API endpoints
- SDK integration
- Business logic
- Error handling

**Endpoints**:
- `/health` - Health check
- `/api/swap/assets` - List assets
- `/api/swap/quote` - Get quote
- `/api/webhooks/swap-status` - Webhooks

## Communication Protocols

### MCP Protocol (stdio)

```
AI Assistant ←→ MCP Server
     │              │
     │   Request    │
     ├─────────────→│
     │              │
     │   Response   │
     │←─────────────┤
     │              │
```

**Format**: JSON-RPC over stdio

**Example Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_swap_quote",
    "arguments": {
      "fromChainId": 1,
      "toChainId": 43114,
      "fromToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "toToken": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      "amount": "1000000",
      "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

**Example Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"provider\":\"relay\",\"outputAmount\":\"995000\",...}"
      }
    ]
  }
}
```

### HTTP/REST (Backend)

```
MCP Server ←→ Backend API
     │              │
     │   GET/POST   │
     ├─────────────→│
     │              │
     │     JSON     │
     │←─────────────┤
     │              │
```

**Format**: HTTP with JSON

**Example Request**:
```http
GET /api/swap/quote?fromChainId=1&toChainId=43114&... HTTP/1.1
Host: localhost:3000
```

**Example Response**:
```json
{
  "provider": "relay",
  "outputAmount": "995000",
  "inputAmount": "1000000",
  "feeUsd": 0.5,
  "slippage": 0.5,
  "estimatedTime": 180,
  "retentionRate": 0.995,
  "txCount": 1
}
```

## Deployment Architectures

### Architecture 1: Local Development

```
┌──────────────┐
│ AI Assistant │ (Local)
└──────┬───────┘
       │
┌──────▼───────┐
│  MCP Server  │ (Local)
└──────┬───────┘
       │
┌──────▼───────┐
│ Backend API  │ (Local: localhost:3000)
└──────┬───────┘
       │
┌──────▼───────┐
│ SilentSwap   │ (STAGING)
└──────────────┘
```

### Architecture 2: Production (Local MCP)

```
┌──────────────┐
│ AI Assistant │ (Local)
└──────┬───────┘
       │
┌──────▼───────┐
│  MCP Server  │ (Local)
└──────┬───────┘
       │
       │ HTTPS
       │
┌──────▼───────┐
│ Backend API  │ (Production: api.obscuraswap.com)
└──────┬───────┘
       │
┌──────▼───────┐
│ SilentSwap   │ (PRODUCTION)
└──────────────┘
```

### Architecture 3: Production (Remote MCP)

```
┌──────────────┐
│ AI Assistant │ (Local)
└──────┬───────┘
       │
       │ Network
       │
┌──────▼───────┐
│  MCP Server  │ (Remote: mcp.obscuraswap.com)
└──────┬───────┘
       │
┌──────▼───────┐
│ Backend API  │ (Production: api.obscuraswap.com)
└──────┬───────┘
       │
┌──────▼───────┐
│ SilentSwap   │ (PRODUCTION)
└──────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│                  Security Layer 1                    │
│              AI Assistant Permissions                │
│  - Tool approval required                           │
│  - User confirmation for sensitive operations       │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                  Security Layer 2                    │
│                MCP Server Validation                 │
│  - Parameter validation                             │
│  - Type checking                                    │
│  - Error handling                                   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                  Security Layer 3                    │
│              Backend API Security                    │
│  - CORS enabled                                     │
│  - Rate limiting                                    │
│  - Input validation                                 │
│  - Error handling                                   │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                  Security Layer 4                    │
│              SilentSwap SDK Security                 │
│  - Non-custodial                                    │
│  - TEE protected                                    │
│  - OFAC compliant                                   │
│  - Audited contracts                                │
└─────────────────────────────────────────────────────┘
```

## Performance Characteristics

### Latency

```
User Query → AI Processing → MCP Call → Backend API → SDK → Providers
   ~0ms         ~1-2s          ~10ms      ~50ms      ~100ms   ~500ms
                                                              
Total: ~1.5-2.5 seconds for typical query
```

### Throughput

- **MCP Server**: Handles 1 request at a time (stdio)
- **Backend API**: Concurrent requests supported
- **Rate Limiting**: Handled by backend

### Scalability

- **Horizontal**: Multiple MCP server instances
- **Vertical**: Increase backend resources
- **Caching**: Backend can cache asset lists

## Error Handling Flow

```
Error Occurs
     │
     ├─ Provider API Error
     │  └─ SDK handles fallback
     │     └─ Backend returns error
     │        └─ MCP formats error
     │           └─ AI explains to user
     │
     ├─ Backend API Error
     │  └─ MCP catches error
     │     └─ Returns formatted error
     │        └─ AI explains to user
     │
     └─ MCP Server Error
        └─ AI assistant shows error
           └─ User sees friendly message
```

## Monitoring Points

```
┌─────────────────┐
│  AI Assistant   │ ← User feedback
└────────┬────────┘
         │
┌────────▼────────┐
│   MCP Server    │ ← stderr logs
└────────┬────────┘
         │
┌────────▼────────┐
│  Backend API    │ ← Application logs
└────────┬────────┘
         │
┌────────▼────────┐
│  SilentSwap     │ ← Transaction logs
└─────────────────┘
```

## Summary

The MCP architecture provides:

✅ **Separation of Concerns**
- AI layer handles user interaction
- MCP layer handles protocol
- Backend layer handles business logic
- SDK layer handles blockchain

✅ **Flexibility**
- Multiple AI assistants supported
- Multiple deployment options
- Easy to extend with new tools

✅ **Security**
- Multiple security layers
- Read-only operations
- No private keys exposed

✅ **Performance**
- Fast response times
- Efficient caching
- Scalable architecture

✅ **Maintainability**
- Clear separation
- Well documented
- Easy to test

---

**Architecture Version**: 1.0.0
**Last Updated**: January 2025
