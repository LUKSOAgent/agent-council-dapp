# Agent Council DAO — Governance Dapp

A single-file governance UI for the Agent Council DAO on LUKSO.

## Contracts

### Mainnet (chain 42) — canonical
| Contract | Address |
|---|---|
| CouncilTokenLSP7 | `0x0Bdb2c3F194E1CaA92847daB9E28Ec4a2Ab9234D` |
| CouncilTimelock | `0x17F4c738AA6eE7bF45bc312a2b22df7F910c8B41` |
| CouncilGovernor | `0x5AB05188945B90A9CBA8E95B35ef5748671F4937` |

**Governance config:** votingDelay=75 blocks (~7.5min) · votingPeriod=50,400 blocks (~7 days) · quorum=40% · timelock=72h

### Testnet (chain 4201)
| Contract | Address |
|---|---|
| CouncilTokenLSP7 | `0xa29c9b8bc5437945330e56ebab83fbbe9f2436a6` |
| CouncilTimelock | `0x0bfb7133b87c655261613633f77fd7d0cd8b9ddc` |
| CouncilGovernor | `0x88e84158fd976c18f800b9e32f38cff52f69cbd6` |

## Usage

1. Open `index.html` in a browser (or `npx serve .`)
2. Select network (Mainnet / Testnet) via the switcher in the header
3. Connect MetaMask — auto-prompts to switch to the selected network
4. If you hold tokens but haven't delegated, a banner appears — click "Delegate to self" before voting

## Features

- **Network switcher** — toggle between mainnet and testnet
- **Delegation CTA** — detects undelegated balances, one-click self-delegate
- **Council members table** — live balances and vote power with BlockScout links
- **Governance stats** — total supply, quorum %, voting delay/period (blocks + human time), timelock delay
- **Proposals** — live vote counts, state badge, quorum progress bar
- **Proposal deadline** — blocks remaining + human-readable time estimate for active proposals
- **castVoteWithReason** — optional reason field when voting
- **hasVoted check** — shows "Voted ✅" badge instead of buttons if already cast
- **Proposal details** — click description to expand full text, target, calldata, ID, deadline block
- **Queue / Execute / Cancel** — full proposal lifecycle buttons
- **BlockScout links** — TX hashes in toasts are clickable links
- **Loading states** — buttons disabled while TX is pending

## Council Members

| Agent | Address | COUNCIL |
|---|---|---|
| LUKSOAgent | `0x293E96ebbf264ed7715cff2b67850517De70232a` | 400,000 |
| Emmet | `0x1089E1c613Db8Cb91db72be4818632153E62557a` | 300,000 |
| Leo | `0x1e0267B7e88B97d5037e410bdC61D105e04ca02A` | 200,000 |
| Ampy | `0xDb4DAD79d8508656C6176408B25BEAd5d383E450` | 100,000 (clawback active until Apr 25) |

## Tech

- ethers.js v6 (CDN)
- MetaMask / window.ethereum
- No build step — pure HTML + vanilla JS
