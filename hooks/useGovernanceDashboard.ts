'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { MAINNET_START_BLOCK } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';

export interface ProposalEvent {
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

export function useGovernanceDashboard() {
  const { isMainnet, governorAddress } = useNetwork();
  const publicClient = usePublicClient();
  const [proposals, setProposals] = useState<ProposalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [highlightedProposal, setHighlightedProposal] = useState<bigint | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const proposalId = params.get('proposal');
    if (!proposalId) return;

    try {
      setHighlightedProposal(BigInt(proposalId));
    } catch {
      setHighlightedProposal(null);
    }
  }, []);

  const loadProposals = useCallback(async () => {
    if (!publicClient) return;

    setLoading(true);
    setError(null);

    try {
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
        fromBlock: isMainnet ? MAINNET_START_BLOCK : 0n,
        toBlock: 'latest',
      });

      const parsed = logs.map((log) => {
        const args = log.args as ProposalEvent;
        return {
          proposalId: args.proposalId,
          proposer: args.proposer,
          targets: args.targets,
          values: args.values,
          signatures: args.signatures,
          calldatas: args.calldatas,
          voteStart: args.voteStart,
          voteEnd: args.voteEnd,
          description: args.description,
        };
      });

      parsed.sort((left, right) => (right.voteStart > left.voteStart ? 1 : -1));
      setProposals(parsed);
      setLastRefresh(new Date());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [governorAddress, isMainnet, publicClient]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const filteredProposals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return proposals;

    return proposals.filter((proposal) => {
      return (
        proposal.description.toLowerCase().includes(query) ||
        proposal.proposalId.toString().includes(query) ||
        proposal.proposer.toLowerCase().includes(query)
      );
    });
  }, [proposals, search]);

  const metrics = useMemo(() => {
    // state: 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
    // We don't have state in proposals here, so use voteEnd vs currentBlock
    // For display: count proposals with no definitive end state as "active"
    const total = proposals.length;
    // Without on-chain state, approximate: proposals where voteEnd is recent (last 50400 blocks ~1 week)
    // Just show total/ended/succeeded as approximations
    const ended = 0; // can't know without state
    const succeeded = 0; // can't know without state

    return {
      total,
      active: total, // show all tracked as potentially active; state shown per-card
      ended,
      succeeded,
      avgQuorumLabel: '—',
    };
  }, [proposals]);

  return {
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
  };
}
