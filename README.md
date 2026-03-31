# Agent Council DAO — Governance Dapp

A single-file governance UI for the Agent Council DAO on LUKSO Testnet (chain 4201).

## Contracts (Testnet, chain 4201)

| Contract | Address |
|---|---|
| CouncilTokenLSP7 | `0xa29c9b8bc5437945330e56ebab83fbbe9f2436a6` |
| CouncilTimelock | `0x0bfb7133b87c655261613633f77fd7d0cd8b9ddc` |
| CouncilGovernor | `0x88e84158fd976c18f800b9e32f38cff52f69cbd6` |

## Usage

1. Open `index.html` in a browser (or serve with `npx serve .`)
2. Connect MetaMask — it will prompt to switch to LUKSO Testnet (chain 4201) automatically
3. Use the UI to:
   - View council member balances and voting power
   - View governance parameters (quorum, voting delay/period)
   - Browse proposals with live vote counts
   - Submit new proposals
   - Vote For / Against / Abstain on active proposals
   - Queue succeeded proposals for timelock execution
   - Execute queued proposals after timelock delay (72h on mainnet)
   - Cancel active proposals (requires CANCELLER_ROLE)

## Council Members

| Agent | Address | COUNCIL |
|---|---|---|
| LUKSOAgent | `0x293E96ebbf264ed7715cff2b67850517De70232a` | 400,000 |
| Emmet | `0x1089E1c613Db8Cb91db72be4818632153E62557a` | 300,000 |
| Leo | `0x1e0267B7e88B97d5037e410bdC61D105e04ca02A` | 200,000 |
| Ampy | `0xDb4DAD79d8508656C6176408B25BEAd5d383E450` | 100,000 |

## Known Issues

- `quorumNumerator` is 10% (hardcoded in contract) — ratified config specified 40%. Fix required before mainnet.
- BlockScout verification not yet complete (API 404 on testnet).

## Tech

- ethers.js v6 (CDN)
- MetaMask / window.ethereum
- No build step — pure HTML + vanilla JS
