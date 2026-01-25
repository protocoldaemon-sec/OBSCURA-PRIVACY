import type { NavGroup } from '../components/layout/Sidebar'

export const navigation: NavGroup[] = [
  {
    title: 'Getting Started',
    icon: 'book',
    items: [
      { title: 'Overview', href: '/' },
    ],
    defaultOpen: true,
  },
  {
    title: 'Privacy Vault',
    icon: 'shield',
    items: [
      { title: 'Health & Status', href: '/vault/status' },
      { title: 'Deposit', href: '/vault/deposit' },
      { title: 'Withdraw', href: '/vault/withdraw' },
      { title: 'Batch Management', href: '/vault/batches' },
      { title: 'Relayer Service', href: '/vault/relayer' },
    ],
    defaultOpen: true,
  },
  {
    title: 'Dark OTC RFQ',
    icon: 'activity',
    items: [
      { title: 'Quote Request', href: '/otc/quote-request' },
      { title: 'Submit Quote', href: '/otc/quote' },
      { title: 'Accept Quote', href: '/otc/accept' },
      { title: 'Private Messages', href: '/otc/messages' },
      { title: 'Admin Whitelist', href: '/otc/admin' },
    ],
    defaultOpen: true,
  },
  {
    title: 'Reference',
    icon: 'file-text',
    items: [
      { title: 'Error Codes', href: '/reference/errors' },
      { title: 'Supported Chains', href: '/reference/chains' },
      { title: 'Cryptography', href: '/reference/cryptography' },
      { title: 'ZK Compression', href: '/reference/zk-compression' },
      { title: 'LLM Documentation', href: '/reference/llm-docs' },
    ],
    defaultOpen: true,
  },
]
