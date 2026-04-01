'use client';

import { useChainId, useSwitchChain } from 'wagmi';
import { luksoMainnet, luksoTestnet } from '@/lib/chains';

export function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isMainnet = chainId === luksoMainnet.id;

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
      <button
        onClick={() => switchChain({ chainId: luksoMainnet.id })}
        disabled={isPending || isMainnet}
        className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] transition-all ${
          isMainnet
            ? 'bg-white text-black'
            : 'text-[var(--text-soft)] hover:text-white'
        }`}
      >
        Mainnet
      </button>
      <button
        onClick={() => switchChain({ chainId: luksoTestnet.id })}
        disabled={isPending || !isMainnet}
        className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] transition-all ${
          !isMainnet
            ? 'bg-white text-black'
            : 'text-[var(--text-soft)] hover:text-white'
        }`}
      >
        Testnet
      </button>
    </div>
  );
}
