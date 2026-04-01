import { defineChain } from 'viem';

export const luksoMainnet = defineChain({
  id: 42,
  name: 'LUKSO',
  nativeCurrency: {
    decimals: 18,
    name: 'LYX',
    symbol: 'LYX',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.lukso.network'] },
    public: { http: ['https://rpc.mainnet.lukso.network'] },
  },
  blockExplorers: {
    default: {
      name: 'LUKSO Explorer',
      url: 'https://explorer.execution.mainnet.lukso.network',
    },
  },
});

export const luksoTestnet = defineChain({
  id: 4201,
  name: 'LUKSO Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'LYXt',
    symbol: 'LYXt',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.lukso.network'] },
    public: { http: ['https://rpc.testnet.lukso.network'] },
  },
  blockExplorers: {
    default: {
      name: 'LUKSO Testnet Explorer',
      url: 'https://explorer.execution.testnet.lukso.network',
    },
  },
  testnet: true,
});
