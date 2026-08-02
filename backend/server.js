require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());

const TIER_DEFS = {
  vip:      { name: 'VIP Recliner Ticket', priceCents: 2500, label: 'VIP' },
  standard: { name: 'Standard Ticket',     priceCents: 1500, label: 'Standard' },
  economy:  { name: 'Economy Ticket',      priceCents: 1000, label: 'Economy' },
};

app.post("/api/create-checkout-session", async (req, res) => {
  const { movie, tierCounts, totalTickets, totalPrice, ticketCount } = req.body;

  if (!movie) return res.status(400).json({ error: "Missing movie details" });

  try {
    const line_items = [];
    let calcTotalCount = 0;
    const tierSummaries = [];

    if (tierCounts && typeof tierCounts === 'object') {
      for (const [tierKey, count] of Object.entries(tierCounts)) {
        if (count > 0 && TIER_DEFS[tierKey]) {
          const t = TIER_DEFS[tierKey];
          calcTotalCount += count;
          tierSummaries.push(`${count}x ${t.label}`);
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `${movie.title} — ${t.name}`,
                images: movie.poster_path ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`] : [],
                description: `Admission (${t.label} Class)`,
              },
              unit_amount: t.priceCents,
            },
            quantity: count,
          });
        }
      }
    }

    // Legacy fallback (single ticketCount)
    if (line_items.length === 0) {
      const count = ticketCount || 1;
      calcTotalCount = count;
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${movie.title} Ticket(s)`,
            images: movie.poster_path ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`] : [],
            description: `Admission for ${count} person(s)`,
          },
          unit_amount: 1500,
        },
        quantity: count,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:5173'}?canceled=true`,
      metadata: {
        movieId:       String(movie.id),
        movieTitle:    movie.title,
        moviePoster:   movie.poster_path || '',
        ticketCount:   String(calcTotalCount),
        totalPrice:    totalPrice ? String(totalPrice) : '',
        tierBreakdown: tierSummaries.length ? tierSummaries.join(', ') : `${calcTotalCount} Ticket(s)`,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.get("/api/checkout-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
