
import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'}> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-8 h-8 border-4',
  };
  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent border-primary`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
