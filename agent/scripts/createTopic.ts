import { Client, PrivateKey, TopicCreateTransaction } from "@hiero-ledger/sdk";
import * as dotenv from "dotenv";

dotenv.config();

// One-time setup script — creates a new HCS topic for the agent to log its decisions to.
async function main() {
  // The operator is the account that signs and pays for this txn. In this case, it is the agent account, which
  // was previously given testnet HBAR. We also need its private key.
  const client = Client.forTestnet().setOperator(
    process.env.AGENT_ACCOUNT_ID!,
    PrivateKey.fromStringECDSA(process.env.AGENT_PRIVATE_KEY!),
  );

  // This creates the actual topic on the HCS. The topic memo is just a human-readable label attached to the topic.
  const tx = await new TopicCreateTransaction().setTopicMemo("Agent decision log").execute(client);

  // Must wait for the receipt which confirms the txn succeeded. This gives us the actual topic ID.
  const receipt = await tx.getReceipt(client);
  console.log("Topic created:", receipt.topicId?.toString());

  // Close the connection as this is a one-off script.
  client.close();
}

// Catch any errors that may arise.
main().catch(console.error);
