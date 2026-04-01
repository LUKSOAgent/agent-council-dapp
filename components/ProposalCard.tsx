'use client';

import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { COUNCIL_MEMBERS, GOVERNOR_ABI, MAINNET_START_BLOCK, PROPOSAL_STATES, COUNCIL_MEMBER_LIST } from '@/lib/contracts';
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
const SUPPORT_COLORS_INLINE = ['#ff6b7a', '#22c55e', '#ffc857'];

// State pill inline styles
const STATE_PILL_STYLES: Record<number, React.CSSProperties> = {
  0: { color: '#ffc857', borderColor: 'rgba(255,200,87,0.3)', background: 'rgba(255,200,87,0.1)' },
  1: { color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)' },
  2: { color: '#9ca3af', borderColor: 'rgba(156,163,175,0.3)', background: 'rgba(156,163,175,0.1)' },
  3: { color: '#ff6b7a', borderColor: 'rgba(255,107,122,0.3)', background: 'rgba(255,107,122,0.1)' },
  4: { color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.1)' },
  5: { color: '#c084fc', borderColor: 'rgba(192,132,252,0.3)', background: 'rgba(192,132,252,0.1)' },
  6: { color: '#fb923c', borderColor: 'rgba(251,146,60,0.3)', background: 'rgba(251,146,60,0.2)' },
  7: { color: '#34d399', borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)' },
};

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
  const statePillStyle = state >= 0 ? STATE_PILL_STYLES[state] : { color: '#9ca3af', borderColor: 'rgba(156,163,175,0.3)', background: 'rgba(156,163,175,0.1)' };

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

  // Find how connected wallet voted from logs
  const myVote = address
    ? votes.find((v) => v.voter.toLowerCase() === address.toLowerCase())
    : undefined;

  const pillBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    border: '1px solid',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  };

  return (
    <div
      id={`proposal-${proposalId}`}
      className="proposal-card"
      style={{
        transition: 'all 0.3s',
        ...(isHighlighted ? {
          outline: '1px solid rgba(254,0,91,0.45)',
          boxShadow: '0 0 0 1px rgba(254,0,91,0.3), 0 25px 70px rgba(0,0,0,0.45)',
        } : {}),
      }}
    >
      <div
        style={{ cursor: 'pointer', userSelect: 'none', padding: '24px' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header: title + detail panel */}
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Left: title area */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span style={{ ...pillBase, ...statePillStyle }}>{stateName}</span>
              {isActive && countdown && (
                <span style={{ ...pillBase, background: 'rgba(255,255,255,0.05)', color: 'rgba(245,245,245,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  {countdown}
                </span>
              )}
              <span style={{ ...pillBase, background: 'rgba(255,255,255,0.05)', color: 'rgba(245,245,245,0.7)', borderColor: 'rgba(255,255,255,0.08)' }}>
                #{proposalId.toString().slice(-6)}
              </span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', fontWeight: 600, lineHeight: '1.2', color: 'white', margin: '0 0 12px 0' }}>
              {title}
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-muted)', maxWidth: '640px', margin: 0 }}>
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

          {/* Right: detail info panel */}
          <div style={{ minWidth: '220px', display: 'grid', gap: '12px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
            <div>
              <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>Proposer</span>
              <p style={{ display: 'block', marginTop: '6px', color: 'white', wordBreak: 'break-word', margin: '6px 0 0 0' }}>{shortenAddress(proposer)}</p>
            </div>
            {isActive && isConnected && (
              <div>
                <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>Wallet status</span>
                <p style={{ display: 'block', marginTop: '6px', color: 'white', margin: '6px 0 0 0' }}>
                  {isCheckingHasVoted ? 'Checking vote...' : hasVoted ? 'Already voted' : 'Vote available'}
                </p>
              </div>
            )}
            <div>
              <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>Window</span>
              <p style={{ display: 'block', marginTop: '6px', color: 'white', margin: '6px 0 0 0' }}>
                {voteStart.toString()} to {voteEnd.toString()}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-soft)' }}>
              <span>{expanded ? 'Collapse details' : 'Expand details'}</span>
              <span>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>
        </div>

        {/* Vote strip + summary tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="vote-strip">
            <div style={{ width: `${forPct}%`, background: '#22c55e', transition: 'width 500ms' }} />
            <div style={{ width: `${againstPct}%`, background: 'var(--danger)', transition: 'width 500ms' }} />
            <div style={{ width: `${abstainPct}%`, background: 'var(--warning)', transition: 'width 500ms' }} />
          </div>

          <div className="summary-grid">
            <div className="summary-tile">
              <span className="summary-label">For</span>
              <strong className="summary-value" style={{ color: '#22c55e' }}>{forPct.toFixed(1)}%</strong>
              <span className="summary-subtle">{formatVoteAmount(forVotes)} votes</span>
              <VoterAvatarStrip votes={votes} support={1} />
            </div>
            <div className="summary-tile">
              <span className="summary-label">Against</span>
              <strong className="summary-value" style={{ color: 'var(--danger)' }}>{againstPct.toFixed(1)}%</strong>
              <span className="summary-subtle">{formatVoteAmount(againstVotes)} votes</span>
              <VoterAvatarStrip votes={votes} support={0} />
            </div>
            <div className="summary-tile">
              <span className="summary-label">Abstain</span>
              <strong className="summary-value" style={{ color: 'var(--warning)' }}>{abstainPct.toFixed(1)}%</strong>
              <span className="summary-subtle">{formatVoteAmount(abstainVotes)} votes</span>
              <VoterAvatarStrip votes={votes} support={2} />
            </div>
            <div className="summary-tile">
              <span className="summary-label">Quorum</span>
              <strong className="summary-value" style={{ color: 'white' }}>{quorumPct.toFixed(0)}%</strong>
              <span className="summary-subtle">{quorumPct >= 100 ? 'Reached' : 'In progress'}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0 24px 24px 24px' }}>
          <div className="detail-grid">
            {/* Vote table */}
            <section className="detail-panel">
              <div className="detail-panel-header">
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>Vote table</h4>
                <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Current on-chain weight</span>
              </div>

              <div className="vote-table">
                {[
                  { label: 'For', value: forVotes, pct: forPct, barColor: '#22c55e', textColor: '#22c55e' },
                  { label: 'Against', value: againstVotes, pct: againstPct, barColor: 'var(--danger)', textColor: 'var(--danger)' },
                  { label: 'Abstain', value: abstainVotes, pct: abstainPct, barColor: 'var(--warning)', textColor: 'var(--warning)' },
                ].map(({ label, value, pct, barColor, textColor }) => (
                  <div key={label} className="vote-row">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: textColor }}>{label}</span>
                      <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>
                        {formatVoteAmount(value)} votes, {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="vote-row-track">
                      <div className="vote-row-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="quorum-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>
                    Quorum progress
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: quorumPct >= 100 ? '#22c55e' : 'white' }}>
                    {quorumPct.toFixed(0)}%
                  </span>
                </div>
                <div className="vote-row-track">
                  <div
                    className="vote-row-fill"
                    style={{ width: `${Math.min(quorumPct, 100)}%`, background: quorumPct >= 100 ? '#22c55e' : 'white' }}
                  />
                </div>
              </div>
            </section>

            {/* Council breakdown */}
            <section className="detail-panel">
              <div className="detail-panel-header">
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>Council breakdown</h4>
                <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>{votes.length} recorded vote{votes.length !== 1 ? 's' : ''}</span>
              </div>

              {votes.length > 0 ? (
                <div className="breakdown-list">
                  {votes.map((vote, index) => (
                    <div key={`${vote.voter}-${index}`} className="breakdown-row">
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'white', margin: 0 }}>{formatVoter(vote.voter)}</p>
                        <p style={{ marginTop: '4px', fontSize: '12px', color: SUPPORT_COLORS_INLINE[vote.support] || 'var(--text-soft)', margin: '4px 0 0 0' }}>
                          {SUPPORT_LABELS[vote.support] || 'Unknown'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', color: 'white', margin: 0 }}>{formatVoteAmount(vote.weight, 1)}</p>
                        {vote.reason && (
                          <p style={{ marginTop: '4px', maxWidth: '256px', fontSize: '12px', fontStyle: 'italic', lineHeight: '1.5', color: 'var(--text-soft)', margin: '4px 0 0 0' }}>
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

          {/* Vote actions */}
          {isActive && (
            <div style={{ marginTop: '24px' }}>
              {hasVoted ? (
                <div style={{
                  borderRadius: '22px',
                  border: '1px solid rgba(254,0,91,0.3)',
                  background: 'rgba(254,0,91,0.1)',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '14px', color: 'var(--accent)' }}>
                    {myVote !== undefined
                      ? `You voted — ${SUPPORT_LABELS[myVote.support]}`
                      : 'This wallet already voted on this proposal.'}
                  </span>
                </div>
              ) : (
                <VoteButtons proposalId={proposalId} onVoted={refetchVotes} />
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="meta-bar">
            <div>
              <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>
                Proposal ID
              </span>
              <p style={{ display: 'block', marginTop: '6px', color: 'white', wordBreak: 'break-word', margin: '6px 0 0 0' }}>
                {proposalId.toString()}
              </p>
            </div>
            <div>
              <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>
                Vote start
              </span>
              <p style={{ display: 'block', marginTop: '6px', color: 'white', margin: '6px 0 0 0' }}>
                {voteStart.toString()}
              </p>
            </div>
            <div>
              <span style={{ display: 'inline-block', fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>
                Vote end
              </span>
              <p style={{ display: 'block', marginTop: '6px', color: 'white', margin: '6px 0 0 0' }}>
                {voteEnd.toString()}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(proposalUrl).catch(() => {})}
              className="control-button"
              style={{ justifySelf: 'start' }}
            >
              Copy link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
