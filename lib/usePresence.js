import { useEffect, useState } from 'react';
import { getSupabase } from './supabase';

// Tracks how many people are on the page right now via Supabase Realtime
// Presence. Every open tab joins a shared channel with a unique key; the
// count is the number of distinct keys currently tracked.
//
// Returns null when Supabase isn't configured (or before the first sync),
// so callers can hide the counter until there's a real number to show.
export function usePresence(room = 'preptember') {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // Unique per tab so two tabs from the same visitor each count once.
    const key =
      (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2);

    const channel = supabase.channel(`presence:${room}`, {
      config: { presence: { key } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  return count;
}
