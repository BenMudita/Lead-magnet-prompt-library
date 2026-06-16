import Stripe from "stripe";
import { appEnv } from "./env";

export function createStripeClient() {
  if (!appEnv.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required when PAYMENTS_PROVIDER=stripe.");
  }

  return new Stripe(appEnv.stripeSecretKey);
}
