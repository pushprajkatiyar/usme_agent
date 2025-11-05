const express = require('express');
const cors = require('cors');
const Retell = require('retell-sdk').default || require('retell-sdk');

const app = express();
const port = 3001;

// Initialize Retell client with API key
const retellClient = new Retell({
  apiKey: 'key_2401e6a85a9924ffaf5f4f8e6348',
});

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Retell API server is running' });
});

// Create web call endpoint
app.post('/api/create-web-call', async (req, res) => {
  try {
    console.log('Creating web call with agent ID: agent_7d77bac174c306668c6cbd12f9');
    
    const webCallResponse = await retellClient.call.createWebCall({
      agent_id: 'agent_7d77bac174c306668c6cbd12f9',
    });

    console.log('✅ Web call created successfully');
    console.log('Access token:', webCallResponse.access_token);
    console.log('Call ID:', webCallResponse.call_id);

    res.json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id,
    });
  } catch (error) {
    console.error('❌ Error creating web call:', error);
    res.status(500).json({
      error: 'Failed to create web call',
      message: error.message || 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Retell API server running at http://localhost:${port}`);
  console.log(`📞 Agent ID: agent_7d77bac174c306668c6cbd12f9`);
  console.log(`🔑 API Key configured`);
});

