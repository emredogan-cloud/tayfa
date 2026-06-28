import { describe, expect, it } from 'vitest';
import { checkActionAllowed, meetsLevel } from './verification.js';

describe('meetsLevel', () => {
  it('ranks none < phone < id < id_live', () => {
    expect(meetsLevel('id_live', 'phone')).toBe(true);
    expect(meetsLevel('phone', 'id_live')).toBe(false);
    expect(meetsLevel('id', 'id')).toBe(true);
  });
});

describe('checkActionAllowed — step-up gating', () => {
  it('lets a phone-verified user browse, rsvp, chat, and create events', () => {
    for (const action of ['browse', 'rsvp', 'group_chat', 'create_event'] as const) {
      expect(checkActionAllowed(action, 'phone').allowed).toBe(true);
    }
  });

  it('requires Verified+ (id_live) to host and to DM', () => {
    const host = checkActionAllowed('host_event', 'phone');
    expect(host.allowed).toBe(false);
    if (!host.allowed) expect(host.required).toBe('id_live');

    const dm = checkActionAllowed('send_dm', 'id');
    expect(dm.allowed).toBe(false);
    if (!dm.allowed) expect(dm.required).toBe('id_live');

    expect(checkActionAllowed('host_event', 'id_live').allowed).toBe(true);
    expect(checkActionAllowed('send_dm', 'id_live').allowed).toBe(true);
  });
});
