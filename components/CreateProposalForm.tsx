'use client';

import { useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
      <div className="surface-panel compact-panel text-center">
        <p className="text-sm font-semibold text-[var(--accent)]">Proposal created.</p>
        <button
          onClick={() => { setOpen(false); setDescription(''); onCreated?.(); }}
          className="mt-3 text-sm text-[var(--text-soft)] transition-colors hover:text-white"
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
        className="surface-panel compact-panel w-full border border-dashed border-white/15 bg-white/4 py-4 text-left transition-all hover:border-[var(--accent)]/40 hover:bg-white/6"
      >
        <span className="section-kicker">Authoring</span>
        <span className="mt-2 block text-lg font-semibold text-white">Create proposal</span>
        <span className="mt-1 block text-sm text-[var(--text-muted)]">
          Open a new governance action with markdown context and optional target override.
        </span>
      </button>
    );
  }

  return (
    <div className="surface-panel compact-panel space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="section-kicker">Authoring</span>
          <h3 className="mt-2 text-xl font-semibold text-white">New proposal</h3>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[var(--text-soft)] transition-colors hover:text-white"
        >
          ✕
        </button>
      </div>

      {!isConnected ? (
        <p className="text-sm text-[var(--text-muted)]">Connect a wallet to create proposals.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="## Proposal Title&#10;&#10;Describe what this proposal does..."
              rows={5}
              required
              className="field-input min-h-36 resize-y font-mono"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
              Target address <span className="normal-case tracking-normal text-[var(--text-soft)]">(optional, defaults to governor)</span>
            </label>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => {
                setTargetAddress(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="0x..."
              className="field-input font-mono"
            />
          </div>

          {validationError && (
            <p className="text-xs text-red-300">{validationError}</p>
          )}

          {error && (
            <p className="text-xs text-red-300">{error.message.split('(')[0].trim()}</p>
          )}

          <button
            type="submit"
            disabled={isPending || isConfirming || !description.trim() || !!(targetAddress.trim() && !isAddress(targetAddress.trim()))}
            className="action-button w-full justify-center disabled:opacity-50"
          >
            {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Submit Proposal'}
          </button>
        </form>
      )}
    </div>
  );
}
