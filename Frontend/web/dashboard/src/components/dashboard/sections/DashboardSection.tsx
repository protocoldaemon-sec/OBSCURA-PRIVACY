'use client'

import { useState, useEffect, useRef } from 'react'
import { ActivityItem } from '../DashboardLayout'
import { TOKEN_LOGOS } from '@/lib/logos'

interface Props {
  stats: {
    healthStatus: string
    healthTime: string
    solanaConfigured: boolean
    evmConfigured: boolean
    totalDeposits: number
    totalWithdrawals: number
    pendingRequests: number
    apiVersion: string
    walletBalance: string
    tokenType: 'SOL' | 'ETH' | null
  }
  activityLog: ActivityItem[]
  onRefresh: () => void
  onNavigate?: (section: 'dark-otc') => void
}

interface PricePoint {
  time: number
  price: number
  timestamp: string
}

export default function DashboardSection({ stats, activityLog, onRefresh, onNavigate }: Props) {
  const [solPrice, setSolPrice] = useState<number>(0)
  const [solChange, setSolChange] = useState<number>(0)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null)
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const chartRef = useRef<SVGSVGElement>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)

  // Fetch quote requests from Dark OTC API
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_DARK_OTC_API || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/v1/rfq/quote-requests`)
        const data = await response.json()
        
        if (data.success && data.data?.quoteRequests) {
          // Get latest 10 requests (most recent first)
          const latest = data.data.quoteRequests.slice(0, 10)
          setQuoteRequests(latest)
        } else {
          setQuoteRequests([])
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch quotes:', error)
        setQuoteRequests([])
      }
    }

    fetchQuotes()
    const interval = setInterval(fetchQuotes, 10000)
    return () => clearInterval(interval)
  }, [])

  // Load SOL price and history
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDC')
        const data = await response.json()
        setSolPrice(parseFloat(data.lastPrice))
        setSolChange(parseFloat(data.priceChangePercent))
      } catch (error) {
        console.error('[Dashboard] Failed to fetch SOL price:', error)
      }
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/klines?symbol=SOLUSDC&interval=15m&limit=96')
        const data = await response.json()
        const history: PricePoint[] = data.map((candle: any) => ({
          time: candle[0],
          price: parseFloat(candle[4]),
          timestamp: new Date(candle[0]).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }))
        setPriceHistory(history)
      } catch (error) {
        console.error('[Dashboard] Failed to fetch price history:', error)
      }
    }

    fetchPrice()
    fetchHistory()
    const interval = setInterval(() => {
      fetchPrice()
      fetchHistory()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle chart hover
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current || priceHistory.length === 0) return
    
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Find closest point
    const chartWidth = rect.width
    const pointIndex = Math.round((x / chartWidth) * (priceHistory.length - 1))
    const clampedIndex = Math.max(0, Math.min(pointIndex, priceHistory.length - 1))
    
    setHoveredPoint(priceHistory[clampedIndex])
    setMousePosition({ x: e.clientX, y: e.clientY })
  }

  const handleChartMouseLeave = () => {
    setHoveredPoint(null)
    setMousePosition(null)
  }

  // Get last activity
  const lastActivity = activityLog.length > 0 ? activityLog[0] : null
  
  // Calculate activity counts for bar chart
  const activityCounts = activityLog.reduce((acc, item) => {
    const type = item.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const activityTypes = Object.keys(activityCounts)
  const maxCount = Math.max(...Object.values(activityCounts), 1)
  
  // Format amount from commitment
  const formatAmount = (amountCommitment: string, assetPair: string): string => {
    try {
      const amount = parseInt(amountCommitment)
      if (isNaN(amount)) return '???'
      
      // Determine token from asset pair
      const [base] = assetPair.split('/')
      const decimals = base === 'SOL' ? 9 : base === 'ETH' ? 18 : 9
      const decimalAmount = amount / Math.pow(10, decimals)
      
      if (decimalAmount >= 1000) return decimalAmount.toFixed(2)
      if (decimalAmount >= 1) return decimalAmount.toFixed(4)
      return decimalAmount.toFixed(6)
    } catch {
      return '???'
    }
  }
  
  const getTimeAgo = (timeStr: string) => {
    try {
      // Parse time string - could be various formats
      let activityTime: Date
      
      // Try parsing as ISO string first
      if (timeStr.includes('T') || timeStr.includes('Z')) {
        activityTime = new Date(timeStr)
      } else {
        // Try parsing as locale string
        activityTime = new Date(timeStr)
      }
      
      // Check if date is valid
      if (isNaN(activityTime.getTime())) {
        return timeStr // Return original if can't parse
      }
      
      const now = new Date()
      const diffMs = now.getTime() - activityTime.getTime()
      
      // Handle future dates (shouldn't happen but just in case)
      if (diffMs < 0) {
        return 'Just now'
      }
      
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch (error) {
      console.error('[Dashboard] Error parsing time:', timeStr, error)
      return timeStr
    }
  }

  const handleGetDevnetToken = (token: 'SOL' | 'USDC') => {
    const faucetUrls = {
      SOL: 'https://faucet.solana.com/',
      USDC: 'https://spl-token-faucet.com/?token-name=USDC'
    }
    window.open(faucetUrls[token], '_blank', 'noopener,noreferrer')
  }

  return (
    <section>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-1 sm:mb-2">Dashboard</h2>
          <p className="text-gray-400 text-sm sm:text-base">Monitor your settlement activity</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleGetDevnetToken('SOL')}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-cyan-500/30 transition-all text-xs sm:text-sm font-medium"
          >
            <img src={TOKEN_LOGOS.SOL} alt="SOL" className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" />
            <span className="hidden sm:inline">Get Devnet SOL</span>
            <span className="sm:hidden">SOL</span>
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <button
            onClick={() => handleGetDevnetToken('USDC')}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-green-500/30 transition-all text-xs sm:text-sm font-medium"
          >
            <img src={TOKEN_LOGOS.USDC} alt="USDC" className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" />
            <span className="hidden sm:inline">Get Devnet USDC</span>
            <span className="sm:hidden">USDC</span>
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid - 1/2 Chart + 1/2 Cards (4 cards @ 1/8 each) */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-5 mb-8">
        {/* SOL Price Chart - 1/2 width (4 cols of 8) */}
        <div className="lg:col-span-4 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <img src={TOKEN_LOGOS.SOL} alt="SOL" className="w-5 h-5 rounded-full" />
                <span className="text-sm text-gray-400">SOL/USDC</span>
              </div>
              <div className="text-2xl sm:text-3xl font-semibold">
                ${hoveredPoint ? hoveredPoint.price.toFixed(2) : solPrice.toFixed(2)}
              </div>
              <div className={`text-xs mt-1 ${solChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {solChange >= 0 ? '↑' : '↓'} {Math.abs(solChange).toFixed(2)}% 24h
              </div>
            </div>
            <a 
              href="https://www.binance.com/en/trade/SOL_USDC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Binance
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          
          {/* Professional Chart with Hover */}
          {priceHistory.length > 0 && (
            <div className="relative h-48 sm:h-64">
              <svg 
                ref={chartRef}
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleChartMouseMove}
                onMouseLeave={handleChartMouseLeave}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={solChange >= 0 ? '#4ade80' : '#f87171'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={solChange >= 0 ? '#4ade80' : '#f87171'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <path
                  d={(() => {
                    const minPrice = Math.min(...priceHistory.map(p => p.price))
                    const maxPrice = Math.max(...priceHistory.map(p => p.price))
                    const range = maxPrice - minPrice
                    const padding = range * 0.1
                    
                    const points = priceHistory.map((point, i) => {
                      const x = (i / (priceHistory.length - 1)) * 100
                      const y = 100 - (((point.price - minPrice) / (range + padding * 2)) * 95 + 2.5)
                      return `${x},${y}`
                    })
                    
                    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`
                  })()}
                  fill="url(#priceGradient)"
                />
                
                {/* Line */}
                <polyline
                  fill="none"
                  stroke={solChange >= 0 ? '#4ade80' : '#f87171'}
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                  points={priceHistory.map((point, i) => {
                    const minPrice = Math.min(...priceHistory.map(p => p.price))
                    const maxPrice = Math.max(...priceHistory.map(p => p.price))
                    const range = maxPrice - minPrice
                    const padding = range * 0.1
                    
                    const x = (i / (priceHistory.length - 1)) * 100
                    const y = 100 - (((point.price - minPrice) / (range + padding * 2)) * 95 + 2.5)
                    return `${x},${y}`
                  }).join(' ')}
                />
                
                {/* Hover point */}
                {hoveredPoint && (
                  <circle
                    cx={(priceHistory.indexOf(hoveredPoint) / (priceHistory.length - 1)) * 100}
                    cy={(() => {
                      const minPrice = Math.min(...priceHistory.map(p => p.price))
                      const maxPrice = Math.max(...priceHistory.map(p => p.price))
                      const range = maxPrice - minPrice
                      const padding = range * 0.1
                      return 100 - (((hoveredPoint.price - minPrice) / (range + padding * 2)) * 95 + 2.5)
                    })()}
                    r="1.5"
                    fill={solChange >= 0 ? '#4ade80' : '#f87171'}
                    stroke="#1a1a24"
                    strokeWidth="0.5"
                  />
                )}
              </svg>
              
              {/* Tooltip */}
              {hoveredPoint && mousePosition && (
                <div 
                  className="fixed z-50 bg-[#12121a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-xs pointer-events-none"
                  style={{
                    left: mousePosition.x + 10,
                    top: mousePosition.y - 40
                  }}
                >
                  <div className="font-semibold">${hoveredPoint.price.toFixed(2)}</div>
                  <div className="text-gray-400">{hoveredPoint.timestamp}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - 4 cards in 2x2 grid, each 1 col (1/8 width) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-5">
          {/* Latest Quotes - Custom card with scrollable list */}
          <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs sm:text-sm text-gray-500">Latest Quotes</div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {quoteRequests.length > 0 ? (
              <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent mb-3 space-y-2">
                {quoteRequests.map((req, i) => (
                  <div key={req.id || i} className="flex items-center justify-between text-xs py-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">{req.asset_pair}</span>
                      <span className="text-[10px] text-gray-500">
                        {formatAmount(req.amount_commitment, req.asset_pair)} {req.asset_pair.split('/')[0]}
                      </span>
                    </div>
                    <span className={`font-medium ${req.direction === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {req.direction.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 mb-3">No active quotes</div>
            )}
            
            <button
              onClick={() => onNavigate?.('dark-otc')}
              className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-cyan-500/30 transition-all text-xs font-medium"
            >
              Go Private Trade
            </button>
          </div>

          {/* Total Activities with Bar Chart */}
          <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs sm:text-sm text-gray-500">Total Activities</div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3">{activityLog.length}</div>
            
            {/* Bar Chart */}
            {activityTypes.length > 0 && (
              <div className="space-y-2">
                {activityTypes.map((type) => {
                  const count = activityCounts[type]
                  const percentage = (count / maxCount) * 100
                  const colors: Record<string, string> = {
                    'deposit': 'bg-blue-500',
                    'withdraw': 'bg-purple-500',
                    'dark-otc-request': 'bg-green-500',
                    'dark-otc-accept': 'bg-cyan-500'
                  }
                  const color = colors[type] || 'bg-gray-500'
                  
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-400 w-16 truncate capitalize">
                        {type.replace('dark-otc-', '')}
                      </div>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 w-6 text-right">{count}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">All time</div>
          </div>

          {/* Last Activity */}
          <StatCard 
            label="Last Activity" 
            value={lastActivity ? lastActivity.type.charAt(0).toUpperCase() + lastActivity.type.slice(1) : 'None'} 
            meta={lastActivity ? getTimeAgo(lastActivity.time) : 'No activity yet'}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            highlight={!!lastActivity}
            smallValue={true}
          />

          {/* API Status */}
          <StatCard 
            label="API Status" 
            value={stats.apiVersion} 
            meta={`${stats.healthStatus} • ${stats.healthTime}`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            highlight={stats.healthStatus === 'Online'}
            linkUrl="https://docs.obscura-app.com"
          />
        </div>
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

function StatCard({ 
  label, 
  value, 
  meta, 
  icon, 
  highlight, 
  linkUrl,
  button,
  smallValue
}: { 
  label: string
  value: string
  meta: string
  icon?: React.ReactNode
  highlight?: boolean
  linkUrl?: string
  button?: React.ReactNode
  smallValue?: boolean
}) {
  return (
    <div className={`bg-[#1a1a24] border rounded-xl p-4 sm:p-6 ${highlight ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/5 to-transparent' : 'border-[#2a2a3a]'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs sm:text-sm text-gray-500">{label}</div>
        <div className="flex items-center gap-2">
          {icon && <div className={`${highlight ? 'text-cyan-400' : 'text-gray-400'}`}>{icon}</div>}
          {linkUrl && (
            <a 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
      <div className={`${smallValue ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'} font-semibold mb-1 ${highlight ? 'text-cyan-400' : ''}`}>{value}</div>
      <div className="text-xs text-gray-500">{meta}</div>
      {button && button}
    </div>
  )
}
