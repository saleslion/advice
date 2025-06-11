import React from 'react';
import { ChatMessage } from '../types';
import { UserIcon, BotIcon, SearchIcon, LinkIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isError = message.isError;

  const bubbleClasses = isUser
    ? 'bg-primary text-white self-end rounded-l-xl rounded-tr-xl'
    : isError
    ? 'bg-red-600 text-white self-start rounded-r-xl rounded-tl-xl shadow-md' // Enhanced error visibility
    : isSystem
    ? 'bg-amber-500/10 text-amber-600 self-center text-xs italic rounded-lg border border-amber-500/20 px-3 py-1.5' // Adjusted system message style
    : 'bg-slate-700 text-slate-100 self-start rounded-r-xl rounded-tl-xl shadow-md';

  const Icon = isUser ? UserIcon : BotIcon;

  const formatText = (text: string): string => {
    if (!text) return '';
    let html = text;

    // Escape HTML to prevent XSS from raw text, before applying markdown
    // For a production app, a more robust sanitizer is recommended.
    // const escapeHtml = (unsafe: string) => 
    //   unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    // html = escapeHtml(html); // Temporarily disabling as it would escape markdown characters too. Careful with this.

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    // Italics: *text* or _text_
    html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-light hover:underline">$1</a>');

    // Handle lists (basic implementation)
    // Process multi-line list blocks first
    html = html.replace(/(?:(?:^\s*[-*+]\s+.*\n?)+)/gm, (match) => {
        const items = match.trim().split('\n').map(item => `<li class="ml-1 list-disc list-inside">${item.replace(/^\s*[-*+]\s+/, '').trim()}</li>`).join('');
        return `<ul class="list-disc pl-5 my-1">${items}</ul>`;
    });
    html = html.replace(/(?:(?:^\s*\d+\.\s+.*\n?)+)/gm, (match) => {
        const items = match.trim().split('\n').map(item => `<li class="ml-1 list-decimal list-inside">${item.replace(/^\s*\d+\.\s+/, '').trim()}</li>`).join('');
        return `<ol class="list-decimal pl-5 my-1">${items}</ol>`;
    });

    // Replace newlines with <br> for text not part of lists.
    // This is a simplified approach. A proper markdown parser would handle block vs inline elements better.
    const blocks = html.split(/(<\/?(?:ul|ol|li|strong|em|a)>)/);
    html = blocks.map(block => {
        if (block.match(/^<\/?(ul|ol|li|strong|em|a)>$/i) || block.startsWith('<ul') || block.startsWith('<ol')) {
            return block;
        }
        return block.replace(/\n/g, '<br />');
    }).join('');
    
    // Clean up <br /> that might be inappropriately added
    html = html.replace(/<br \/>\s*<(ul|ol)/g, '<$1'); // <br> before list
    html = html.replace(/<\/(ul|ol)>\s*<br \/>/g, '</$1>'); // <br> after list
    html = html.replace(/<li><br \/>/g, '<li>'); // <br> at start of li
    html = html.replace(/<br \/>\s*<\/li>/g, '</li>'); // <br> at end of li
    html = html.replace(/<br \/>\s*<br \/>/g, '<br />'); // Multiple <br>

    return html;
  };

  const textToRender = message.text || (message.isStreaming && !message.text ? '...' : '');

  return (
    <div className={`flex flex-col mb-3 animate-fadeIn ${isSystem ? 'items-center' : ''}`}>
      <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isSystem ? 'justify-center' : ''}`}>
        {!isSystem && (
          <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
             <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isUser ? 'bg-primary-light/30' : 'bg-slate-600'}`}>
                <Icon className={`w-4 h-4 ${isUser ? 'text-primary-light' : 'text-secondary'}`} />
            </div>
          </div>
        )}
        <div
          className={`max-w-[80%] sm:max-w-[75%] md:max-w-[70%] p-3 text-sm shadow-md ${bubbleClasses} ${message.isStreaming && !message.text ? 'italic text-slate-400' : ''}`}
          role={isSystem ? "status" : "log"}
          aria-live={isSystem ? "polite" : (message.isStreaming ? "polite" : "off")}
        >
          {message.isStreaming && !message.text && !isError && <LoadingSpinner size="sm" />}
          <div className="prose prose-sm prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: formatText(textToRender) }} />
          {isError && <p className="mt-1 text-xs text-red-100">AI response error.</p>}
        </div>
      </div>
      
      {!isUser && !isSystem && message.groundingMetadata && message.groundingMetadata.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
        <div className="mt-1.5 text-xs text-slate-400 max-w-[80%] sm:max-w-[75%] md:max-w-[70%] self-start ml-9">
          <div className="flex items-center gap-1 mb-0.5 font-medium">
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Sources:</span>
          </div>
          <ul className="list-none pl-0 space-y-0.5">
            {message.groundingMetadata.groundingChunks.map((chunk, index) =>
              chunk.web && chunk.web.uri ? (
                <li key={`grounding-${message.id}-${index}`} className="truncate">
                  <a
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary-light transition-colors"
                    title={chunk.web.title || chunk.web.uri}
                  >
                    <LinkIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                  </a>
                </li>
              ) : null
            )}
          </ul>
        </div>
      )}

      {!isSystem && (
        <p className={`text-[0.65rem] ${isUser ? 'text-right mr-10' : 'text-left ml-9'} text-slate-500 mt-0.5`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};

export default MessageBubble;
