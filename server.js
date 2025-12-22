
// ~/api-proxy/server.js
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const cors = require('cors');
import crypto from "crypto";

const app = express();


app.use(cors());
app.use(express.json());
app.use(morgan('combined')); 




app.use(express.json());

const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";
const API_SECRET = "60fe91cdffa48eeca70403b3656446"; // Your secret

// Helper function: AES-256-ECB + Base64
function encryptPayload(payload, secret) {
    // Ensure key is 32 bytes
    const key = Buffer.from(secret.padEnd(32, "0").slice(0, 32), "utf8");

    const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
    encrypted += cipher.final("base64");

    return encrypted;
}

// Launch game route
app.get("/launch_game", (req, res) => {
    // const { user_id, wallet_amount, game_uid } = req.query;

    if (!user_id || !wallet_amount || !game_uid) {
        return res.status(400).send("Missing required parameters");
    }

    const timestamp = Date.now();

    const payloadData = {
        user_id: "88888888",
        wallet_amount: 1200,
        game_uid: "1189baca156e1bbbecc3b26651a63565",
        token: API_TOKEN,
        timestamp: timestamp
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


    // Axios GET request
    axios.get(launchUrl)
        .then(response => {
            console.log("✅ Bulk API Response Status:", response.status);
            console.log("Response Headers:", response.headers);
            console.log("Response Data:", response.data);
        })
        .catch(error => {
            if (error.response) {
                console.error("❌ Bulk API Error:", error.response.status, error.response.data);
            } else {
                console.error("❌ Request Failed:", error.message);
            }
        });

    res.redirect(gameUrl);
});


app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});
