import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";
const API_SECRET = "60fe91cdffa48eeca70403b3656446"; // Your secret

// Helper function: AES-256-ECB + Base64
function encryptPayload(payload, secret) {
  // Ensure secret is exactly 32 bytes for AES-256
  const key = Buffer.from(secret.padEnd(32, "0").slice(0, 32), "utf8");

  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  cipher.setAutoPadding(true);

  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
}

// Launch game route
app.get("/launch_game", (req, res) => {
  const { user_id, wallet_amount, game_uid } = req.query;

  if (!user_id || !wallet_amount || !game_uid) {
    return res.status(400).send("Missing required parameters");
  }

  const timestamp = Date.now();

  const payloadData = {
    user_id,
    wallet_amount: parseFloat(wallet_amount),
    game_uid,
    token: API_TOKEN,
    timestamp,
  };

  const encryptedPayload = encryptPayload(payloadData, API_SECRET);

  const gameUrl = `https://bulkapi.in/launch_game?user_id=${encodeURIComponent(
    user_id
  )}&wallet_amount=${encodeURIComponent(
    wallet_amount
  )}&game_uid=${encodeURIComponent(
    game_uid
  )}&token=${encodeURIComponent(API_TOKEN)}&timestamp=${encodeURIComponent(
    timestamp
  )}&payload=${encodeURIComponent(encryptedPayload)}`;

  // Redirect browser to game
  res.redirect(gameUrl);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
