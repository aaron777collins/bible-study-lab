import { useEffect, useState } from "react";
import { useStoreStatus } from "./db";
import { readMeta, shouldRemindExport, type MetaState } from "./meta";

/** Run an async query against the store and re-run it after every write. */
export function useStoreQuery<T>(query: () => Promise<T>, initial: T, deps: unknown[] = []): { data: T; loading: boolean } {
  const version = useStoreStatus((s) => s.version);
  const [state, setState] = useState<{ data: T; loading: boolean }>({ data: initial, loading: true });
  useEffect(() => {
    let alive = true;
    query()
      .then((d) => alive && setState({ data: d, loading: false }))
      .catch(() => alive && setState((s) => ({ ...s, loading: false })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return state;
}

export function useMeta(): MetaState & { remind: boolean; loaded: boolean } {
  const { data, loading } = useStoreQuery(readMeta, { changesSinceExport: 0 } as MetaState);
  return { ...data, remind: shouldRemindExport(data), loaded: !loading };
}
