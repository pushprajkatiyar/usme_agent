// Vercel Serverless Function
// This replaces the Express server.js

const Retell = require('retell-sdk').default || require('retell-sdk');

// Serverless function handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variable
    const apiKey = process.env.RETELL_API_KEY;
    const agentId = process.env.RETELL_AGENT_ID;

    if (!apiKey) {
      console.error('❌ RETELL_API_KEY not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured' 
      });
    }

    if (!agentId) {
      console.error('❌ RETELL_AGENT_ID not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Agent ID not configured' 
      });
    }

    console.log('🔑 Creating web call with agent ID:', agentId);
    
    // Initialize Retell client
    const retellClient = new Retell({
      apiKey: apiKey,
    });

    // Create web call
    const webCallResponse = await retellClient.call.createWebCall({
      agent_id: agentId,
    });

    console.log('✅ Web call created successfully');
    console.log('Call ID:', webCallResponse.call_id);

    // Return access token
    return res.status(200).json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id,
    });
  } catch (error) {
    console.error('❌ Error creating web call:', error);
    return res.status(500).json({
      error: 'Failed to create web call',
      message: error.message || 'Unknown error',
    });
  }
};

