'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { luksoMainnet, luksoTestnet } from '@/lib/chains';

const config = createConfig({
  chains: [luksoMainnet, luksoTestnet],
  transports: {
    [luksoMainnet.id]: http('https://rpc.mainnet.lukso.network'),
    [luksoTestnet.id]: http('https://rpc.testnet.lukso.network'),
  },
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
