import { formatEther } from 'viem';

export function shortenAddress(address: string, start = 6, end = 4) {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatVoteAmount(value: bigint, _digits = 2) {
  const n = Number.parseFloat(formatEther(value));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

export function formatCompactTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sanitizeProposalText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function splitProposalDescription(description: string, fallbackId: bigint) {
  const safeDescription = sanitizeProposalText(description);
  const lines = safeDescription.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || `Proposal ${fallbackId.toString().slice(-6)}`;
  const summary = lines.slice(1).join('\n').trim();

  return { title, summary };
}
