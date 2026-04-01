'use client';

import { useChainId } from 'wagmi';
import { MAINNET_CONTRACTS, TESTNET_CONTRACTS } from '@/lib/contracts';
import { luksoMainnet, luksoTestnet } from '@/lib/chains';

export function useNetwork() {
  const chainId = useChainId();
  const isMainnet = chainId === luksoMainnet.id;
  const contracts = isMainnet ? MAINNET_CONTRACTS : TESTNET_CONTRACTS;
  const chain = isMainnet ? luksoMainnet : luksoTestnet;

  return {
    isMainnet,
    chain,
    contracts,
    governorAddress: contracts.governor,
    tokenAddress: contracts.token,
    timelockAddress: contracts.timelock,
  };
}
