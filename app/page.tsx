'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { MAINNET_START_BLOCK } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';
import { ProposalCard } from '@/components/ProposalCard';
import { CreateProposalForm } from '@/components/CreateProposalForm';
import { WalletConnect } from '@/components/WalletConnect';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { StatsBar } from '@/components/StatsBar';
import { CouncilMembers } from '@/components/CouncilMembers';

interface ProposalEvent {
  proposalId: bigint;
  proposer: string;
  targets: string[];
  values: bigint[];
  signatures: string[];
  calldatas: `0x${string}`[];
  voteStart: bigint;
  voteEnd: bigint;
  description: string;
}

export default function Home() {
  const { isMainnet, governorAddress } = useNetwork();
  const publicClient = usePublicClient();
  const [proposals, setProposals] = useState<ProposalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [highlightedProposal, setHighlightedProposal] = useState<bigint | null>(null);

  // Deep-link: highlight proposal from URL param
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('proposal');
    if (pid) {
      try {
        setHighlightedProposal(BigInt(pid));
      } catch {}
    }
  }, []);

  const loadProposals = useCallback(async () => {
    if (!publicClient) return;
    setLoading(true);
    setError(null);
    try {
      const fromBlock = isMainnet ? MAINNET_START_BLOCK : 0n;
      const latestBlock = await publicClient.getBlockNumber();
      const CHUNK_SIZE = 5000n;

      // Chunk getLogs to avoid LUKSO RPC range limits
      const proposalCreatedEvent = {
        name: 'ProposalCreated',
        type: 'event',
        inputs: [
          { name: 'proposalId', type: 'uint256', indexed: false },
          { name: 'proposer', type: 'address', indexed: false },
          { name: 'targets', type: 'address[]', indexed: false },
          { name: 'values', type: 'uint256[]', indexed: false },
          { name: 'signatures', type: 'string[]', indexed: false },
          { name: 'calldatas', type: 'bytes[]', indexed: false },
          { name: 'voteStart', type: 'uint256', indexed: false },
          { name: 'voteEnd', type: 'uint256', indexed: false },
          { name: 'description', type: 'string', indexed: false },
        ],
      } as const;

      const allLogs = [];
      for (let start = fromBlock; start <= latestBlock; start += CHUNK_SIZE) {
        const end = start + CHUNK_SIZE - 1n > latestBlock ? latestBlock : start + CHUNK_SIZE - 1n;
        const chunk = await publicClient.getLogs({
          address: governorAddress,
          event: proposalCreatedEvent,
          fromBlock: start,
          toBlock: end,
        });
        allLogs.push(...chunk);
      }
      const logs = allLogs;

      const parsed: ProposalEvent[] = logs.map((log) => {
        const a = log.args as {
          proposalId: bigint;
          proposer: string;
          targets: string[];
          values: bigint[];
          signatures: string[];
          calldatas: `0x${string}`[];
          voteStart: bigint;
          voteEnd: bigint;
          description: string;
        };
        return {
          proposalId: a.proposalId,
          proposer: a.proposer,
          targets: a.targets,
          values: a.values,
          signatures: a.signatures,
          calldatas: a.calldatas,
          voteStart: a.voteStart,
          voteEnd: a.voteEnd,
          description: a.description,
        };
      });

      // Sort newest first
      setProposals(parsed.sort((a, b) => (b.voteStart > a.voteStart ? 1 : -1)));
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [publicClient, isMainnet, governorAddress]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // Scroll to highlighted proposal
  useEffect(() => {
    if (highlightedProposal && proposals.length > 0) {
      const el = document.getElementById(`proposal-${highlightedProposal}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    }
  }, [highlightedProposal, proposals]);

  const filtered = proposals.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.description.toLowerCase().includes(q) ||
      p.proposalId.toString().includes(q) ||
      p.proposer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060010 0%, #0a0020 50%, #060010 100%)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ width: '100%', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              ⚖
            </div>
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>Agent Council</h1>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>DAO Governance</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <NetworkSwitcher />
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats bar */}
        <StatsBar proposalCount={proposals.length} />

        {/* Two-column layout on large screens */}
        <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 lg:w-2/3 min-w-0 space-y-4">

        {/* Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={loadProposals}
            disabled={loading}
            className="glass-button px-3 py-2 text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <span className="animate-spin inline-block">↻</span>
            ) : (
              '↻'
            )}
          </button>
        </div>

        {lastRefresh && (
          <p className="text-xs text-gray-400 text-right -mt-2">
            Updated {lastRefresh.toLocaleTimeString()}
            {' · '}
            {filtered.length} proposal{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Create proposal */}
        <CreateProposalForm onCreated={loadProposals} />

        {/* Error */}
        {error && (
          <div className="glass-card rounded-2xl p-4 border-red-500/20">
            <p className="text-sm text-red-400">Error: {error}</p>
            <button
              onClick={loadProposals}
              className="mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && proposals.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded-lg w-3/4 mb-3" />
                <div className="h-2 bg-white/5 rounded-lg w-1/2 mb-4" />
                <div className="h-1.5 bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Proposals */}
        {!loading && filtered.length === 0 && !error && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-gray-600">
              {search ? 'No proposals match your search' : 'No proposals found'}
            </p>
          </div>
        )}

        <div className={filtered.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-3"}>
          {filtered.map((p) => (
            <ProposalCard
              key={p.proposalId.toString()}
              proposalId={p.proposalId}
              description={p.description}
              proposer={p.proposer}
              voteStart={p.voteStart}
              voteEnd={p.voteEnd}
              isHighlighted={highlightedProposal === p.proposalId}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 pb-8 text-center space-y-1">
          <p className="text-xs text-gray-700">
            Agent Council DAO · LUKSO {isMainnet ? 'Mainnet' : 'Testnet'}
          </p>
          <p className="text-xs text-gray-800 font-mono">
            Gov: {governorAddress.slice(0, 10)}...
          </p>
        </div>

        </div>{/* end left column */}

        {/* Right column: Council Members */}
        <div className="lg:w-1/3 shrink-0">
          <div className="sticky top-20">
            <CouncilMembers
              explorerBase={isMainnet ? 'https://explorer.lukso.network' : 'https://explorer.execution.testnet.lukso.network'}
            />
          </div>
        </div>

        </div>{/* end two-col */}
      </main>
    </div>
  );
}
