'use client'

import { ActivityItem } from '../DashboardLayout'
import { TOKEN_LOGOS } from '@/lib/logos'

interface Props {
  stats: {
    healthStatus: string
    healthTime: string
    batchCount: number
    poolCount: number
    apiVersion: string
    walletBalance: string
    tokenType: 'SOL' | 'ETH' | null
  }
  activityLog: ActivityItem[]
  onRefresh: () => void
}

export default function DashboardSection({ stats, activityLog, onRefresh }: Props) {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Dashboard</h2>
        <p className="text-gray-400">Monitor your settlement activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <WalletBalanceCard balance={stats.walletBalance} tokenType={stats.tokenType} />
        <StatCard label="Server Status" value={stats.healthStatus} meta={stats.healthTime} />
        <StatCard label="Pending Batches" value={stats.batchCount.toString()} meta="Ready for settlement" />
        <StatCard label="API Version" value={stats.apiVersion} meta="Obscura API" />
      </div>

      {/* Activity Log */}
      <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a3a]">
          <h3 className="font-semibold">Recent Activity</h3>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
          >
            Refresh
          </button>
        </div>
        <div className="p-6 min-h-[200px]">
          {activityLog.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No recent activity</div>
          ) : (
            <div className="space-y-4">
              {activityLog.map((item, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-[#2a2a3a] last:border-0">
                  <div className="w-10 h-10 bg-[#12121a] rounded-lg flex items-center justify-center text-sm font-medium">
                    {item.type[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium capitalize">{item.type}</div>
                    <div className="text-sm text-gray-500">
                      ID: {item.id && item.id.length > 20 ? `${item.id.substring(0, 8)}...${item.id.slice(-8)}` : item.id || 'N/A'} | {item.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value, meta, highlight }: { label: string; value: string; meta: string; highlight?: boolean }) {
  return (
    <div className={`bg-[#1a1a24] border rounded-xl p-6 ${highlight ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/5 to-transparent' : 'border-[#2a2a3a]'}`}>
      <div className="text-sm text-gray-500 mb-2">{label}</div>
      <div className={`text-3xl font-semibold mb-1 ${highlight ? 'text-cyan-400' : ''}`}>{value}</div>
      <div className="text-xs text-gray-500">{meta}</div>
    </div>
  )
}

function WalletBalanceCard({ balance, tokenType }: { balance: string; tokenType: 'SOL' | 'ETH' | null }) {
  const logo = tokenType === 'ETH' ? TOKEN_LOGOS.ETH : TOKEN_LOGOS.SOL
  const tokenLabel = tokenType || 'SOL'
  
  return (
    <div className="bg-[#1a1a24] border border-cyan-500/50 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-xl p-6">
      <div className="text-sm text-gray-500 mb-2">Wallet Balance</div>
      <div className="flex items-center gap-2 text-3xl font-semibold mb-1 text-cyan-400">
        <img src={logo} alt={tokenLabel} className="w-7 h-7 rounded-full" />
        <span>{balance}</span>
      </div>
      <div className="text-xs text-gray-500">Connected wallet</div>
    </div>
  )
}
