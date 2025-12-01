export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Parseo defensivo del body: si viene string, lo parseamos a JSON
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const amount = Number(body.amount);
    const currency = body.currency || "usd";
    const description = body.description || "Pedido iOS";
    const metadata = body.metadata || {};

    if (!Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
}
