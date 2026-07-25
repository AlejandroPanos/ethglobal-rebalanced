import { vault } from "../config";
import { usePolling } from "./usePolling";

async function fetchCurrentStrategy(): Promise<number> {
  const strategy = await vault.s_currentStrategy();
  return Number(strategy);
}

export function useCurrentStrategy() {
  return usePolling(fetchCurrentStrategy, 5000);
}
