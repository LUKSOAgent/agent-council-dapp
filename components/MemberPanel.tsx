'use client';

import { COUNCIL_MEMBER_LIST } from '@/lib/contracts';
import { shortenAddress } from '@/lib/format';

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
          <article key={member.address} className="member-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">{member.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{member.role}</p>
              </div>
              <span className={`member-state ${member.status === 'active' ? 'active' : 'limited'}`}>
                {member.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{member.note}</p>
            <code className="mt-4 block text-xs text-[var(--text-soft)]">{shortenAddress(member.address, 8, 6)}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
