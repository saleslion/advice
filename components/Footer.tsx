
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800/50 backdrop-blur-md p-3 text-center text-sm text-gray-400 border-t border-slate-700">
      <p>&copy; {new Date().getFullYear()} AI Product Recommender. Powered by Gemini.</p>
    </footer>
  );
};

export default Footer;
