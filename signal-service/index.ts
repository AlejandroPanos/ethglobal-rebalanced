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

// Define the shape each pool retrieved from DefiLlama will have to then be able to specify the type when
// retrieving them from the API.
interface DefiLlamaPool {
  project: string;
  chain: string;
  symbol: string;
  apy: number;
}

// This function holds majority of the project as it defines the service being sold. In this case is a real market
// yield signal service that will compare two Uniswap pool pairs, one being very stable and the other being very volatile.
// This will allow the agent to make decisions based on which yield is more interesting for the user to invest in.
async function getRealYieldSignal(): Promise<{ strategy: number; reason: string }> {
  const res = await fetch("https://yields.llama.fi/pools");
  const data = await res.json();

  // DefiLlama returns yield data for hundreds of pools. We only want to check for those that are in the Ethereum
  // ecosystem and that are available on Uniswap.
  const uniswapPools: DefiLlamaPool[] = data.data.filter(
    (p: DefiLlamaPool) => p.project === "uniswap-v3" && p.chain === "Ethereum",
  );

  // We match a regex pattern to be able to fund the pools we are interested in.
  const stablePool = uniswapPools.find((p) => /USDC-USDT|USDT-USDC/i.test(p.symbol));
  const volatilePool = uniswapPools.find((p) => /USDC-WETH|WETH-USDC/i.test(p.symbol));

  // App throws an error is the pools cannot be found inside of the API response.
  if (!stablePool || !volatilePool) {
    throw new Error("Could not find reference Uniswap pools in DefiLlama data");
  }

  // If the APY (Annual Percentage Yield) of the volatile pool exceeds that of the stable pool, we will return an object
  // that will indicate the agent to move to the volatile strategy over the stable more conservative one.
  if (volatilePool.apy > stablePool.apy) {
    return {
      strategy: 2,
      reason: `Uniswap USDC-WETH pool APY (${volatilePool.apy.toFixed(2)}%) exceeds stable pool APY (${stablePool.apy.toFixed(2)}%)`,
    };
  }

  // On the other hand, we tell the agent to go for the conservative strategy instead of the volatile strategy.
  return {
    strategy: 1,
    reason: `Stable pool APY (${stablePool.apy.toFixed(2)}%) is more attractive than volatile pool APY (${volatilePool.apy.toFixed(2)}%)`,
  };
}

// By the time this handler runs, paymentMiddleware has already confirmed payment was made and settled.
// This code only runs if the payment has been made.
app.get("/yield-signal", (req, res) => {
  getRealYieldSignal()
    .then((signal) => res.json(signal))
    .catch((err) => {
      console.error("Failed to fetch real yield data:", err);
      res.status(502).json({ error: "Could not retrieve yield data" });
    });
});
