import express from 'express';
import axios from 'axios';
import cors from 'cors';
import crypto from "crypto";

const app = express();
import bodyParser from "body-parser";
app.use(cors());
app.use(express.json());


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use the SAME credentials as PHP code in vish/index.php
const API_TOKEN = "ceb57a3c-4685-4d32-9379-c2424f";  
const AES_KEY = "60fe91cdffa48eeca70403b3656446";    








app.post("/result", async (req, res) => {
  console.log("🎮 GAME CALLBACK RECEIVED");

  console.log("Body:", req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Empty body — callback not parsed",
    });
  }
  if(req.body){
   const forwardRes = await axios.post('https://api.bajiraj.cloud/result', req.body, {
      headers: {
        'Content-Type': 'application/json',
        // Add token if required
        // Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    console.log('Forward response:', forwardRes.data);
  }



  return res.json({
    status: "success",
    message: "Callback received",
  });
});



app.listen(4000, '127.0.0.1', () => {
  console.log('Express API running on http://127.0.0.1:4000');
});