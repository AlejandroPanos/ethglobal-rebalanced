import express from "express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { paymentMiddleware } from "@x402/express";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const PAY_TO = process.env.PAY_TO_ACCOUNT_ID!; // Account that receives the payments
const PRICE_TINYBARS = process.env.PRICE_TINYBARS!; // Price per request, in tinybars (1 HBAR = 100,000,000 tinybars)

// The facilitator is the thirs party that verifies and settles the payments on our behalf.
// It sponsors the network fee and submits the txn, so it never needs to hold funds.
// We are using Blocky402, which is a public facilitator with x402 support for Hedera.
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://api.testnet.blocky402.com",
});
