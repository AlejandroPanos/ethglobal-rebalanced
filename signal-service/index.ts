import express from "express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { paymentMiddleware } from "@x402/express";
import * as dotenv from "dotenv";

dotenv.config();
