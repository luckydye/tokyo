import { createSignal } from "solid-js";
import type { Accessor } from "./lib.js";

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param params The params as a signal, that will be used to fetch and filter the data.
 */

export function useAccessor<T extends Accessor<any, any, any, any, any, any>>(
  accessorFn: () => T,
) {
  type Query = Partial<T["query"]>;
  type Params = Partial<T["params"]>;
  type Data = ReturnType<T["_strategy"]["compute"]>;

  const [data, setData] = createSignal<Data>();
  const [pending, setPending] = createSignal<boolean>();

  const accessor = accessorFn();

  accessor.on("data", (data) => setData(data));
  accessor.on("pending", (pending) => setPending(pending));

  return {
    data,
    pending,
    query(query?: Query) {
      if (query) {
        accessor.query = query;
      }
      return accessor.query;
    },
    params(params?: Params) {
      if (params) {
        accessor.params = params;
      }
      return accessor.params;
    },
    mutate(value?: any) {
      // if (value) {
      // 	setParams(value);
      // }
      // return params();
    },
  };
}
