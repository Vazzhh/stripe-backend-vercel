// api/create-payment-intent.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, currency, description, metadata } = req.body || {};

    // amount debe ser un entero en centavos (USD: 12.34 -> 1234)
    if (!Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "usd",
      description: description || "Pedido iOS",
      metadata: metadata || {},
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}
