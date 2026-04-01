'use client';

import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { COUNCIL_MEMBERS, GOVERNOR_ABI, MAINNET_START_BLOCK, PROPOSAL_STATES, PROPOSAL_STATE_COLORS, COUNCIL_MEMBER_LIST } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';
import { formatVoteAmount, shortenAddress, splitProposalDescription } from '@/lib/format';
import { VoteButtons } from './VoteButtons';
import { useLSP3Profile } from '@/hooks/useLSP3Profile';

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

// Small avatar for a single voter address
function VoterAvatar({ address, name }: { address: string; name: string }) {
  const profile = useLSP3Profile(address);
  const displayName = profile.name ?? name;
  return (
    <div title={displayName} style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)' }}>
      {profile.avatar ? (
        <Image src={profile.avatar} alt={displayName} width={28} height={28} style={{ width: 28, height: 28, objectFit: 'cover' }} unoptimized />
      ) : (
        <div style={{ width: 28, height: 28, background: 'rgba(254,0,91,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// Row of voter avatars for a given support type
function VoterAvatarStrip({ votes, support }: { votes: VoteLog[]; support: number }) {
  const filtered = votes.filter(v => v.support === support);
  if (filtered.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
      {filtered.map(v => {
        const member = COUNCIL_MEMBER_LIST.find(m => m.address.toLowerCase() === v.voter.toLowerCase());
        return <VoterAvatar key={v.voter} address={v.voter} name={member?.name ?? shortenAddress(v.voter, 4, 3)} />;
      })}
    </div>
  );
}

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
  const { address, isConnected } = useAccount();
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

  const { data: hasVoted, isLoading: isCheckingHasVoted } = useReadContract({
    address: governorAddress,
    abi: GOVERNOR_ABI,
    functionName: 'hasVoted',
    args: address ? [proposalId, address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!publicClient) return;
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

  const { title, summary } = splitProposalDescription(description, proposalId);
  const formatVoter = (voter: string) => COUNCIL_MEMBERS[voter.toLowerCase()] || shortenAddress(voter, 8, 4);
  const proposalUrl = typeof window === 'undefined'
    ? ''
    : `${window.location.origin}${window.location.pathname}?proposal=${proposalId.toString()}`;

  return (
    <div
      id={`proposal-${proposalId}`}
      className={`proposal-card transition-all duration-300 ${
        isHighlighted ? 'ring-1 ring-[var(--accent)] shadow-[0_0_0_1px_rgba(254,0,91,0.3),0_25px_70px_rgba(0,0,0,0.45)]' : ''
      }`}
    >
      <div
        className="cursor-pointer select-none p-6"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`state-pill ${stateColor}`}>{stateName}</span>
              {isActive && countdown && <span className="countdown-pill">{countdown}</span>}
              <span className="meta-pill">#{proposalId.toString().slice(-6)}</span>
            </div>
            <h3 className="text-xl font-semibold leading-tight text-white sm:text-2xl">
              {title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              {summary ? (
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h4 style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text)',marginTop:'0.75rem',marginBottom:'0.25rem'}}>{children}</h4>,
                    h2: ({children}) => <h4 style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text)',marginTop:'0.75rem',marginBottom:'0.25rem'}}>{children}</h4>,
                    h3: ({children}) => <h5 style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text)',marginTop:'0.5rem',marginBottom:'0.2rem'}}>{children}</h5>,
                    p: ({children}) => <p style={{marginBottom:'0.4rem',lineHeight:'1.6'}}>{children}</p>,
                    strong: ({children}) => <strong style={{color:'var(--text)',fontWeight:600}}>{children}</strong>,
                    code: ({children}) => <code style={{fontSize:'0.75rem',background:'rgba(255,255,255,0.06)',padding:'0.1em 0.3em',borderRadius:'3px',wordBreak:'break-all'}}>{children}</code>,
                    a: ({href,children}) => <a href={href} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)',textDecoration:'underline'}}>{children}</a>,
                    ul: ({children}) => <ul style={{paddingLeft:'1rem',marginBottom:'0.4rem'}}>{children}</ul>,
                    li: ({children}) => <li style={{marginBottom:'0.2rem'}}>{children}</li>,
                  }}
                >{summary}</ReactMarkdown>
              ) : 'No supporting description provided.'}
            </p>
          </div>

          <div className="grid min-w-[220px] gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div>
              <span className="detail-label">Proposer</span>
              <p className="detail-value">{shortenAddress(proposer)}</p>
            </div>
            {isActive && isConnected && (
              <div>
                <span className="detail-label">Wallet status</span>
                <p className="detail-value">
                  {isCheckingHasVoted ? 'Checking vote...' : hasVoted ? 'Already voted' : 'Vote available'}
                </p>
              </div>
            )}
            <div>
              <span className="detail-label">Window</span>
              <p className="detail-value">
                {voteStart.toString()} to {voteEnd.toString()}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-soft)]">
              <span>{expanded ? 'Collapse details' : 'Expand details'}</span>
              <span>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="vote-strip">
            <div
              className="bg-[#22c55e] transition-all duration-500"
              style={{ width: `${forPct}%` }}
            />
            <div
              className="bg-[var(--danger)] transition-all duration-500"
              style={{ width: `${againstPct}%` }}
            />
            <div
              className="bg-[var(--warning)] transition-all duration-500"
              style={{ width: `${abstainPct}%` }}
            />
          </div>

          <div className="summary-grid">
            <div className="summary-tile">
              <span className="summary-label">For</span>
              <strong className="summary-value text-[#22c55e]">{forPct.toFixed(1)}%</strong>
              <span className="summary-subtle">{formatVoteAmount(forVotes)} votes</span>
              <VoterAvatarStrip votes={votes} support={1} />
            </div>
            <div className="summary-tile">
              <span className="summary-label">Against</span>
              <strong className="summary-value text-[var(--danger)]">{againstPct.toFixed(1)}%</strong>
              <span className="summary-subtle">{formatVoteAmount(againstVotes)} votes</span>
              <VoterAvatarStrip votes={votes} support={0} />
            </div>
            <div className="summary-tile">
              <span className="summary-label">Abstain</span>
              <strong className="summary-value text-[var(--warning)]">{abstainPct.toFixed(1)}%</strong>
              <span className="summary-subtle">{formatVoteAmount(abstainVotes)} votes</span>
              <VoterAvatarStrip votes={votes} support={2} />
            </div>
            <div className="summary-tile">
              <span className="summary-label">Quorum</span>
              <strong className="summary-value text-white">{quorumPct.toFixed(0)}%</strong>
              <span className="summary-subtle">{quorumPct >= 100 ? 'Reached' : 'In progress'}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-6 pt-0">
          <div className="detail-grid">
            <section className="detail-panel">
              <div className="detail-panel-header">
                <h4 className="detail-panel-title">Vote table</h4>
                <span className="detail-panel-copy">Current on-chain weight</span>
              </div>

              <div className="vote-table">
                {[
                  { label: 'For', value: forVotes, pct: forPct, color: 'bg-[#22c55e]', text: 'text-[#22c55e]' },
                  { label: 'Against', value: againstVotes, pct: againstPct, color: 'bg-[var(--danger)]', text: 'text-[var(--danger)]' },
                  { label: 'Abstain', value: abstainVotes, pct: abstainPct, color: 'bg-[var(--warning)]', text: 'text-[var(--warning)]' },
                ].map(({ label, value, pct, color, text }) => (
                  <div key={label} className="vote-row">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-sm font-medium ${text}`}>{label}</span>
                      <span className="text-sm text-[var(--text-soft)]">
                        {formatVoteAmount(value)} votes, {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="vote-row-track">
                      <div className={`vote-row-fill ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="quorum-panel">
                <div className="flex items-center justify-between gap-3">
                  <span className="detail-label">Quorum progress</span>
                  <span className={`text-sm font-medium ${quorumPct >= 100 ? 'text-[#22c55e]' : 'text-white'}`}>
                    {quorumPct.toFixed(0)}%
                  </span>
                </div>
                <div className="vote-row-track">
                  <div
                    className={`vote-row-fill ${quorumPct >= 100 ? 'bg-[#22c55e]' : 'bg-white'}`}
                    style={{ width: `${Math.min(quorumPct, 100)}%` }}
                  />
                </div>
              </div>
            </section>

            <section className="detail-panel">
              <div className="detail-panel-header">
                <h4 className="detail-panel-title">Council breakdown</h4>
                <span className="detail-panel-copy">{votes.length} recorded vote{votes.length !== 1 ? 's' : ''}</span>
              </div>

              {votes.length > 0 ? (
                <div className="breakdown-list">
                  {votes.map((vote, index) => (
                    <div key={`${vote.voter}-${index}`} className="breakdown-row">
                      <div>
                        <p className="text-sm font-medium text-white">{formatVoter(vote.voter)}</p>
                        <p className={`mt-1 text-xs ${SUPPORT_COLORS[vote.support] || 'text-[var(--text-soft)]'}`}>
                          {SUPPORT_LABELS[vote.support] || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">{formatVoteAmount(vote.weight, 1)}</p>
                        {vote.reason && (
                          <p className="mt-1 max-w-[16rem] text-xs italic leading-5 text-[var(--text-soft)]">
                            &ldquo;{vote.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-mini-panel">
                  No cast votes recorded yet.
                </div>
              )}
            </section>
          </div>

          {isActive && (
            <div className="mt-6">
              <VoteButtons proposalId={proposalId} onVoted={refetchVotes} />
            </div>
          )}

          <div className="meta-bar">
            <div>
              <span className="detail-label">Proposal ID</span>
              <p className="detail-value">{proposalId.toString()}</p>
            </div>
            <div>
              <span className="detail-label">Vote start</span>
              <p className="detail-value">{voteStart.toString()}</p>
            </div>
            <div>
              <span className="detail-label">Vote end</span>
              <p className="detail-value">{voteEnd.toString()}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(proposalUrl).catch(() => {})}
              className="control-button justify-self-start lg:justify-self-end"
            >
              Copy link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
