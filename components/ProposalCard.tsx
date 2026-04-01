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
const SUPPORT_BG = ['bg-red-400', 'bg-green-400', 'bg-yellow-400'];

function useCountdown(targetBlock: bigint, currentBlock: bigint | undefined) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!currentBlock) return;

    const update = () => {
      const secondsLeft = Math.max(0, (Number(targetBlock) - Number(currentBlock)) * 5 - Math.floor(Date.now() / 1000) % 5);
      if (secondsLeft <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const d = Math.floor(secondsLeft / 86400);
      const h = Math.floor((secondsLeft % 86400) / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;

      if (d > 0) setTimeLeft(`${d}d ${h}h remaining`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m remaining`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s remaining`);
      else setTimeLeft(`${s}s remaining`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
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
  const { governorAddress } = useNetwork();
  const publicClient = usePublicClient();
  const [expanded, setExpanded] = useState(isHighlighted || false);
  const [votes, setVotes] = useState<VoteLog[]>([]);
  const [currentBlock, setCurrentBlock] = useState<bigint>();
  const [quorumVal, setQuorumVal] = useState<bigint>(0n);

  // Fetch current block
  useEffect(() => {
    if (!publicClient) return;
    publicClient.getBlockNumber().then(setCurrentBlock).catch(() => {});
  }, [publicClient]);

  // Fetch quorum at snapshot block
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

  // Fetch VoteCast logs when expanded
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
      fromBlock: voteStart > MAINNET_START_BLOCK ? voteStart : MAINNET_START_BLOCK,
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
  }, [expanded, publicClient, governorAddress, proposalId, voteStart]);

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

  // Extract title from description (first line)
  const lines = description.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || `Proposal ${proposalId.toString().slice(-6)}`;
  const body = lines.slice(1).join('\n').trim();

  const shortProposer = `${proposer.slice(0, 6)}...${proposer.slice(-4)}`;
  const formatVoter = (voter: string) => COUNCIL_MEMBERS[voter.toLowerCase()] || `${voter.slice(0, 8)}...${voter.slice(-4)}`;

  return (
    <div
      id={`proposal-${proposalId}`}
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
        isHighlighted ? 'ring-1 ring-white/20' : ''
      }`}
    >
      {/* Header */}
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

        {/* Vote summary bar */}
        <div className="space-y-1.5">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
            <div
              className="bg-green-400 transition-all duration-500"
              style={{ width: `${forPct}%` }}
            />
            <div
              className="bg-red-400 transition-all duration-500"
              style={{ width: `${againstPct}%` }}
            />
            <div
              className="bg-yellow-400 transition-all duration-500"
              style={{ width: `${abstainPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="text-green-400/80">✓ {forPct.toFixed(1)}%</span>
            {isActive && countdown && (
              <span className="text-yellow-400/80">{countdown}</span>
            )}
            <span className="text-red-400/80">✗ {againstPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-5">
          {/* Description */}
          {body && (
            <div className="prose-sm">
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">
                {body}
              </p>
            </div>
          )}

          {/* Vote breakdown */}
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

          {/* Quorum progress */}
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

          {/* Member votes */}
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

          {/* Vote buttons */}
          {isActive && (
            <div className="border-t border-white/5 pt-4">
              <VoteButtons proposalId={proposalId} onVoted={refetchVotes} />
            </div>
          )}

          {/* Metadata */}
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
