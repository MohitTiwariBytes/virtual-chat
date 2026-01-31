import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 5173;

app.use(cors());
app.use(express.json());

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Messages array is required',
        received: req.body 
      });
    }


    const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b',
        messages: messages,
        stream: false,
      }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Create Vite server in middleware mode
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();