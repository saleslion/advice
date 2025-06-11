
import React, 'react';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Footer from './components/Footer';

const App: React.FC = () => {
  const apiKey = process.env.API_KEY;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white selection:bg-primary/70 selection:text-white">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {!apiKey && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-6 rounded-lg shadow-xl z-50 text-center">
            <h2 className="text-2xl font-bold mb-3">API Key Missing</h2>
            <p className="text-lg">
              The Gemini API key is not configured.
            </p>
            <p className="text-sm mt-2">
              Please set the <code className="bg-red-800 px-1 rounded">API_KEY</code> environment variable.
            </p>
          </div>
        )}
        <ChatInterface apiKeyAvailable={!!apiKey} />
      </main>
      <Footer />
    </div>
  );
};

export default App;
