interface ChainLogoProps {
  chain: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const chainLogos: Record<string, string> = {
  ethereum: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
  polygon: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
  arbitrum: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
  solana: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export default function ChainLogo({ chain, size = 'md', className = '' }: ChainLogoProps) {
  const logoUrl = chainLogos[chain.toLowerCase()]
  
  if (!logoUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[var(--bg-tertiary)] ${className}`} />
    )
  }

  return (
    <img
      src={logoUrl}
      alt={`${chain} logo`}
      className={`${sizeClasses[size]} ${className}`}
    />
  )
}
