
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, GroundingMetadata } from '@google/genai';
import { ChatMessage, ShopifyProduct } from '../types';
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT_TEMPLATE, INITIAL_BOT_MESSAGE, CHAT_MAX_HEIGHT_VH } from '../constants';
import { fetchShopifyProducts, generateProductCatalogOverview, areShopifyCredentialsPlaceholders, getShopifyStoreDomain } from '../services/shopifyService';
import MessageBubble from './MessageBubble';
import UserInput from './UserInput';
import LoadingSpinner from './LoadingSpinner';

interface ChatInterfaceProps {
  apiKeyAvailable: boolean; // Gemini API Key
}

// Note: Gemini API_KEY is expected to be set in the execution environment (e.g., .env.development.local) as per project guidelines.
// Shopify credentials (SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN) are also expected to be in the environment.

const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiKeyAvailable }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For AI responses
  const [error, setError] = useState<string | null>(null); // For global errors like Gemini init
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isGeminiInitialized, setIsGeminiInitialized] = useState(false);
  // shopifyProducts state is removed as we will generate overview directly. If products needed for other UI, re-add.
  const [isShopifyLoading, setIsShopifyLoading] = useState(true); 
  const [shopifyError, setShopifyError] = useState<string | null>(null);
  const [currentSystemInstruction, setCurrentSystemInstruction] = useState<string | null>(null);
  const [initializationMessage, setInitializationMessage] = useState("Initializing AudioGuide...");

  // This function now correctly checks if the actual env vars are missing or are known placeholders
  const shopifyConfigIsMissingOrPlaceholder = areShopifyCredentialsPlaceholders();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Step 1: Fetch Shopify Products & Prepare System Instruction
  useEffect(() => {
    if (!apiKeyAvailable) {
        setInitializationMessage("Gemini API Key not configured. AudioGuide cannot operate.");
        setShopifyError("Gemini API Key missing."); 
        setIsShopifyLoading(false);
        return;
    }
    
    setIsShopifyLoading(true);

    const loadShopifyDataAndSetSystemInstruction = async () => {
      if (shopifyConfigIsMissingOrPlaceholder) {
        const warningMsg = "Shopify connection not configured or using placeholder credentials. Product-specific recommendations will be limited. Please set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variables.";
        console.warn(warningMsg);
        setInitializationMessage(warningMsg);
        const overview = generateProductCatalogOverview([]); // Empty overview for safety
        const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace("{productCatalogOverview}", overview);
        setCurrentSystemInstruction(systemInstruction);
        setIsShopifyLoading(false);
        setShopifyError("Shopify not configured. Product data is unavailable."); 
        return;
      }

      setInitializationMessage(`Loading product catalog from ${getShopifyStoreDomain()}...`);
      try {
        const products = await fetchShopifyProducts(25); // Fetch up to 25 products
        const overview = generateProductCatalogOverview(products);
        const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace("{productCatalogOverview}", overview);
        setCurrentSystemInstruction(systemInstruction);
        setShopifyError(null);
      } catch (e: any) {
        console.error("Failed to load Shopify products:", e);
        const shopifyFailMsg = `Failed to load products from Shopify: ${e.message}. Product recommendations may be unavailable or general. Ensure Shopify credentials are correct.`;
        setShopifyError(shopifyFailMsg);
        // Fallback system prompt if Shopify fails
        const overview = generateProductCatalogOverview([]);
        const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace("{productCatalogOverview}", overview);
        setCurrentSystemInstruction(systemInstruction);
      } finally {
        setIsShopifyLoading(false);
      }
    };

    loadShopifyDataAndSetSystemInstruction();
  }, [apiKeyAvailable, shopifyConfigIsMissingOrPlaceholder]); // Depend on the check result

  // Step 2: Initialize Gemini Chat (depends on Shopify products/system instruction)
  const initializeChat = useCallback(async () => {
    if (!apiKeyAvailable || !currentSystemInstruction) {
      if (!currentSystemInstruction && apiKeyAvailable && !isShopifyLoading) {
        setInitializationMessage("Preparing AI assistant with product data...");
      }
      return;
    }
    
    setInitializationMessage("Connecting to AI assistant...");
    setIsLoading(true); 
    try {
      const apiKey = process.env.API_KEY; // This is correctly read from env by App.tsx and passed via apiKeyAvailable.
                                        // But Gemini SDK needs the key directly.
      if (!apiKey) throw new Error("Gemini API_KEY environment variable not found for SDK initialization.");

      const ai = new GoogleGenAI({ apiKey });
      const newChat = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
          systemInstruction: currentSystemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });
      setChat(newChat);
      setError(null); 
      
      let botWelcomeMessage = INITIAL_BOT_MESSAGE.replace("Please give me a moment... Once I'm ready, I", "I'm ready and");
      if (shopifyError && shopifyError !== "Gemini API Key missing.") { 
        botWelcomeMessage += `\n\nNote: ${shopifyError}`;
      } else if (shopifyConfigIsMissingOrPlaceholder) {
         botWelcomeMessage += `\n\nNote: Shopify connection not fully configured. Product-specific advice may be limited.`
      }

      setMessages([{ 
        id: Date.now().toString(), 
        text: botWelcomeMessage, 
        sender: 'ai', 
        timestamp: new Date() 
      }]);
    } catch (e: any) {
      console.error("Failed to initialize Gemini chat:", e);
      const initErrorMessage = `Failed to initialize AI: ${e.message || 'Unknown error'}`;
      setError(initErrorMessage); 
      setMessages(prev => [...prev, {
        id: 'init-error',
        text: initErrorMessage,
        sender: 'system',
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
      setIsGeminiInitialized(true);
    }
  }, [apiKeyAvailable, currentSystemInstruction, shopifyError, shopifyConfigIsMissingOrPlaceholder, isShopifyLoading]);

  useEffect(() => {
    if (!isShopifyLoading && currentSystemInstruction && !isGeminiInitialized) {
      initializeChat();
    }
  }, [isShopifyLoading, currentSystemInstruction, isGeminiInitialized, initializeChat]);


  const handleSendMessage = async (text: string) => {
    if (!chat || !apiKeyAvailable) {
      const sendErrorMessage = "Cannot send message. Chat service is not available. Ensure API keys (Gemini, Shopify) are configured.";
       setMessages(prev => [...prev, {
        id: 'send-error-' + Date.now(),
        text: sendErrorMessage,
        sender: 'system',
        timestamp: new Date(),
        isError: true,
      }]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      const stream = await chat.sendMessageStream({ message: text });
      let currentAiText = '';
      let finalGroundingMetadata: GroundingMetadata | undefined = undefined;

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          currentAiText += chunkText;
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiMessageId ? { ...msg, text: currentAiText, isStreaming: true } : msg
            )
          );
        }
        if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].groundingMetadata) {
           finalGroundingMetadata = chunk.candidates[0].groundingMetadata as GroundingMetadata;
        }
      }

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === aiMessageId ? {
            ...msg,
            text: currentAiText,
            isStreaming: false,
            groundingMetadata: finalGroundingMetadata
          } : msg
        )
      );

    } catch (e: any) {
      console.error("Error sending message to Gemini:", e);
      const errorMessageText = `AI Error: ${e.message || 'Could not get a response.'}`;
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, text: errorMessageText, sender: 'ai' as 'ai', isStreaming: false, isError: true }
            : msg
        )
      );
       setMessages(prev => [...prev, {
        id: 'error-msg-' + Date.now(),
        text: `Error during AI response: ${errorMessageText}`,
        sender: 'system',
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Loading and Error States Rendering ----

  if (!apiKeyAvailable && shopifyError === "Gemini API Key missing.") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-xl font-semibold text-red-400 mb-3">AudioGuide Unavailable</h2>
        <p className="text-slate-300">{initializationMessage}</p>
        <p className="text-xs text-slate-500 mt-2">Please ensure the Gemini API key is correctly configured in your environment.</p>
      </div>
    );
  }

  if (isShopifyLoading || (!isGeminiInitialized && apiKeyAvailable && currentSystemInstruction === null && !shopifyError)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-300">{initializationMessage}</p>
        {isShopifyLoading && <p className="text-xs text-slate-400">Fetching products from {getShopifyStoreDomain()}...</p>}
        {!isShopifyLoading && currentSystemInstruction === null && !shopifyError && <p className="text-xs text-slate-400">Preparing AI assistant...</p>}
         {shopifyConfigIsMissingOrPlaceholder && !isShopifyLoading && (
            <p className="text-amber-400 text-sm mt-2">Shopify not fully configured. Product features limited.</p>
        )}
      </div>
    );
  }
  
  if (!isGeminiInitialized && apiKeyAvailable && currentSystemInstruction && !isLoading && !error) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-300">{initializationMessage || "Finalizing AI assistant setup..."}</p>
        {shopifyError && shopifyError !== "Gemini API Key missing." && <p className="text-amber-400 text-sm mt-2">{shopifyError}</p>}
      </div>
    );
  }

  if (error && !chat) { 
     return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-xl font-semibold text-red-400 mb-3">AI Initialization Error</h2>
        <p className="text-slate-300">{error}</p>
        <p className="text-xs text-slate-500 mt-2">Please check console for details and verify API configurations. Refresh to try again.</p>
      </div>
    );
  }
  
  if (isGeminiInitialized || messages.length > 0) {
    return (
      <div className="flex flex-col w-full max-w-3xl h-full bg-slate-800 shadow-2xl rounded-lg overflow-hidden border border-slate-700">
        <div
          id="message-list"
          className="flex-grow p-3 sm:p-5 space-y-3 overflow-y-auto scrollbar-thin"
          style={{ maxHeight: `${CHAT_MAX_HEIGHT_VH}vh` }} 
          aria-live="polite"
        >
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <UserInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          disabled={!chat || !apiKeyAvailable || (!!error && !messages.some(m => m.sender ==='ai'))} 
        />
      </div>
    );
  }

  return (
     <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-300">Loading AudioGuide...</p>
         {shopifyError && <p className="text-amber-400 text-sm mt-2">{shopifyError}</p>}
      </div>
  );
};

export default ChatInterface;
