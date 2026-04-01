'use client';

import Image from 'next/image';
import { COUNCIL_MEMBER_LIST } from '@/lib/contracts';
import { shortenAddress } from '@/lib/format';
import { useLSP3Profile } from '@/hooks/useLSP3Profile';

function MemberCard({ member }: { member: typeof COUNCIL_MEMBER_LIST[number] }) {
  const profile = useLSP3Profile(member.address);
  const displayName = profile.name ?? member.name;

  return (
    <article className="member-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {profile.avatar ? (
            <Image
              src={profile.avatar}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}
              unoptimized
            />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(254,0,91,0.15)',
              border: '1px solid rgba(254,0,91,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--accent)',
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-white">{displayName}</h3>
            <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-white/35">{member.role}</p>
          </div>
        </div>
        <span className={`member-state ${member.status === 'active' ? 'active' : 'limited'}`}>
          {member.status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{member.note}</p>
      <code className="mt-4 block text-xs text-[var(--text-soft)]">{shortenAddress(member.address, 8, 6)}</code>
    </article>
  );
}

export function MemberPanel() {
  return (
    <section className="surface-panel compact-panel">
      <div className="section-header compact">
        <div>
          <span className="section-kicker">Council members</span>
          <h2 className="section-title">Voting roster</h2>
        </div>
      </div>

      <div className="member-list">
        {COUNCIL_MEMBER_LIST.map((member) => (
          <MemberCard key={member.address} member={member} />
        ))}
      </div>
    </section>
  );
}
