/**
 * Backend Services Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { PQAuthService } from '../src/auth/service.js';
import { BatchBuilder } from '../src/executor/batch.js';

describe('PQAuthService', () => {
  let authService: PQAuthService;

  beforeAll(() => {
    authService = new PQAuthService();
  });

  it('should create auth service instance', () => {
    expect(authService).toBeDefined();
  });

  it('should register a key pool', () => {
    const merkleRoot = new Uint8Array(32).fill(1);
    const params = { w: 16, n: 32, len1: 64, len2: 3, len: 67 };
    
    // registerPool is void, just check it doesn't throw
    expect(() => {
      authService.registerPool(merkleRoot, params, 16, 'test@example.com');
    }).not.toThrow();
  });

  it('should get registered pool', () => {
    const merkleRoot = new Uint8Array(32).fill(2);
    const params = { w: 16, n: 32, len1: 64, len2: 3, len: 67 };
    
    authService.registerPool(merkleRoot, params, 8, 'pool@example.com');
    
    const pool = authService.getPool(merkleRoot);
    expect(pool).toBeDefined();
    expect(pool?.totalKeys).toBe(8);
    expect(pool?.owner).toBe('pool@example.com');
  });

  it('should return undefined for non-existent pool', () => {
    const unknownRoot = new Uint8Array(32).fill(99);
    const pool = authService.getPool(unknownRoot);
    expect(pool).toBeUndefined();
  });

  it('should get all pools', () => {
    const pools = authService.getAllPools();
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThanOrEqual(2); // We registered 2 above
  });
});

describe('BatchBuilder', () => {
  let batchBuilder: BatchBuilder;

  beforeAll(() => {
    batchBuilder = new BatchBuilder({
      maxBatchSize: 10,
      maxWaitTime: 5000,
      minBatchSize: 1,
    });
  });

  it('should create batch builder instance', () => {
    expect(batchBuilder).toBeDefined();
  });

  it('should get total pending count', () => {
    const count = batchBuilder.getTotalPending();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should get pending counts by chain', () => {
    const counts = batchBuilder.getPendingCounts();
    expect(counts).toBeInstanceOf(Map);
  });

  it('should get all pending batches', () => {
    const batches = batchBuilder.getAllPendingBatches();
    expect(Array.isArray(batches)).toBe(true);
  });

  it('should return undefined for non-existent batch', () => {
    const batch = batchBuilder.getBatchById('non-existent');
    expect(batch).toBeUndefined();
  });
});

describe('API Endpoints (Unit)', () => {
  const app = new Hono();
  
  app.get('/', (c) => c.json({
    name: 'Obscura API',
    version: '0.1.0',
  }));

  app.get('/health', (c) => c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }));

  it('should return server info on GET /', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.name).toBe('Obscura API');
    expect(data.version).toBe('0.1.0');
  });

  it('should return health status on GET /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });
});
