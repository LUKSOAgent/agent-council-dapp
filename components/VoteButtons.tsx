'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { GOVERNOR_ABI } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';

interface VoteButtonsProps {
  proposalId: bigint;
  onVoted?: () => void;
}

const VOTE_LABELS = ['Against', 'For', 'Abstain'];
const VOTE_COLORS = [
  'text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/50',
  'text-green-400 border-green-400/30 hover:bg-green-400/10 hover:border-green-400/50',
  'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 hover:border-yellow-400/50',
];
const VOTE_ACTIVE_COLORS = [
  'bg-red-400/20 border-red-400/60 text-red-300',
  'bg-green-400/20 border-green-400/60 text-green-300',
  'bg-yellow-400/20 border-yellow-400/60 text-yellow-300',
];
const VOTE_ICONS = ['✗', '✓', '○'];

export function VoteButtons({ proposalId, onVoted }: VoteButtonsProps) {
  const { address, isConnected } = useAccount();
  const { governorAddress } = useNetwork();
  const [selected, setSelected] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const { data: hasVoted } = useReadContract({
    address: governorAddress,
    abi: GOVERNOR_ABI,
    functionName: 'hasVoted',
    args: address ? [proposalId, address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending: isWriting, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  useEffect(() => {
    if (isSuccess) onVoted?.();
  }, [isSuccess, onVoted]);

  const submitVote = (support: number, voteReason: string) => {
    writeContract({
      address: governorAddress,
      abi: GOVERNOR_ABI,
      functionName: 'castVoteWithReason',
      args: [proposalId, support, voteReason],
    });
  };

  const handleSubmitWithReason = () => {
    if (selected === null) return;
    submitVote(selected, reason);
    setShowReason(false);
  };

  if (!isConnected) {
    return (
      <p className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-center text-sm text-[var(--text-muted)]">
        Connect wallet to vote.
      </p>
    );
  }

  if (isSuccess || hasVoted) {
    return (
      <div className="text-center py-2">
        <span className="text-sm text-[var(--accent)]">Vote recorded.</span>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className="text-center py-2">
        <span className="text-sm animate-pulse text-[var(--warning)]">Confirming transaction...</span>
      </div>
    );
  }

  return (
    <div className="vote-action-panel">
      <div className="vote-action-header">
        <div>
          <span className="section-kicker">Cast vote</span>
          <h4 className="mt-2 text-lg font-semibold text-white">Choose support and submit a reason if needed.</h4>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[1, 0, 2].map((support) => (
          <button
            key={support}
            onClick={() => {
              setSelected(support);
              setShowReason(true);
            }}
            disabled={isWriting}
            className={`flex items-center justify-center gap-2 rounded-[20px] border px-4 py-4 text-sm font-medium transition-all disabled:opacity-50 ${
              selected === support ? VOTE_ACTIVE_COLORS[support] : VOTE_COLORS[support]
            }`}
          >
            <span>{VOTE_ICONS[support]}</span>
            <span>{VOTE_LABELS[support]}</span>
          </button>
        ))}
      </div>

      {showReason && selected !== null && (
        <div className="animate-in slide-in-from-top-2 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a reason (optional)"
            rows={2}
            className="field-input resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitWithReason}
              disabled={isWriting}
              className={`flex-1 rounded-[18px] border px-4 py-3 text-sm font-medium transition-all disabled:opacity-50 ${VOTE_ACTIVE_COLORS[selected]}`}
            >
              {isWriting ? 'Submitting...' : `Vote ${VOTE_LABELS[selected]}`}
            </button>
            <button
              onClick={() => { setShowReason(false); setSelected(null); }}
              className="rounded-[18px] px-4 py-3 text-sm text-[var(--text-soft)] transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-xs text-red-300">
          {error.message.split('(')[0].trim()}
        </p>
      )}
    </div>
  );
}
