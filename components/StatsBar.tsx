'use client';

import { useReadContract } from 'wagmi';
import { useNetwork } from '@/hooks/useNetwork';
import { GOVERNOR_ABI, TOKEN_ABI, TIMELOCK_ABI } from '@/lib/contracts';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div
      className="stat-card"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '16px',
        padding: '14px 16px',
        transition: 'border-color 0.2s',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '4px',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function blocksToHuman(blocks: bigint): string {
  const BLOCKS_PER_SEC = 5;
  const secs = Number(blocks) * BLOCKS_PER_SEC;
  if (secs < 120) return `~${secs}s`;
  if (secs < 7200) return `~${Math.round(secs / 60)}min`;
  if (secs < 172800) return `~${Math.round(secs / 3600)}h`;
  return `~${Math.round(secs / 86400)}d`;
}

interface StatsBarProps {
  proposalCount: number;
}

export function StatsBar({ proposalCount }: StatsBarProps) {
  const { contracts } = useNetwork();

  const { data: totalSupply } = useReadContract({
    address: contracts.token,
    abi: TOKEN_ABI,
    functionName: 'totalSupply',
  });

  const { data: votingPeriod } = useReadContract({
    address: contracts.governor,
    abi: GOVERNOR_ABI,
    functionName: 'votingPeriod',
  });

  // quorum needs a block number — use 0n as a safe fallback (reads quorum at genesis, ok for display)
  const { data: quorumAbs } = useReadContract({
    address: contracts.governor,
    abi: GOVERNOR_ABI,
    functionName: 'quorum',
    args: [0n],
  });

  const { data: timelockDelay } = useReadContract({
    address: contracts.timelock,
    abi: TIMELOCK_ABI,
    functionName: 'getMinDelay',
  });

  // Derived values
  const supplyDisplay = totalSupply != null
    ? Number(totalSupply / 10n ** 18n).toLocaleString()
    : '—';

  const quorumDisplay = (() => {
    if (quorumAbs == null || totalSupply == null || totalSupply === 0n) return '—';
    const pct = Number((quorumAbs * 10000n) / totalSupply) / 100;
    return `${pct.toFixed(1)}%`;
  })();

  const votingPeriodDisplay = votingPeriod != null ? blocksToHuman(votingPeriod) : '—';

  const timelockDisplay = (() => {
    if (timelockDelay == null) return '—';
    const secs = Number(timelockDelay);
    const hours = Math.round(secs / 3600);
    return hours >= 24 ? `${Math.round(hours / 24)}d` : `${hours}h`;
  })();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginBottom: '20px',
      }}
      className="stats-bar-grid"
    >
      <style>{`
        @media (min-width: 480px) { .stats-bar-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 680px) { .stats-bar-grid { grid-template-columns: repeat(5, 1fr) !important; } }
      `}</style>
      <StatCard label="Total Supply" value={supplyDisplay} sub="governance tokens" />
      <StatCard label="Quorum" value={quorumDisplay} sub="of total supply" />
      <StatCard label="Voting Period" value={votingPeriodDisplay} sub="per proposal" />
      <StatCard label="Timelock" value={timelockDisplay} sub="execution delay" />
      <StatCard label="Proposals" value={proposalCount.toString()} sub="on-chain" />
    </div>
  );
}
