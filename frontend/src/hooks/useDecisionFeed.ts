import { MIRROR_NODE_URL, HCS_TOPIC_ID } from "../config";
import { usePolling } from "./usePolling";

interface Decision {
  timestamp: string;
  fromStrategy: string;
  toStrategy: string;
  reason: string;
  txHash: string;
}

async function fetchDecisions(): Promise<Decision[]> {
  const response = await fetch(
    `${MIRROR_NODE_URL}/api/v1/topics/${HCS_TOPIC_ID}/messages?order=desc&limit=20`,
  );
  const data = await response.json();

  return data.messages.map((msg: { message: string }) => {
    const decoded = atob(msg.message);
    return JSON.parse(decoded);
  });
}

export function useDecisionFeed() {
  return usePolling(fetchDecisions, 5000);
}
