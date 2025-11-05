import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function App() {
  const [retellClient] = useState<RetellWebClient>(() => new RetellWebClient());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize audio context for Windows compatibility
  const initializeAudio = async () => {
    try {
      // Create audio context to ensure audio is properly initialized
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if it's suspended (common on Windows)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      setAudioInitialized(true);
      setAudioError(null);
      console.log('🔊 Audio context initialized successfully');
      
      // Test audio playback capability
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent test
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      
      audioContext.close();
    } catch (error) {
      console.error('❗ Audio initialization failed:', error);
      setAudioError('Audio initialization failed. Please check your audio settings.');
    }
  };

  useEffect(() => {
    console.log('✅ Retell Web Client initialized');

    // Set up Retell event handlers
    retellClient.on('call_started', () => {
      console.log('✅ Call started');
      setIsConnected(true);
      setIsLoading(false);
      setAudioError(null);
      setTranscript([]); // Clear transcript for new conversation
    });

    retellClient.on('call_ended', () => {
      console.log('🛑 Call ended');
      setIsConnected(false);
      setIsSpeaking(false);
      setIsLoading(false);
    });

    retellClient.on('agent_start_talking', () => {
      console.log('🗣️ Assistant started speaking');
      setIsSpeaking(true);
      setAudioError(null); // Clear any audio errors when speech starts
    });

    retellClient.on('agent_stop_talking', () => {
      console.log('🔇 Assistant stopped speaking');
      setIsSpeaking(false);
    });

    retellClient.on('update', (update) => {
      console.log('📩 Update received:', update);
      console.log('📝 Transcript length from Retell:', update.transcript?.length);
      
      // Handle transcript updates
      if (update.transcript && Array.isArray(update.transcript)) {
        const transcriptList = update.transcript;
        
        // Convert Retell transcript format to our app format
        const newMessages = transcriptList.map((item: any) => ({
          role: item.role,
          text: item.content,
        }));
        
        // Retell sends a sliding window of last ~5 messages (updates in real-time)
        // Strategy: Find where Retell's window starts in our history, keep everything before that
        setTranscript((prevTranscript) => {
          // If we have no previous messages, just use the new ones
          if (prevTranscript.length === 0) {
            console.log('📊 Starting fresh with', newMessages.length, 'messages');
            return newMessages;
          }
          
          // Find where the current Retell window begins in our stored transcript
          // by looking for the first message from Retell's window in our history
          const firstNewMsg = newMessages[0];
          let windowStartIndex = prevTranscript.findIndex(
            (msg: { role: string; text: string }) => 
              msg.role === firstNewMsg.role && 
              msg.text === firstNewMsg.text
          );
          
          // If we can't find an exact match, try to find where it starts by checking prefixes
          // (in case the message was still being transcribed)
          if (windowStartIndex === -1 && firstNewMsg.text.length > 10) {
            windowStartIndex = prevTranscript.findIndex(
              (msg: { role: string; text: string }) => 
                msg.role === firstNewMsg.role && 
                (firstNewMsg.text.startsWith(msg.text) || msg.text.startsWith(firstNewMsg.text))
            );
          }
          
          // Keep all messages before where Retell's window starts (those are finalized)
          // Then append Retell's current window
          const finalizedMessages = windowStartIndex > 0 
            ? prevTranscript.slice(0, windowStartIndex)
            : (newMessages.length < prevTranscript.length ? prevTranscript.slice(0, -newMessages.length) : []);
          
          const updatedTranscript = [...finalizedMessages, ...newMessages];
          
          console.log('💬 Previous total:', prevTranscript.length);
          console.log('✅ Finalized (locked in):', finalizedMessages.length);
          console.log('🔄 Current window:', newMessages.length);
          console.log('📊 Total now:', updatedTranscript.length);
          
          return updatedTranscript;
        });

        // Check for PHQ-9 score in the last assistant message
        const lastAssistantMessage = transcriptList
          .filter((item: any) => item.role === 'agent')
          .pop();
        
        if (lastAssistantMessage && lastAssistantMessage.content.toLowerCase().includes('your total score')) {
          const score = lastAssistantMessage.content.match(/\d+/)?.[0];
          if (score) {
            console.log('🏆 Final score detected:', score);
            setFinalScore(Number(score));
            setIsConnected(false);
            setIsSpeaking(false);
            retellClient.stopCall();
          }
        }
      }
    });

    retellClient.on('error', (error) => {
      console.error('❗ Retell error:', error);
      setIsLoading(false);
      
      // Enhanced error handling for audio issues
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      if (errorMessage.toLowerCase().includes('audio') || 
          errorMessage.toLowerCase().includes('microphone') ||
          errorMessage.toLowerCase().includes('media')) {
        setAudioError('Audio/Microphone error detected. Please check your audio settings and permissions.');
      } else if (errorMessage.toLowerCase().includes('connection') ||
                errorMessage.toLowerCase().includes('network')) {
        setAudioError('Connection error. Please check your internet connection.');
      } else {
        setAudioError(`Error: ${errorMessage}`);
      }
    });

    return () => {
      console.log('🧹 Cleaning up Retell client');
      retellClient.stopCall();
    };
  }, [retellClient]);

  // Auto-scroll to bottom when transcript updates (only if user is already at bottom)
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom (within 100px)
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [transcript]);

  const startCall = async () => {
    try {
      console.log('📞 Starting call...');
      setIsLoading(true);
      setAudioError(null);
      
      // Initialize audio context for Windows compatibility
      if (!audioInitialized) {
        await initializeAudio();
      }
      
      // Fetch access token from backend
      console.log('🔑 Fetching access token from backend...');
      const response = await fetch('http://localhost:3001/api/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get access token from server');
      }

      const data = await response.json();
      console.log('✅ Access token received, starting call...');
      
      // Start the call with Retell
      await retellClient.startCall({
        accessToken: data.access_token,
        sampleRate: 24000,
        emitRawAudioSamples: false,
      });
      
      // Set a timeout to check if speech starts (Windows audio detection)
      const speechTimeout = setTimeout(() => {
        if (isConnected && !isSpeaking) {
          console.warn('⚠️ No speech detected after 30 seconds - potential Windows audio issue');
          setAudioError('No audio detected. If you can\'t hear the assistant, try refreshing the page or checking your audio settings.');
        }
      }, 30000);
      
      // Clear timeout when speech starts or call ends
      const clearTimeoutOnSpeech = () => clearTimeout(speechTimeout);
      retellClient.on('agent_start_talking', clearTimeoutOnSpeech);
      retellClient.on('call_ended', clearTimeoutOnSpeech);
      
    } catch (error) {
      console.error('❗ Failed to start call:', error);
      setIsLoading(false);
      setAudioError('Failed to start call. Please make sure the backend server is running on port 3001.');
    }
  };

  const endCall = () => {
    console.log('⛔ Stopping call...');
    retellClient.stopCall();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assests/background.png')`,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      {/* R-SYSTEMS Logo */}
      <div className="absolute top-8 left-8 z-10">
        <img 
          src="/assests/logo.png" 
          alt="R-SYSTEMS" 
          className="h-12 w-auto"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Controls */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-lg w-full px-8">
          {finalScore !== undefined && (
            <div className="mb-6 bg-white bg-opacity-95 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-center mb-4 text-gray-800">PHQ-9 Assessment Results</h2>
              <div className="flex flex-col items-center">
                <div className="w-64 h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Your Score', value: finalScore },
                          { name: 'Remaining', value: 27 - finalScore },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#EF4444" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{finalScore}/27</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {finalScore <= 4
                      ? 'Minimal Depression'
                      : finalScore <= 9
                      ? 'Mild Depression'
                      : finalScore <= 14
                      ? 'Moderate Depression'
                      : finalScore <= 19
                      ? 'Moderately Severe Depression'
                      : 'Severe Depression'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This is not a diagnosis. Please consult a healthcare professional.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!finalScore && !isConnected && !isLoading && (
            <div className="mb-8">
              {/* Chatbot Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-sm border border-white border-opacity-30">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <circle cx="9" cy="9" r="1.5"/>
                    <circle cx="15" cy="9" r="1.5"/>
                    <path d="M8 13.5h8v1H8z"/>
                  </svg>
                </div>
              </div>
              
              {/* Greeting Message */}
              <div className="text-center mb-8 mt-20">
                {/* <h1 className="text-3xl font-bold text-white mb-4">Good evening!</h1> */}
                <p className="text-xl text-white text-opacity-90">Can I help you with anything?</p>
              </div>
            </div>
          )}
          
          {!isConnected ? (
            <div>
              <button
                onClick={startCall}
                disabled={isLoading}
                className={`w-full py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isLoading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Please Wait! Connecting Best AI Agent ...
                  </div>
                ) : (
                  'Start Voice Assessment'
                )}
              </button>
              {isLoading && (
                <div className="text-center text-sm text-white text-opacity-90 mt-4 bg-black bg-opacity-30 p-3 rounded-lg backdrop-blur-sm">
                  It might take 15-20 sec to connect the best AI agent
                </div>
              )}
              {audioError && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Audio Issue Detected</h3>
                      <div className="mt-1 text-sm text-yellow-700">{audioError}</div>
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            setAudioError(null);
                            initializeAudio();
                          }}
                          className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                        >
                          Try Fix Audio
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-lg font-medium text-gray-800">
                    {isSpeaking ? 'Assistant Speaking...' : 'Listening...'}
                  </span>
                </div>
                <button
                  onClick={endCall}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-300 font-semibold hover:scale-105"
                >
                  End Call
                </button>
              </div>
              {audioError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Audio Not Working?</h3>
                      <div className="mt-1 text-sm text-red-700">{audioError}</div>
                      <div className="mt-2 text-xs text-red-600">
                        <strong>Windows troubleshooting:</strong>
                        <br />• Check speaker volume and ensure it's not muted
                        <br />• Try a different browser (Edge, Firefox)
                        <br />• Refresh the page and try again
                        <br />• Check Windows audio settings
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Bottom Right - Chat */}
      <div
        style={{
          height: '85vh',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          width: '420px',
        }}
        className="bg-white bg-opacity-20 shadow-2xl border border-white border-opacity-30 backdrop-blur-lg rounded-2xl"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 bg-opacity-90 p-4 border-b border-white border-opacity-20 rounded-t-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="text-base font-bold text-white">Conversation</h3>
              </div>
              {transcript.length > 0 && (
                <span className="text-xs text-white bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  {transcript.length} messages
                </span>
              )}
            </div>
          </div>
          
          {/* Chat Messages Container */}
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent"
            style={{
              scrollBehavior: 'smooth',
              overflowY: 'auto',
              height: 'auto',
            }}
          >
            {transcript.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-3">
                    <svg className="w-12 h-12 text-white text-opacity-50 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-white text-opacity-70 text-sm">Conversation will appear here...</p>
                </div>
              </div>
            ) : (
              transcript.map((msg, i) => (
                <div key={`msg-${i}-${msg.text.substring(0, 20)}`} className="animate-fadeIn">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-lg transition-all duration-200 hover:scale-[1.02] ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none backdrop-blur-sm'
                          : 'bg-white bg-opacity-95 text-gray-800 rounded-bl-none backdrop-blur-sm border border-gray-200'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                      </div>
                      <div className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
