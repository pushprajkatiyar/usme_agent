# Retell AI Voice Chatbot - PHQ-9 Assessment

A modern voice-interactive chatbot for PHQ-9 mental health assessments, powered by Retell AI. Built with React and deployed on Vercel's serverless platform.

## ✨ Features

- 🎤 **Voice Interaction** - Real-time voice conversation using Retell AI
- 💬 **Live Transcription** - See conversation history in beautiful chat interface
- 📊 **PHQ-9 Assessment** - Mental health screening with visual results
- 🎨 **Modern UI** - Beautiful gradient design with smooth animations
- 📱 **Responsive** - Works on desktop and mobile devices
- ⚡ **Serverless** - Deployed on Vercel edge network
- 🔒 **Secure** - API keys stored in environment variables

## 🏗️ Architecture

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Retell Web Client SDK** for WebRTC voice calls
- **Recharts** for data visualization

### Backend (Serverless)
- **Vercel Serverless Functions** (Node.js)
- **Retell SDK** for API integration
- Environment-based configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Retell AI account and API key
- Vercel CLI (for deployment)

### Local Development

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Run the setup script:
```bash
./setup-env.sh
```

Or manually create `.env.local`:
```bash
RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_agent_id_here
```

3. **Run development server:**
```bash
vercel dev
```

The app will be available at `http://localhost:3000`

## 📦 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables in Vercel project settings
4. Deploy automatically on push

**Important:** Set these environment variables in Vercel:
- `RETELL_API_KEY`
- `RETELL_AGENT_ID`

📖 See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment guide.

## 📁 Project Structure

```
├── api/
│   └── create-web-call.js    # Serverless API endpoint
├── src/
│   ├── App.tsx                # Main React component
│   ├── index.css              # Global styles & animations
│   └── index.tsx              # React entry point
├── public/
│   └── assests/               # Images and static assets
├── vercel.json                # Vercel configuration
├── .env.local                 # Local environment variables (create this)
├── .env.example               # Environment template
└── package.json               # Dependencies and scripts
```

## 🔧 Configuration

### Retell AI Setup

1. Go to [Retell AI Dashboard](https://app.retellai.com/)
2. Create an agent or use existing one
3. Copy your API Key and Agent ID
4. Add them to `.env.local` or Vercel environment variables

### Environment Variables

| Variable | Description |
|----------|-------------|
| `RETELL_API_KEY` | Your Retell AI API key |
| `RETELL_AGENT_ID` | Your Retell AI agent ID |

## 🎯 Usage

1. Open the application in your browser
2. Click **"Start Voice Assessment"**
3. Allow microphone permissions when prompted
4. Speak with the AI assistant
5. Watch the conversation appear in the chat box
6. View results when assessment completes

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start React dev server (frontend only)
vercel dev         # Start full stack with serverless functions
npm run build      # Build for production
npm test           # Run tests
```

### Key Technologies

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Voice SDK:** retell-client-js-sdk
- **Backend SDK:** retell-sdk
- **Charts:** Recharts
- **Platform:** Vercel Serverless

## 🐛 Troubleshooting

### "Failed to start call"
- Check environment variables are set
- Verify API key is valid
- Check network/firewall settings

### No audio detected
- Allow microphone permissions
- Check system audio settings
- Try different browser (Chrome/Edge recommended)

### Transcripts not showing
- Check browser console for errors
- Verify WebRTC connection
- Check Retell agent configuration

## 🔐 Security

- ✅ API keys stored in environment variables
- ✅ `.env.local` excluded from git
- ✅ CORS properly configured
- ✅ Serverless functions are stateless
- ✅ No sensitive data in frontend code

## 📚 Documentation

- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Retell AI Documentation](https://docs.retellai.com/)
- [Vercel Documentation](https://vercel.com/docs)

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## ⚠️ Disclaimer

This PHQ-9 assessment tool is for screening purposes only and is not a medical diagnosis. If you're experiencing symptoms of depression or other mental health concerns, please consult with a qualified healthcare professional.

## 📄 License

Private - All rights reserved

---

**Built with ❤️ using Retell AI and Vercel**
