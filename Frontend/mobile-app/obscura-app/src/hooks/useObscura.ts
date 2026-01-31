/**
 * React hooks for Obscura API
 */

import { useState, useCallback } from 'react';
import { obscuraClient, TransferRequest, SwapRequest, IntentResponse } from '../api/client';

export function useHealth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await obscuraClient.health();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkHealth, loading, error, data };
}

export function useTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentResponse | null>(null);

  const transfer = useCallback(async (params: TransferRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await obscuraClient.transfer(params);
      setIntent(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { transfer, loading, error, intent };
}

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentResponse | null>(null);

  const swap = useCallback(async (params: SwapRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await obscuraClient.swap(params);
      setIntent(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { swap, loading, error, intent };
}

export function useIntentStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  const getStatus = useCallback(async (intentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await obscuraClient.getIntent(intentId);
      setStatus(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getStatus, loading, error, status };
}

export function useQuotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);

  const getQuotes = useCallback(async (params: {
    sourceChain: string;
    targetChain: string;
    inputAsset: string;
    outputAsset: string;
    amount: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await obscuraClient.getQuotes(params);
      setQuotes(result.quotes || []);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getQuotes, loading, error, quotes };
}
