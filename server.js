import express from 'express';
import axios from 'axios';
import cors from 'cors';
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(express.json());

const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";
const AES_KEY = "60fe910dffa48eeca70403b3656446"; 

function createKey(keyString) {
  // Convert hex string to buffer (32 hex chars = 16 bytes)
  // For AES-256, we need 32 bytes, so we'll pad or use the hex directly
  if (keyString.length === 32) {
    // If it's a 32-character hex string, convert it to 16 bytes
    // Then pad to 32 bytes for AES-256
    const keyBuffer = Buffer.from(keyString, 'hex');
    // AES-256 requires 32 bytes, so pad the 16-byte key
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey, 0);
    // Fill remaining with zeros or repeat the key
    keyBuffer.copy(paddedKey, 16);
    return paddedKey;
  } else {
    // Fallback: treat as UTF-8 and pad/truncate to 32 bytes
    const keyBuffer = Buffer.from(keyString, 'utf8');
    if (keyBuffer.length >= 32) {
      return keyBuffer.slice(0, 32);
    } else {
      const paddedKey = Buffer.alloc(32);
      keyBuffer.copy(paddedKey);
      return paddedKey;
    }
  }
}

export function encrypt(payload) {
  try {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const key = createKey(AES_KEY);
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (error) {
    throw error;
  }
}

app.post("/launch_game", async (req, res) => {
  const { userName, game_uid, credit_amount } = req.body;
  const SERVER_URL = "https://bulkapi.in"; 
  
  if (!userName || !game_uid || !credit_amount) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: userName, game_uid, credit_amount" 
    });
  }

  const timestamp = Math.round(Date.now());

  // Create payload exactly like PHP code
  const requestData = {
    user_id: userName,
    wallet_amount: parseFloat(credit_amount),
    game_uid: game_uid,
    token: API_TOKEN,
    timestamp: timestamp
  };

  console.log("Request data:", requestData);

  // Encrypt the payload using the secret key
  const message = JSON.stringify(requestData);
  const encryptedPayload = encrypt(message);

  // Build URL with parameters (like PHP code)
  const gameUrl = `${SERVER_URL}/launch_game?` + 
    `user_id=${encodeURIComponent(userName)}` +
    `&wallet_amount=${encodeURIComponent(credit_amount)}` +
    `&game_uid=${encodeURIComponent(game_uid)}` +
    `&token=${encodeURIComponent(API_TOKEN)}` +
    `&timestamp=${encodeURIComponent(timestamp)}` +
    `&payload=${encodeURIComponent(encryptedPayload)}`;

  console.log("Generated game URL:", gameUrl);

  try {
    // Call the casino API
    const response = await axios.get(gameUrl);

    // Return the casino API response to frontend
    res.json({
      success: true,
      data: response.data,
      gameUrl: gameUrl
    });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to launch game",
      error: error.message
    });
  }
});

app.get('/api/test', (req, res) => {
  res.send('API is working');
});

app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});