'use client';

import React from 'react';
import { useBalancesContext, usePricesContext, useOrdersContext, formatBalance } from '@silentswap/react';

export function UserPortfolio() {
  const { balances, loading, totalUsdValue, refetch } = useBalancesContext();
  const { prices } = usePricesContext();
  const { orders } = useOrdersContext();

  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 rounded-2xl text-white">
        <p>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl text-white space-y-6">
      {/* Portfolio Summary */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Your Portfolio</h3>
        <div className="text-right">
          <p className="text-3xl font-bold text-yellow">${totalUsdValue.toFixed(2)}</p>
          <button 
            onClick={refetch}
            className="text-sm text-zinc-400 hover:text-white mt-1"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(balances).map((info) => (
          <div 
            key={info.asset.caip19} 
            className="p-4 bg-zinc-800 rounded-xl border border-zinc-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{info.asset.symbol}</p>
                <p className="text-sm text-zinc-400">{info.asset.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">{formatBalance(info.balance, info.asset)}</p>
                <p className="text-sm text-zinc-400">${info.usdValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-zinc-400 text-sm">No recent orders</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li 
                key={order.orderId} 
                className="p-3 bg-zinc-800 rounded-lg flex justify-between items-center"
              >
                <span className="font-mono text-sm">
                  {order.orderId.slice(0, 8)}...{order.orderId.slice(-8)}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  order.status === 'complete' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow/20 text-yellow'
                }`}>
                  {order.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
