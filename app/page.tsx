'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { MAINNET_START_BLOCK } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';
import { ProposalCard } from '@/components/ProposalCard';
import { CreateProposalForm } from '@/components/CreateProposalForm';
import { WalletConnect } from '@/components/WalletConnect';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';

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
      const logs = await publicClient.getLogs({
        address: governorAddress,
        event: {
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
        },
        fromBlock,
        toBlock: 'latest',
      });

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
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl bg-black/40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/40 to-blue-500/40 flex items-center justify-center text-sm border border-white/10">
              ⚖
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Agent Council</h1>
              <p className="text-xs text-gray-600">DAO Governance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NetworkSwitcher />
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
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
          <p className="text-xs text-gray-600 text-right -mt-2">
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

        <div className="space-y-3">
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
      </main>
    </div>
  );
}
