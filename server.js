import express from 'express';
import axios from 'axios';
import cors from 'cors';
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(express.json());

// Use the key that matches your API_TOKEN
// If API_TOKEN is "ceb57a3c-4685-4d32-9379-c2424f", use the secret key for that account
const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";
// Try the original key first - it might be correct for this API token
const AES_KEY = "60fe910dffa48eeca70403b3656446"; 

function createKey(keyString) {
  // PHP's openssl_encrypt treats the key as a raw UTF-8 string
  // Convert to buffer and ensure it's exactly 32 bytes for AES-256
  const keyBuffer = Buffer.from(keyString, 'utf8');
  
  if (keyBuffer.length === 32) {
    return keyBuffer;
  } else if (keyBuffer.length > 32) {
    return keyBuffer.slice(0, 32);
  } else {
    // Pad with null bytes if shorter (PHP does this)
    const paddedKey = Buffer.alloc(32, 0);
    keyBuffer.copy(paddedKey, 0);
    return paddedKey;
  }
}

export function encrypt(payload) {
  try {
    // Match PHP's JSON_UNESCAPED_SLASHES - remove escaped forward slashes
    let text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    text = text.replace(/\\\//g, '/');
    
    const key = createKey(AES_KEY);
    
    // AES-256-ECB - no IV needed (pass null)
    // PHP: openssl_encrypt($plaintext, 'aes-256-ecb', $aesKey, OPENSSL_RAW_DATA, '')
    // OPENSSL_RAW_DATA means it returns raw binary, then base64_encode is applied
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    
    // Update with utf8 input, base64 output (matches PHP's base64_encode of raw data)
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw error;
  }
}

// Helper function to decrypt and verify (for testing)
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
const SERVER_URL = "https://bulkapi.in"; 
app.post("/launch_game", async (req, res) => {
  const { userName, game_uid, credit_amount } = req.body;
  
  
  if (!userName || !game_uid || !credit_amount) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: userName, game_uid, credit_amount" 
    });
  }

  // Match PHP: round(microtime(true) * 1000)
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
  console.log("Plain JSON:", message);
  
  const encryptedPayload = encrypt(message);
  console.log("Encrypted payload:", encryptedPayload);

  // Verify encryption by decrypting (for debugging)
  try {
    const decrypted = decrypt(encryptedPayload);
    console.log("Decrypted (verification):", decrypted);
    const parsed = JSON.parse(decrypted);
    console.log("Parsed JSON (verification):", parsed);
  } catch (e) {
    console.error("Self-decryption test failed:", e.message);
  }

  // Build URL with parameters (like PHP code)
  // const gameUrl = ${SERVER_URL}/launch_game? + 
  //   user_id=${encodeURIComponent(userName)} +
  //   &wallet_amount=${encodeURIComponent(credit_amount)} +
  //   &game_uid=${encodeURIComponent(game_uid)} +
  //   &token=${encodeURIComponent(API_TOKEN)} +
  //   &timestamp=${encodeURIComponent(timestamp)} +
  //   &payload=${encodeURIComponent(encryptedPayload)};



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
    console.error("API Error:", error.response?.data || error.message);
    console.error("Response status:", error.response?.status);
    console.error("Response headers:", error.response?.headers);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to launch game",
      error: error.response?.data || error.message
    });
  }
});

app.get('/api/test', (req, res) => {
  res.send('API is working');
});

app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});