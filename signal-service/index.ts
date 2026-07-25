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

// Create a new resource server to register Hedera's x402 payment scheme.
// `defaultAsset` tells it which asset to price in as default. We are using the Hedera testnet here and we are
// telling it to work with tokens that have 8 decimal places (tinybars in this case).
const server = new x402ResourceServer(facilitatorClient).register(
  "hedera:*",
  new ExactHederaScheme({
    defaultAssets: {
      "hedera:testnet": { asset: "0.0.0", decimals: 8 },
    },
  }),
);

// This routes object specifies which routes are payment protected. It states the account the payment should be made to,
// the asset and the price. This is what is used to build the 402 response.
const routes = {
  "GET /yield-signal": {
    accepts: {
      scheme: "exact",
      network: "hedera:testnet" as const,
      payTo: PAY_TO,
      price: {
        asset: "0.0.0",
        amount: PRICE_TINYBARS,
      },
    },
  },
};

// Use the routes passing the predefined `paymentMiddleware` function and pass the routes and server as params.
app.use(paymentMiddleware(routes, server));
