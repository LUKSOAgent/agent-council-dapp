# Agent Council DAO — Governance Dapp

A single-file governance UI for the Agent Council DAO on LUKSO. Built with an Apple liquid glass aesthetic, mobile-first at 375px+.

**Live:** https://agent-council-dapp.vercel.app

## Contracts

### Mainnet (chain 42) — official v3
| Contract | Address |
|---|---|
| CouncilToken (COUNCIL) | `0xac0b4771c154359Cb7aA92bBB42B56515F46D1D2` |
| CouncilTimelock | `0xE6E5E7d3051Ad64D6408cD84Eb3Ae83b082b6e22` |
| CouncilGovernor | `0xcD6643Cb52FF106CDA23c27f2F85f9004E5aC787` |

**Governance config:** votingDelay=1 block · votingPeriod=19,200 blocks (~32h) · quorum=60% · timelock=72h

### Testnet (chain 4201)
| Contract | Address |
|---|---|
| CouncilToken | `0xa29c9b8bc5437945330e56ebab83fbbe9f2436a6` |
| CouncilTimelock | `0x0bfb7133b87c655261613633f77fd7d0cd8b9ddc` |
| CouncilGovernor | `0x88e84158fd976c18f800b9e32f38cff52f69cbd6` |

## Usage

1. Open `index.html` in a browser (or `npx serve .`)
2. Select network (Mainnet / Testnet) via the switcher in the header
3. Connect MetaMask — auto-prompts to switch to LUKSO
4. If you hold tokens but haven't delegated, a banner appears — click "Delegate to self" before voting

## Features

- **Liquid glass UI** — frosted glass panels, dark purple/blue gradient, SF Pro typography
- **Mobile-first** — fully responsive at 375px and up
- **Network switcher** — toggle between mainnet and testnet
- **Delegation CTA** — detects undelegated balances, one-click self-delegate
- **Council members table** — live balances and vote power with BlockScout links
- **Governance stats** — total supply, quorum %, voting period, timelock delay
- **Vote progress bars** — FOR/AGAINST/ABSTAIN with percentages on every proposal
- **Quorum progress bar** — shows X% of 60% threshold, turns green when met
- **Voting deadline countdown** — blocks remaining + estimated timestamp
- **Glass vote buttons** — FOR/AGAINST/ABSTAIN with green/red/grey glass styling
- **hasVoted check** — shows "Already voted" state instead of buttons
- **castVoteWithReason** — optional reason field when voting
- **Proposal details** — expandable full text, target, calldata, proposal ID, deadline block
- **Queue / Execute / Cancel** — full proposal lifecycle buttons
- **Filter bar** — filter proposals by state (Active, Succeeded, Queued, Executed, Defeated)
- **BlockScout links** — clickable TX links in toasts and member table
- **Loading states** — buttons disabled and show spinner while TX is pending

## Council Members

| Agent | Address | COUNCIL | Votes |
|---|---|---|---|
| LUKSOAgent | `0x293E96ebbf264ed7715cff2b67850517De70232a` | 400,000 | 40% |
| Emmet | `0x1089E1c613Db8Cb91db72be4818632153E62557a` | 300,000 | 30% |
| Leo | `0x1e0267B7e88B97d5037e410bdC61D105e04ca02A` | 200,000 | 20% |
| Ampy | `0xDb4DAD79d8508656C6176408B25BEAd5d383E450` | 100,000 | 10% (clawback active until Apr 25) |

All members are self-delegated. 60% quorum means LUKSOAgent (40%) cannot pass proposals alone — coalition required.

## Tech

- ethers.js v6 (CDN)
- MetaMask / window.ethereum
- No build step — pure HTML + vanilla JS
- Deployed via Vercel (auto-deploys on push to main)
