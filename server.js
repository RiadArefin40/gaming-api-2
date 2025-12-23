
// ~/api-proxy/server.js
import express  from 'express';
import axios from 'axios';

import  cors from 'cors';
import crypto from "crypto";

const app = express();


app.use(cors());
app.use(express.json());
 




app.use(express.json());
const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";
const API_SECRET = "60fe910dffa48eeca70403b3656446"; // Your secret

// Helper function: AES-256-ECB + Base64
function encryptPayload(payload, secret) {
    try {
        // Ensure key is exactly 32 bytes (pad with zeros if needed, then slice to 32)
        const key = Buffer.from(secret.padEnd(32, "0").slice(0, 32), "utf8");
        
        // Create cipher with AES-256-ECB (ECB mode doesn't use IV, so null is correct)
        const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
        
        // Enable automatic PKCS7 padding (this is default, but explicit for clarity)
        cipher.setAutoPadding(true);
        
        // Encrypt the payload - use raw bytes, then encode to base64
        let encrypted = cipher.update(JSON.stringify(payload), "utf8");
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Convert to base64 string
        return encrypted.toString("base64");
        
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt payload: " + error.message);
    }
}

// Launch game route
app.get("/launch_game", (req, res) => {
    try {
        const timestamp = Date.now();
        const userId = "00000000";
        const walletAmount = 1200;
        const gameUid = "1189baca156e1bbbecc3b26651a63565";
        
        // Create payload data object
        const payloadData = {
            user_id: userId,
            wallet_amount: walletAmount,
            game_uid: gameUid,
            token: API_TOKEN,
            timestamp: timestamp
        };
        
        // Encrypt the payload
        let encryptedPayload;
        try {
            encryptedPayload = encryptPayload(payloadData, API_SECRET);
        } catch (encryptError) {
            console.error("Encryption failed:", encryptError);
            return res.status(500).json({ 
                error: "Encryption failed", 
                message: encryptError.message 
            });
        }
        
        // Build the game URL with all parameters
        const gameUrl = `https://bulkapi.in/launch_game?user_id=${encodeURIComponent(userId)}&wallet_amount=${encodeURIComponent(walletAmount)}&game_uid=${encodeURIComponent(gameUid)}&token=${encodeURIComponent(API_TOKEN)}&timestamp=${encodeURIComponent(timestamp)}&payload=${encodeURIComponent(encryptedPayload)}`;
        
        // Redirect to game URL
        res.redirect(gameUrl);
        
    } catch (error) {
        console.error("Launch game error:", error);
        res.status(500).json({ 
            error: "Internal server error", 
            message: error.message 
        });
    }
});
app.get('/api/test', (req, res) => {
  res.send('API is working');
});

app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});
