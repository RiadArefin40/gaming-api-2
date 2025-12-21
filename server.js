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


app.get('/vendors', async (req, res) => {
  try {
    const token = req.headers.authorization; // get token from frontend

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Call the vendors API with the passed token
    const response = await axios.get(
      'https://bs.sxvwlkohlv.com/api/v2/vendors/list',
      { headers: { Authorization: token } } // forward token
    );

    res.json(response.data);
  } catch (err) {
    console.error('Error calling API:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});



// POST /games
app.post('/games', async (req, res) => {
  try {
    const { vendorCode, language } = req.body;
    const token = req.headers.authorization; // get token from frontend

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Call the casino API
    const response = await axios.post(
      'https://bs.sxvwlkohlv.com/api/v2/games/list',
      { vendorCode, language },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token, // forward token
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Error calling games API:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});





// backend: express
app.post('/game/launch', async (req, res) => {
  const { vendorCode, gameCode, userCode, language = 'en', lobbyUrl, theme = 1 } = req.body;
  const token = req.headers.authorization; // Bearer token from frontend

  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    // 1️⃣ Check game availability
    const detailRes = await axios.post(
      'https://bs.sxvwlkohlv.com/api/v2/game/detail',
      { vendorCode, gameCode },
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
    );

    if (!detailRes.data?.success) {
      return res.status(400).json({ error: 'Game not available', message: detailRes.data.message });
    }

    // 2️⃣ Launch game
    const launchRes = await axios.post(
      'https://bs.sxvwlkohlv.com/api/v2/game/launch-url',
      { vendorCode, gameCode, userCode, language, lobbyUrl, theme },
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
    );

    return res.json({ launchUrl: launchRes.data.message });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({ error: err.response?.data || err.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`API proxy server running on port ${PORT}`);
});
