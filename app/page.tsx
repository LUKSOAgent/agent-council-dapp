'use client';

import { CreateProposalForm } from '@/components/CreateProposalForm';
import { MemberPanel } from '@/components/MemberPanel';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { ProposalCard } from '@/components/ProposalCard';
import { WalletConnect } from '@/components/WalletConnect';
import { useGovernanceDashboard } from '@/hooks/useGovernanceDashboard';
import { useNetwork } from '@/hooks/useNetwork';
import { formatCompactTime } from '@/lib/format';
import { useReadContract } from 'wagmi';
import { GOVERNOR_ABI } from '@/lib/contracts';

export default function Home() {
  const { isMainnet, governorAddress, tokenAddress, timelockAddress, chain } = useNetwork();
  const { data: quorumNumerator } = useReadContract({
    address: governorAddress,
    abi: GOVERNOR_ABI,
    functionName: 'quorumNumerator',
  });
  const quorumDisplay = quorumNumerator != null ? `${quorumNumerator.toString()}%` : '—';
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
    <div style={{ minHeight: '100vh' }} className="bg-canvas">
      <div className="page-shell">
        <header className="hero-panel">
          <div className="hero-grid">
            {/* Left: title + stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.28em',
                color: 'rgba(255,255,255,0.65)',
                width: 'fit-content',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 18px rgba(254,0,91,0.85)',
                  flexShrink: 0,
                }} />
                Agent Council Governance
              </div>

              {/* Heading */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{
                  maxWidth: '900px',
                  fontSize: 'clamp(2rem, 4vw, 3.75rem)',
                  fontWeight: 600,
                  lineHeight: '0.94',
                  color: 'white',
                  margin: 0,
                }}>
                  Premium control room for proposals, votes, and council state.
                </h1>
                <p style={{
                  maxWidth: '640px',
                  fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                  lineHeight: '1.75',
                  color: 'var(--text-muted)',
                  margin: 0,
                }}>
                  Dark, sharp, and operational. Review active mandates, inspect quorum pressure,
                  and vote without swimming through cramped cards and weak contrast.
                </p>
              </div>

              {/* Stats grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Proposals tracked</span>
                  <strong className="stat-value">{metrics.total}</strong>
                  <span className="stat-subtle">Synced from on-chain events</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Active now</span>
                  <strong className="stat-value">{metrics.active}</strong>
                  <span className="stat-subtle">State shown per proposal card</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Quorum pressure</span>
                  <strong className="stat-value">{quorumDisplay}</strong>
                  <span className="stat-subtle">of total supply required</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Network</span>
                  <strong className="stat-value">{chain.name}</strong>
                  <span className="stat-subtle">{isMainnet ? 'Production council' : 'Test scope'}</span>
                </div>
              </div>
            </div>

            {/* Right: command panel */}
            <aside className="command-panel">
              <div className="panel-block">
                <div className="panel-heading">
                  <span className="panel-kicker">Council status</span>
                  <span className="status-chip">{isMainnet ? 'Mainnet' : 'Testnet'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                    <NetworkSwitcher />
                    <WalletConnect />
                  </div>
                  <div className="address-grid">
                    {[
                      { label: 'Governor', addr: governorAddress },
                      { label: 'Token', addr: tokenAddress },
                      { label: 'Timelock', addr: timelockAddress },
                    ].map(({ label, addr }) => (
                      <div key={label}>
                        <span className="address-label">{label}</span>
                        <a
                          href={`https://explorer.execution.${isMainnet ? 'mainnet' : 'testnet'}.lukso.network/address/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', color: 'var(--accent)', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
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
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)' }}>
                    Search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Title, proposer, or proposal ID"
                    className="field-input"
                  />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-soft)' }}>
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
          {/* Proposals section */}
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
                <p style={{ fontSize: '14px', color: '#fecaca', margin: 0 }}>{error}</p>
                <button
                  onClick={loadProposals}
                  style={{ fontSize: '14px', fontWeight: 500, color: '#fee2e2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Retry sync
                </button>
              </div>
            )}

            {loading && proposals.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((key) => (
                  <div key={key} className="proposal-skeleton" />
                ))}
              </div>
            )}

            {!loading && filteredProposals.length === 0 && !error && (
              <div className="empty-panel">
                <h3 style={{ fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>No proposals matched.</h3>
                <p style={{ maxWidth: '448px', fontSize: '14px', lineHeight: '1.75', color: 'var(--text-muted)', margin: 0 }}>
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

          {/* Sidebar */}
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
                  <p style={{ margin: 0 }}>Single-column sprawl replaced with a real dashboard split and clear action zones.</p>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Hierarchy</span>
                  <p style={{ margin: 0 }}>Titles, metadata, state, quorum, and voting actions now compete less and read faster.</p>
                </div>
                <div className="insight-row">
                  <span className="insight-label">Maintainability</span>
                  <p style={{ margin: 0 }}>Proposal loading moved out of the page shell and formatting logic is centralized.</p>
                </div>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
