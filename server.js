
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
const AES_KEY = "60fe910dffa48eeca70403b3656446"; 


function createKey(keyString) {
  const keyBuffer = Buffer.from(keyString, 'utf8');
  if (keyBuffer.length >= 32) {
    return keyBuffer.slice(0, 32);
  } else {
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey);
    return paddedKey;
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
    
        // 🔧 Create payload exactly like PHP code
        const requestData = {
          user_id: userName, // Using userName as user_id
          wallet_amount: parseFloat(credit_amount),
          game_uid: game_uid,
          token: API_TOKEN,
          timestamp: timestamp
        };
    
        console.log(" Request data:", requestData);
    
        // 🔧 Encrypt the payload using the secret key
        const message = JSON.stringify(requestData);
        const encryptedPayload = encrypt(message); // This uses your existing encrypt function
    
        // 🔧 Build URL with parameters (like PHP code)
        const gameUrl = `${SERVER_URL}/launch_game?` + 
          `user_id=${encodeURIComponent(userName)}` +
          `&wallet_amount=${encodeURIComponent(credit_amount)}` +
          `&game_uid=${encodeURIComponent(game_uid)}` +
          `&token=${encodeURIComponent(API_TOKEN)}` +
          `&timestamp=${encodeURIComponent(timestamp)}` +
          `&payload=${encodeURIComponent(encryptedPayload)}`;
    
        console.log(" Generated game URL:", gameUrl);


            // 🔧 Call the casino API
            const response = await axios.get(gameUrl);

            // Return the casino API response to frontend
            res.json({
            success: true,
            data: response.data,
            gameUrl: gameUrl
            });
   
});
app.get('/api/test', (req, res) => {
  res.send('API is working');
});

app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});
