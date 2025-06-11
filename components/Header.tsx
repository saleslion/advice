
import React from 'react';
import { BotIcon } from './IconComponents';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-md shadow-lg p-4 text-white sticky top-0 z-10">
      <div className="container mx-auto flex items-center gap-3">
        <BotIcon className="w-8 h-8 text-primary-light" />
        <h1 className="text-2xl font-bold tracking-tight">
          Shopify AI Product Recommender
        </h1>
      </div>
    </header>
  );
};

export default Header;
