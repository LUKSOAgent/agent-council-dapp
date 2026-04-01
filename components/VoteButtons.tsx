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
      <p className="text-xs text-gray-500 text-center py-2">
        Connect wallet to vote
      </p>
    );
  }

  if (isSuccess || hasVoted) {
    return (
      <div className="text-center py-2">
        <span className="text-sm text-green-400">✓ Vote recorded</span>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className="text-center py-2">
        <span className="text-sm text-yellow-400 animate-pulse">Confirming transaction...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[1, 0, 2].map((support) => (
          <button
            key={support}
            onClick={() => {
              setSelected(support);
              setShowReason(true);
            }}
            disabled={isWriting}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
              selected === support ? VOTE_ACTIVE_COLORS[support] : VOTE_COLORS[support]
            }`}
          >
            <span>{VOTE_ICONS[support]}</span>
            <span>{VOTE_LABELS[support]}</span>
          </button>
        ))}
      </div>

      {showReason && selected !== null && (
        <div className="space-y-2 animate-in slide-in-from-top-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a reason (optional)"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitWithReason}
              disabled={isWriting}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${VOTE_ACTIVE_COLORS[selected]}`}
            >
              {isWriting ? 'Submitting...' : `Vote ${VOTE_LABELS[selected]}`}
            </button>
            <button
              onClick={() => { setShowReason(false); setSelected(null); }}
              className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 text-center">
          {error.message.split('(')[0].trim()}
        </p>
      )}
    </div>
  );
}
