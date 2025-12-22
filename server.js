// ~/api-proxy/server.js
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = 4000; // port for your API server

app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // logs every request

let cachedToken = null;
let tokenExpiresAt = 0;

app.post('/auth/createtoken', async (req, res) => {
  try {
    // Return cached token if still valid
    if (cachedToken && Date.now() < tokenExpiresAt) {
      return res.json({ token: cachedToken });
    }

    // Request new token from casino API
    const response = await axios.post(
      'https://bs.sxvwlkohlv.com/api/v2/auth/createtoken',
      req.body, // { clientId, clientSecret }
      { headers: { 'Content-Type': 'application/json', 'Accept': '*/*' } }
    );

    const { token, expiration } = response.data;

    // Cache the token until expiration
    cachedToken = token;
    tokenExpiresAt = expiration * 1000; // expiration is in seconds

    res.json({ token });

  } catch (err) {
    console.error('Error calling API:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});


app.get('/status', async (req, res) => {
  try {
    const response = await axios.get(
      'https://bs.sxvwlkohlv.com/api/v2/status',
   
    );
    res.json(response.data);
  } catch (err) {
    console.error('Error calling API:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});



const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";
const API_SECRET = "60fe91cdffa48eeca70403b3656446"; // Used for AES-256-ECB encryption

// Helper function to encrypt payload using AES-256-ECB + Base64
function encryptPayload(payload, secret) {
  const cipher = crypto.createCipheriv(
    "aes-256-ecb",
    Buffer.from(secret, "utf8"),
    null
  );
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}


// Game launch endpoint
app.get("/launch_game", (req, res) => {
  const { user_id, wallet_amount, game_uid } = req.query;

  if (!user_id || !wallet_amount || !game_uid) {
    return res.status(400).send("Missing required parameters");
  }

  const timestamp = Date.now();

  // Prepare payload (you can add extra fields if needed)
  const payloadData = {
    user_id,
    wallet_amount: parseFloat(wallet_amount),
    game_uid,
    token: API_TOKEN,
    timestamp,
  };

  // Encrypt the payload
  const encryptedPayload = encryptPayload(payloadData, API_SECRET);

  // Build the redirect URL
  const gameUrl = `https://bulkapi.in/launch_game?user_id=${encodeURIComponent(
    user_id
  )}&wallet_amount=${encodeURIComponent(
    wallet_amount
  )}&game_uid=${encodeURIComponent(game_uid)}&token=${encodeURIComponent(
    API_TOKEN
  )}&timestamp=${encodeURIComponent(timestamp)}&payload=${encodeURIComponent(
    encryptedPayload
  )}`;

  // Redirect the user to the game
  res.redirect(gameUrl);
});

// Start server
app.listen(PORT, () => {
  console.log(`API proxy server running on port ${PORT}`);
});
