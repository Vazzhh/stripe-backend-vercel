import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Log de headers y raw body para depurar
    console.log("Headers:", req.headers);

    let body;
    if (typeof req.body === "string") {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        console.log("JSON parse error from string body:", e.message);
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    } else if (req.body && typeof req.body === "object") {
      body = req.body;
    } else {
      // Si Vercel no parseó el body, intentamos leerlo manualmente
      const raw = await new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(data));
      });
      try {
        body = JSON.parse(raw);
      } catch (e) {
        console.log("JSON parse error from raw stream:", e.message, "raw:", raw);
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    console.log("Incoming body:", body);

    const amount = Number(body.amount);
    const currency = body.currency || "usd";
    const description = body.description || "Pedido iOS";
    const metadata = body.metadata || {};

    if (!Number.isInteger(amount) || amount < 1) {
      console.log("Amount failed validation:", amount, typeof amount);
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
