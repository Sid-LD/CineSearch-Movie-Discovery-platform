require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/create-checkout-session", async (req, res) => {
  const { movie, ticketCount } = req.body;

  if (!movie || !ticketCount) {
    return res.status(400).json({ error: "Missing movie or ticketCount" });
  }

  const TICKET_PRICE_CENTS = 1500; // $15.00

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${movie.title} Ticket(s)`,
              images: movie.poster_path 
                 ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`]
                 : [],
              description: `Admission for ${ticketCount} person(s)`,
            },
            unit_amount: TICKET_PRICE_CENTS,
          },
          quantity: ticketCount,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?canceled=true`,
      metadata: {
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
        ticketCount: ticketCount.toString()
      }
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
