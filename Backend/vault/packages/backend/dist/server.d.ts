/**
 * Winternitz-SIP API Server
 *
 * REST API endpoints for privacy-preserving intent settlement
 * Built with Hono for lightweight, high-performance routing
 */
import { Hono } from 'hono';
import type { QuoteRequest } from './types.js';
declare const app: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
declare module './executor/index.js' {
    interface Aggregator {
        getIntentStatus(intentId: string): any;
        getPendingBatches(): any[];
        getBatch(batchId: string): any;
        getQuotes(request: QuoteRequest): Promise<any[]>;
    }
}
export { app };
//# sourceMappingURL=server.d.ts.map