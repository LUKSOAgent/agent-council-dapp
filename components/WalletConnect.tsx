'use client';

import { useAccount, useConnect, useDisconnect, useReadContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { TOKEN_ABI } from '@/lib/contracts';
import { useNetwork } from '@/hooks/useNetwork';
import { formatVoteAmount, shortenAddress } from '@/lib/format';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { tokenAddress } = useNetwork();

  const { data: votingPower } = useReadContract({
    address: tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: delegates } = useReadContract({
    address: tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const formattedPower = votingPower ? formatVoteAmount(votingPower) : '0';

  const needsDelegate =
    address && delegates && delegates.toLowerCase() === '0x0000000000000000000000000000000000000000';

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {needsDelegate && (
          <span className="rounded-full border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-3 py-1 text-xs text-[var(--warning)]">
            Delegate tokens to vote
          </span>
        )}
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{shortenAddress(address)}</div>
            <div className="text-xs text-[var(--text-soft)]">{formattedPower} votes</div>
          </div>
          <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <button
            onClick={() => disconnect()}
            className="ml-1 text-xs text-[var(--text-soft)] transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        className="action-button disabled:opacity-50"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <p className="text-[11px] text-[var(--text-soft)]">
        Injected wallet only for now. UP browser extension works.
      </p>
    </div>
  );
}
