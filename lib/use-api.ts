"use client";

import { useCallback, useSyncExternalStore } from "react";

// A tiny shared GET cache (no dependency). Components using the same URL share one request and one result,
// so e.g. the home page and /pesan fetch the catalog only once. Stale data stays visible while it revalidates.

type Snap<T> = { data: T | undefined; error: boolean; fetching: boolean; at: number };

const TTL_MS = 30_000;
const TIMEOUT_MS = 20_000;
const LOADING: Snap<never> = { data: undefined, error: false, fetching: true, at: 0 };

const snaps = new Map<string, Snap<unknown>>();
const subs = new Map<string, Set<() => void>>();
const inflight = new Set<string>();

function emit(url: string) {
  subs.get(url)?.forEach((fn) => fn());
}

function load(url: string) {
  if (inflight.has(url)) return;
  inflight.add(url);
  const prev = snaps.get(url);
  snaps.set(url, { data: prev?.data, error: false, fetching: true, at: prev?.at ?? 0 });
  emit(url);

  fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((data) => snaps.set(url, { data, error: false, fetching: false, at: Date.now() }))
    .catch(() => snaps.set(url, { data: prev?.data, error: true, fetching: false, at: prev?.at ?? 0 }))
    .finally(() => {
      inflight.delete(url);
      emit(url);
    });
}

export type ApiState<T> = {
  data: T | undefined;
  /** True while a request is running (first load or background refresh). Use it to block submitting. */
  fetching: boolean;
  /** The last request failed (data may still hold the previous result). */
  error: boolean;
  retry: () => void;
};

export function useApi<T>(url: string): ApiState<T> {
  const subscribe = useCallback(
    (cb: () => void) => {
      let set = subs.get(url);
      if (!set) subs.set(url, (set = new Set()));
      set.add(cb);
      const snap = snaps.get(url);
      if (!snap || (!snap.fetching && Date.now() - snap.at > TTL_MS)) load(url);
      return () => {
        set.delete(cb);
      };
    },
    [url],
  );
  const snap = useSyncExternalStore(
    subscribe,
    () => (snaps.get(url) as Snap<T> | undefined) ?? (LOADING as Snap<T>),
    () => LOADING as Snap<T>,
  );
  const retry = useCallback(() => load(url), [url]);
  return { data: snap.data, fetching: snap.fetching, error: snap.error, retry };
}
