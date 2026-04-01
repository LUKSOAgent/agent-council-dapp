'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { isAddress } from 'viem';
import { GOVERNOR_ABI } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';

export function CreateProposalForm({ onCreated }: { onCreated?: () => void }) {
  const { isConnected } = useAccount();
  const { governorAddress } = useNetwork();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [validationError, setValidationError] = useState('');

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const rawTarget = targetAddress.trim();
    if (rawTarget && !isAddress(rawTarget)) {
      setValidationError('Target address is invalid');
      return;
    }

    setValidationError('');
    const target = (rawTarget || governorAddress) as `0x${string}`;

    writeContract({
      address: governorAddress,
      abi: GOVERNOR_ABI,
      functionName: 'propose',
      args: [
        [target],
        [0n],
        ['0x' as `0x${string}`],
        description,
      ],
    });
  };

  if (isSuccess) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center">
        <p className="text-green-400 font-medium">✓ Proposal created!</p>
        <button
          onClick={() => { setOpen(false); setDescription(''); onCreated?.(); }}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Create another
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass-button w-full py-3 text-sm font-medium text-gray-400 hover:text-white border-dashed transition-all"
      >
        + Create Proposal
      </button>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">New Proposal</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          ✕
        </button>
      </div>

      {!isConnected ? (
        <p className="text-sm text-gray-500">Connect wallet to create proposals</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="## Proposal Title&#10;&#10;Describe what this proposal does..."
              rows={5}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 resize-none font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Target address <span className="text-gray-600">(optional — defaults to governor)</span>
            </label>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => {
                setTargetAddress(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="0x..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 font-mono"
            />
          </div>

          {validationError && (
            <p className="text-xs text-red-400">{validationError}</p>
          )}

          {error && (
            <p className="text-xs text-red-400">{error.message.split('(')[0].trim()}</p>
          )}

          <button
            type="submit"
            disabled={isPending || isConfirming || !description.trim() || !!(targetAddress.trim() && !isAddress(targetAddress.trim()))}
            className="glass-button w-full py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Submit Proposal'}
          </button>
        </form>
      )}
    </div>
  );
}
