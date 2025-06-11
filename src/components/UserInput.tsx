
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './IconComponents'; // Adjusted path
import LoadingSpinner from './LoadingSpinner'; // Adjusted path

interface UserInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSendMessage, isLoading, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; // Set new height, max 120px
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 z-10 p-3 sm:p-4 bg-slate-800/80 backdrop-blur-md border-t border-slate-700"
    >
      <div className="flex items-end gap-2 sm:gap-3 bg-slate-700 rounded-xl p-1.5 shadow-md focus-within:ring-2 focus-within:ring-primary transition-shadow duration-200">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "AI assistant unavailable..." : "Ask about products or styles..."}
          className="flex-grow p-2.5 bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none resize-none overflow-y-auto scrollbar-thin max-h-[120px]"
          rows={1}
          disabled={isLoading || disabled}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim() || disabled}
          className="p-2.5 rounded-lg text-white bg-primary hover:bg-primary-dark focus:ring-2 focus:ring-primary-light focus:outline-none transition-all duration-200 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {isLoading ? <LoadingSpinner size="sm" /> : <SendIcon className="w-5 h-5" />}
        </button>
      </div>
    </form>
  );
};

export default UserInput;