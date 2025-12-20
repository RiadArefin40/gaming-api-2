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

// Proxy endpoint
app.post('/auth/createtoken', async (req, res) => {
  try {
    const response = await axios.post(
      'https://bs.sxvwlkohlv.com/api/v2/auth/createtoken',
      req.body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(response);
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

// Start server
app.listen(PORT, () => {
  console.log(`API proxy server running on port ${PORT}`);
});
