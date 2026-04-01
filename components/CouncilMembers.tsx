'use client';

import { useReadContracts } from 'wagmi';
import { useNetwork } from '@/hooks/useNetwork';
import { TOKEN_ABI, COUNCIL_MEMBERS_LIST } from '@/lib/contracts';

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTokens(raw: bigint | undefined): string {
  if (raw == null) return '—';
  return Number(raw / 10n ** 18n).toLocaleString();
}

interface CouncilMembersProps {
  /** Optional explorer base URL for links */
  explorerBase?: string;
}

export function CouncilMembers({ explorerBase = 'https://explorer.lukso.network' }: CouncilMembersProps) {
  const { contracts } = useNetwork();

  // Build multicall contracts array: [bal0, votes0, bal1, votes1, ...]
  const contractCalls = COUNCIL_MEMBERS_LIST.flatMap((member) => [
    {
      address: contracts.token,
      abi: TOKEN_ABI,
      functionName: 'balanceOf' as const,
      args: [member.addr as `0x${string}`],
    },
    {
      address: contracts.token,
      abi: TOKEN_ABI,
      functionName: 'getVotes' as const,
      args: [member.addr as `0x${string}`],
    },
  ]);

  const { data: results } = useReadContracts({ contracts: contractCalls });

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.16)',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '14px 18px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '3px',
            height: '16px',
            background: 'linear-gradient(to bottom, #FF2975, #9B7CFF)',
            borderRadius: '2px',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.95)',
          }}
        >
          Council Members
        </span>
      </div>

      {/* Column header */}
      <div
        style={{
          padding: '8px 18px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Member
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            textAlign: 'right',
          }}
        >
          Balance / Votes
        </span>
      </div>

      {/* Member rows */}
      {COUNCIL_MEMBERS_LIST.map((member, idx) => {
        const balResult = results?.[idx * 2];
        const votesResult = results?.[idx * 2 + 1];
        const balance = balResult?.status === 'success' ? (balResult.result as bigint) : undefined;
        const votes = votesResult?.status === 'success' ? (votesResult.result as bigint) : undefined;

        return (
          <div
            key={member.addr}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '12px',
              padding: '14px 18px',
              borderBottom: idx < COUNCIL_MEMBERS_LIST.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            {/* Left: name + address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.95)',
                }}
              >
                {member.name}
              </div>
              <a
                href={`${explorerBase}/address/${member.addr}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {shortAddr(member.addr)}
                <span style={{ fontSize: '10px', opacity: 0.6 }}>↗</span>
              </a>
            </div>

            {/* Right: balance + votes */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '2px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.95)',
                }}
              >
                {formatTokens(balance)}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {formatTokens(votes)} votes
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
