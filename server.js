import express from 'express';
import axios from 'axios';
import cors from 'cors';
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(express.json());

// Use the SAME credentials as PHP code in vish/index.php
const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";  
const AES_KEY = "60fe91cdffa48eeca70403b3656446";    

function createKey(keyString) {
  const keyBuffer = Buffer.from(keyString, 'utf8');
  const paddedKey = Buffer.alloc(32, 0);
  const bytesToCopy = Math.min(keyBuffer.length, 32);
  keyBuffer.copy(paddedKey, 0, 0, bytesToCopy);
  return paddedKey;
}

export function encrypt(payload) {
  try {
    // Match PHP's JSON_UNESCAPED_SLASHES behavior
    let text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    // Remove escaped forward slashes to match PHP
    text = text.replace(/\\\//g, '/');
    
    const key = createKey(AES_KEY);
    
    // AES-256-ECB - matches PHP: openssl_encrypt($plaintext, 'aes-256-ecb', $aesKey, OPENSSL_RAW_DATA, '')
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}

// Test decryption function
export function decrypt(encryptedBase64) {
  try {
    const key = createKey(AES_KEY);
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
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

  // Match PHP: round(microtime(true) * 1000) - milliseconds
  const timestamp = Math.round(Date.now());

  // Create payload exactly like PHP code
  const requestData = {
    user_id: userName,
    wallet_amount: parseFloat(credit_amount),
    game_uid: game_uid,
    token: API_TOKEN,
    timestamp: timestamp
  };

  // Match PHP: json_encode($requestData, JSON_UNESCAPED_SLASHES)
  const message = JSON.stringify(requestData);
  console.log("📝 Plain JSON message:", message);
  console.log("🔑 Key length:", AES_KEY.length, "characters");
  console.log("🔑 Key bytes:", Buffer.from(AES_KEY, 'utf8').length, "bytes");
  
  const encryptedPayload = encrypt(message);
  console.log("🔐 Encrypted payload:", encryptedPayload);

  // Self-test: verify we can decrypt our own encryption
  try {
    const decrypted = decrypt(encryptedPayload);
    console.log("✅ Self-decryption test - Decrypted:", decrypted);
    const parsed = JSON.parse(decrypted);
    console.log("✅ Self-decryption test - Parsed:", JSON.stringify(parsed, null, 2));
    
    // Verify it matches original
    if (decrypted === message) {
      console.log("✅ Encryption/Decryption cycle verified!");
    } else {
      console.log("⚠️  WARNING: Decrypted text doesn't match original!");
      console.log("Original:", message);
      console.log("Decrypted:", decrypted);
    }
  } catch (e) {
    console.error("❌ Self-decryption test FAILED:", e.message);
  }

  // Build URL with parameters (exactly like PHP)
  const gameUrl = `${SERVER_URL}/launch_game?` + 
    `user_id=${encodeURIComponent(userName)}` +
    `&wallet_amount=${encodeURIComponent(credit_amount)}` +
    `&game_uid=${encodeURIComponent(game_uid)}` +
    `&token=${encodeURIComponent(API_TOKEN)}` +
    `&timestamp=${encodeURIComponent(timestamp)}` +
    `&payload=${encodeURIComponent(encryptedPayload)}`;

  console.log("🌐 Generated game URL:", gameUrl);

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
    console.error("❌ API Error:", error.response?.data || error.message);
    console.error("Status:", error.response?.status);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to launch game",
      error: error.response?.data || error.message
    });
  }
});

app.post("/result", (req, res) => {
  console.log("🎮 GAME CALLBACK RECEIVED");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  // Destructure if you want cleaner logs
  const {
    mobile,
    bet_amount,
    win_amount,
    game_uid,
    game_round,
    token,
    wallet_before,
    wallet_after,
    change,
    currency_code,
    timestamp,
  } = req.body;

  console.log("Parsed Data:");
  console.table({
    mobile,
    bet_amount,
    win_amount,
    game_uid,
    game_round,
    token,
    wallet_before,
    wallet_after,
    change,
    currency_code,
    timestamp,
  });

  return res.json({
    status: "success",
    message: "Callback received",
  });
});

app.get('/api/test', (req, res) => {
  res.send('API is working');
});

app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});