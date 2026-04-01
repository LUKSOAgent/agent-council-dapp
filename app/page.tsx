'use client';

import { CreateProposalForm } from '@/components/CreateProposalForm';
import { MemberPanel } from '@/components/MemberPanel';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { ProposalCard } from '@/components/ProposalCard';
import { WalletConnect } from '@/components/WalletConnect';
import { useGovernanceDashboard } from '@/hooks/useGovernanceDashboard';
import { useNetwork } from '@/hooks/useNetwork';
import { formatCompactTime } from '@/lib/format';

export default function Home() {
  const { isMainnet, governorAddress, tokenAddress, timelockAddress, chain } = useNetwork();
  const {
    proposals,
    filteredProposals,
    loading,
    error,
    search,
    setSearch,
    lastRefresh,
    highlightedProposal,
    metrics,
    loadProposals,
  } = useGovernanceDashboard();

  return (
    <div className="min-h-screen bg-canvas text-white">
      <div className="page-shell">
        <header className="hero-panel">
          <div className="hero-grid">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_18px_rgba(254,0,91,0.85)]" />
                Agent Council Governance
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold leading-[0.94] text-white sm:text-5xl lg:text-6xl">
                  Premium control room for proposals, votes, and council state.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                  Dark, sharp, and operational. Review active mandates, inspect quorum pressure,
                  and vote without swimming through cramped cards and weak contrast.
                </p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Proposals tracked</span>
                  <strong className="stat-value">{metrics.total}</strong>
                  <span className="stat-subtle">Synced from on-chain events</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Active now</span>
                  <strong className="stat-value">{metrics.active}</strong>
                  <span className="stat-subtle">
                    {metrics.ended} closed, {metrics.succeeded} succeeded
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Quorum pressure</span>
                  <strong className="stat-value">{metrics.avgQuorumLabel}</strong>
                  <span className="stat-subtle">Average visible quorum progress</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Network</span>
                  <strong className="stat-value">{chain.name}</strong>
                  <span className="stat-subtle">{isMainnet ? 'Production council' : 'Test scope'}</span>
                </div>
              </div>
            </div>

            <aside className="command-panel">
              <div className="panel-block">
                <div className="panel-heading">
                  <span className="panel-kicker">Council status</span>
                  <span className="status-chip">{isMainnet ? 'Mainnet' : 'Testnet'}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <NetworkSwitcher />
                    <WalletConnect />
                  </div>
                  <div className="address-grid">
                    {[{label:'Governor',addr:governorAddress},{label:'Token',addr:tokenAddress},{label:'Timelock',addr:timelockAddress}].map(({label,addr})=>(
                      <div key={label}>
                        <span className="address-label">{label}</span>
                        <a
                          href={`https://explorer.execution.${isMainnet?'mainnet':'testnet'}.lukso.network/address/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{display:'block',color:'var(--accent)',textDecoration:'none'}}
                          onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')}
                          onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}
                        >
                          <code className="address-value">{addr}</code>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel-block">
                <div className="panel-heading">
                  <span className="panel-kicker">Feed controls</span>
                  <button
                    onClick={loadProposals}
                    disabled={loading}
                    className="control-button"
                  >
                    {loading ? 'Refreshing' : 'Refresh'}
                  </button>
                </div>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-white/40">Search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Title, proposer, or proposal ID"
                    className="field-input"
                  />
                </label>
                <div className="flex items-center justify-between text-xs text-[var(--text-soft)]">
                  <span>
                    {filteredProposals.length} result{filteredProposals.length !== 1 ? 's' : ''}
                  </span>
                  <span>{lastRefresh ? `Updated ${formatCompactTime(lastRefresh)}` : 'Awaiting sync'}</span>
                </div>
              </div>

              <CreateProposalForm onCreated={loadProposals} />
            </aside>
          </div>
        </header>

        <main className="content-grid">
          <section className="surface-panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">Proposal feed</span>
                <h2 className="section-title">Operational proposals</h2>
              </div>
              <p className="section-copy">
                Clear vote distribution, quorum progress, voter breakdown, and direct action on active items.
              </p>
            </div>

            {error && (
              <div className="alert-panel">
                <p className="text-sm text-red-200">{error}</p>
                <button onClick={loadProposals} className="text-sm font-medium text-red-100 underline underline-offset-4">
                  Retry sync
                </button>
              </div>
            )}

            {loading && proposals.length === 0 && (
              <div className="space-y-4">
                {[1, 2, 3].map((key) => (
                  <div key={key} className="proposal-skeleton" />
                ))}
              </div>
            )}

            {!loading && filteredProposals.length === 0 && !error && (
              <div className="empty-panel">
                <h3 className="text-xl font-medium text-white">No proposals matched.</h3>
                <p className="max-w-md text-sm leading-7 text-[var(--text-muted)]">
                  Try a different search term or refresh if a new proposal landed recently.
                </p>
              </div>
            )}

            <div className="proposal-list">
              {filteredProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.proposalId.toString()}
                  proposalId={proposal.proposalId}
                  description={proposal.description}
                  proposer={proposal.proposer}
                  voteStart={proposal.voteStart}
                  voteEnd={proposal.voteEnd}
                  isHighlighted={highlightedProposal === proposal.proposalId}
                />
              ))}
            </div>
          </section>

          <aside className="sidebar-stack">
            <MemberPanel />

            <section className="surface-panel compact-panel">
              <div className="section-header compact">
                <div>
                  <span className="section-kicker">Governance rhythm</span>
                  <h2 className="section-title">What this dashboard fixes</h2>
                </div>
              </div>
              <div className="insight-list">
                <div className="insight-row">
                  <span className="insight-label">Density</span>
                  <p>Single-column sprawl replaced with a real dashboard split and clear action zones.</p>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Hierarchy</span>
                  <p>Titles, metadata, state, quorum, and voting actions now compete less and read faster.</p>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Maintainability</span>
                  <p>Proposal loading moved out of the page shell and formatting logic is centralized.</p>
                </div>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
