'use client';

import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { COUNCIL_MEMBERS, GOVERNOR_ABI, MAINNET_START_BLOCK, PROPOSAL_STATES, PROPOSAL_STATE_COLORS } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';
import { VoteButtons } from './VoteButtons';

interface ProposalCardProps {
  proposalId: bigint;
  description: string;
  proposer: string;
  voteStart: bigint;
  voteEnd: bigint;
  isHighlighted?: boolean;
}

interface VoteLog {
  voter: string;
  support: number;
  weight: bigint;
  reason: string;
}

const SUPPORT_LABELS = ['Against', 'For', 'Abstain'];
const SUPPORT_COLORS = ['text-red-400', 'text-green-400', 'text-yellow-400'];

function useCountdown(targetBlock: bigint, currentBlock: bigint | undefined) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!currentBlock) return;

    let secondsLeft = Math.max(0, (Number(targetBlock) - Number(currentBlock)) * 5);

    const format = (seconds: number) => {
      if (seconds <= 0) return 'Ended';
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (d > 0) return `${d}d ${h}h remaining`;
      if (h > 0) return `${h}h ${m}m remaining`;
      if (m > 0) return `${m}m ${s}s remaining`;
      return `${s}s remaining`;
    };

    const render = () => {
      setTimeLeft(format(secondsLeft));
      secondsLeft = Math.max(0, secondsLeft - 1);
    };

    const initial = window.setTimeout(render, 0);
    const interval = window.setInterval(render, 1000);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [targetBlock, currentBlock]);

  return timeLeft;
}

export function ProposalCard({
  proposalId,
  description,
  proposer,
  voteStart,
  voteEnd,
  isHighlighted,
}: ProposalCardProps) {
  const { governorAddress, isMainnet } = useNetwork();
  const publicClient = usePublicClient();
  const [expanded, setExpanded] = useState(isHighlighted || false);
  const [votes, setVotes] = useState<VoteLog[]>([]);
  const [currentBlock, setCurrentBlock] = useState<bigint>();
  const [quorumVal, setQuorumVal] = useState<bigint>(0n);

  useEffect(() => {
    if (!publicClient) return;
    publicClient.getBlockNumber().then(setCurrentBlock).catch(() => {});
  }, [publicClient]);

  useEffect(() => {
    if (!publicClient || !voteStart) return;
    publicClient.readContract({
      address: governorAddress,
      abi: GOVERNOR_ABI,
      functionName: 'quorum',
      args: [voteStart],
    }).then((q) => setQuorumVal(q as bigint)).catch(() => {});
  }, [publicClient, governorAddress, voteStart]);

  const { data: stateData } = useReadContract({
    address: governorAddress,
    abi: GOVERNOR_ABI,
    functionName: 'state',
    args: [proposalId],
  });

  const { data: proposalVotes, refetch: refetchVotes } = useReadContract({
    address: governorAddress,
    abi: GOVERNOR_ABI,
    functionName: 'proposalVotes',
    args: [proposalId],
  });

  useEffect(() => {
    if (!expanded || !publicClient) return;
    publicClient.getLogs({
      address: governorAddress,
      event: {
        name: 'VoteCast',
        type: 'event',
        inputs: [
          { name: 'voter', type: 'address', indexed: true },
          { name: 'proposalId', type: 'uint256', indexed: false },
          { name: 'support', type: 'uint8', indexed: false },
          { name: 'weight', type: 'uint256', indexed: false },
          { name: 'reason', type: 'string', indexed: false },
        ],
      },
      args: { voter: undefined },
      fromBlock: isMainnet
        ? (voteStart > MAINNET_START_BLOCK ? voteStart : MAINNET_START_BLOCK)
        : voteStart,
      toBlock: 'latest',
    }).then((logs) => {
      const filtered = logs
        .filter((l) => {
          const args = l.args as { proposalId?: bigint };
          return args.proposalId === proposalId;
        })
        .map((l) => {
          const args = l.args as { voter: string; support: number; weight: bigint; reason: string };
          return {
            voter: args.voter,
            support: args.support,
            weight: args.weight,
            reason: args.reason,
          };
        });
      setVotes(filtered);
    }).catch(() => {});
  }, [expanded, publicClient, governorAddress, proposalId, voteStart, isMainnet]);

  const state = typeof stateData === 'number' ? stateData : -1;
  const stateName = state >= 0 ? PROPOSAL_STATES[state] : 'Loading...';
  const stateColor = state >= 0 ? PROPOSAL_STATE_COLORS[state] : 'text-gray-400 bg-gray-400/10 border-gray-400/20';

  const againstVotes = proposalVotes ? (proposalVotes as [bigint, bigint, bigint])[0] : 0n;
  const forVotes = proposalVotes ? (proposalVotes as [bigint, bigint, bigint])[1] : 0n;
  const abstainVotes = proposalVotes ? (proposalVotes as [bigint, bigint, bigint])[2] : 0n;
  const totalVotes = forVotes + againstVotes + abstainVotes;

  const forPct = totalVotes > 0n ? Number((forVotes * 10000n) / totalVotes) / 100 : 0;
  const againstPct = totalVotes > 0n ? Number((againstVotes * 10000n) / totalVotes) / 100 : 0;
  const abstainPct = totalVotes > 0n ? Number((abstainVotes * 10000n) / totalVotes) / 100 : 0;

  const quorumPct = quorumVal > 0n
    ? Math.min(100, Number((forVotes * 100n) / quorumVal))
    : 0;

  const isActive = state === 1;
  const countdown = useCountdown(voteEnd, currentBlock);

  const lines = description.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || `Proposal ${proposalId.toString().slice(-6)}`;
  const body = lines.slice(1).join('\n').trim();

  const shortProposer = `${proposer.slice(0, 6)}...${proposer.slice(-4)}`;
  const formatVoter = (voter: string) => COUNCIL_MEMBERS[voter.toLowerCase()] || `${voter.slice(0, 8)}...${voter.slice(-4)}`;

  return (
    <div
      id={`proposal-${proposalId}`}
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${isHighlighted ? 'ring-1 ring-white/20' : ''}`}
      style={{
        background: 'rgba(15, 10, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base leading-snug truncate">
              {title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              by {shortProposer}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${stateColor}`}>
              {stateName}
            </span>
            <span className="text-gray-600 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <div style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', height: '6px', borderRadius: '9999px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${forPct}%`, background: '#4ade80', transition: 'width 0.5s' }} />
            <div style={{ width: `${againstPct}%`, background: '#f87171', transition: 'width 0.5s' }} />
            <div style={{ width: `${abstainPct}%`, background: '#facc15', transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', color: 'rgba(255,255,255,0.4)' }}>
            <span style={{ color: '#4ade80' }}>✓ {forPct.toFixed(1)}%</span>
            {(isActive || state === 0) && countdown && (
              <span style={{ color: '#facc15' }}>{state === 0 ? `Starts: ${countdown}` : countdown}</span>
            )}
            <span style={{ color: '#f87171' }}>✗ {againstPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-5">
          {body && (
            <div className="prose-sm">
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                {body}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Votes</h4>
            {[
              { label: 'For', value: forVotes, pct: forPct, color: 'bg-green-400', text: 'text-green-400' },
              { label: 'Against', value: againstVotes, pct: againstPct, color: 'bg-red-400', text: 'text-red-400' },
              { label: 'Abstain', value: abstainVotes, pct: abstainPct, color: 'bg-yellow-400', text: 'text-yellow-400' },
            ].map(({ label, value, pct, color, text }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={text}>{label}</span>
                  <span className="text-gray-400">
                    {parseFloat(formatEther(value)).toFixed(2)} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Quorum progress</span>
              <span className={quorumPct >= 100 ? 'text-green-400' : 'text-gray-400'}>
                {quorumPct.toFixed(0)}% of required
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quorumPct >= 100 ? 'bg-green-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(100, quorumPct)}%` }}
              />
            </div>
          </div>

          {votes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Voter Breakdown ({votes.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {votes.map((v, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 font-medium ${SUPPORT_COLORS[v.support] || 'text-gray-400'}`}>
                      {SUPPORT_LABELS[v.support] || '?'}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {formatVoter(v.voter)}
                    </span>
                    <span className="text-gray-600 ml-auto shrink-0">
                      {parseFloat(formatEther(v.weight)).toFixed(1)}
                    </span>
                    {v.reason && (
                      <span className="text-gray-600 italic truncate max-w-[120px]">&ldquo;{v.reason}&rdquo;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isActive && (
            <div className="border-t border-white/5 pt-4">
              <VoteButtons proposalId={proposalId} onVoted={refetchVotes} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 border-t border-white/5 pt-3">
            <div>Block start: {voteStart.toString()}</div>
            <div>Block end: {voteEnd.toString()}</div>
            <div className="col-span-2">
              ID: {proposalId.toString().slice(0, 12)}...
              <button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('proposal', proposalId.toString());
                  navigator.clipboard.writeText(url.toString()).catch(() => {});
                }}
                className="ml-2 text-blue-400/60 hover:text-blue-400 transition-colors"
              >
                Share link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
