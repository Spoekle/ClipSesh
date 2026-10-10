'use client';

import React from 'react';

export const CCAuthButton: React.FC = () => {
  const handleCCLogin = () => {
    window.location.href = '/api/cc/auth';
  };

  return (
    <button
      type="button"
      onClick={handleCCLogin}
      className="w-full flex items-center justify-center gap-2 bg-cc-red hover:bg-cc-red-hover active:bg-cc-red-active text-white py-2.5 rounded-full transition duration-150 text-sm font-medium shadow-sm cursor-pointer"
    >
      <img
        src="/cc-icon.svg"
        alt="CC"
        className="w-[18px] h-[18px] object-contain shrink-0"
      />
      <span>Sign in with CC</span>
    </button>
  );
};

export default CCAuthButton;
