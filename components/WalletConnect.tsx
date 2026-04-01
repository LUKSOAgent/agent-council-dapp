'use client';

import { useAccount, useConnect, useDisconnect, useReadContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { TOKEN_ABI } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useNetwork } from '@/hooks/useNetwork';

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

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formattedPower = votingPower
    ? parseFloat(formatEther(votingPower)).toFixed(2)
    : '0';

  const needsDelegate =
    address && delegates && delegates.toLowerCase() === '0x0000000000000000000000000000000000000000';

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {needsDelegate && (
          <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-lg">
            ⚠ Delegate tokens to vote
          </span>
        )}
        <div className="glass-card px-3 py-2 flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-white">{shortAddress(address)}</div>
            <div className="text-xs text-gray-400">{formattedPower} votes</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <button
            onClick={() => disconnect()}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="glass-button px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-all disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
