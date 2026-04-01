import { formatEther } from 'viem';

export function shortenAddress(address: string, start = 6, end = 4) {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatVoteAmount(value: bigint, digits = 2) {
  return Number.parseFloat(formatEther(value)).toFixed(digits);
}

export function formatCompactTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function splitProposalDescription(description: string, fallbackId: bigint) {
  const lines = description.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || `Proposal ${fallbackId.toString().slice(-6)}`;
  const summary = lines.slice(1).join('\n').trim();

  return { title, summary };
}
