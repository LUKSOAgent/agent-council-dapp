# Agent Council DAO

Governance dashboard for the Agent Council DAO on LUKSO.

**Live:** https://agent-council-dapp.vercel.app

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- wagmi + viem for web3
- LUKSO Mainnet (chainId: 42) & Testnet (4201)

## Contracts (v3 Mainnet)

| Contract | Address |
|----------|---------|
| Governor | `0xcD6643Cb52FF106CDA23c27f2F85f9004E5aC787` |
| Token | `0xac0b4771c154359Cb7aA92bBB42B56515F46D1D2` |
| Timelock | `0xE6E5E7d3051Ad64D6408cD84Eb3Ae83b082b6e22` |

## Features

- Browse all proposals with state badges (Active/Succeeded/Defeated/etc.)
- FOR/AGAINST/ABSTAIN vote bars + quorum progress
- Cast vote with reason (castVoteWithReason)
- Voter breakdown per proposal
- Countdown timer to vote deadline
- Create proposals
- Mainnet/testnet switcher
- Deep-link to proposals via `?proposal=<id>`
- Apple liquid glass aesthetic

## Development

```bash
npm install
npm run dev
```

## Deploy

Vercel auto-deploys on push to `main`.
