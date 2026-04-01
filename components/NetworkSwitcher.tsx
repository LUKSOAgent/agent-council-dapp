'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { luksoMainnet, luksoTestnet } from '@/lib/chains';

export function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isMainnet = chainId === luksoMainnet.id;

  return (
    <div className="flex items-center gap-1 glass-card px-2 py-1">
      <button
        onClick={() => switchChain({ chainId: luksoMainnet.id })}
        disabled={isPending || isMainnet}
        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
          isMainnet
            ? 'bg-white/10 text-white'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        Mainnet
      </button>
      <button
        onClick={() => switchChain({ chainId: luksoTestnet.id })}
        disabled={isPending || !isMainnet}
        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
          !isMainnet
            ? 'bg-white/10 text-white'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        Testnet
      </button>
    </div>
  );
}
