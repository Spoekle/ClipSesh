'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';

interface PasswordStrengthBarProps {
  strength: number;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ strength }) => {
  const getStrengthClass = (): string => {
    switch (strength) {
      case 0:
        return 'bg-red-500';
      case 1:
        return 'bg-orange-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-emerald-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStrengthText = (): string => {
    switch (strength) {
      case 0:
        return 'Very weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Medium';
      case 3:
        return 'Strong';
      case 4:
        return 'Very strong';
      default:
        return '';
    }
  };

  return (
    <div className="mt-3">
      <div className="flex justify-between mb-1 text-xs">
        <div className="font-medium flex items-center text-muted-foreground">
          <FaShieldAlt className="mr-1 text-primary" /> Strength: {getStrengthText()}
        </div>
      </div>
      <div className="h-2 w-full bg-cc-ground rounded-full overflow-hidden border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${strength * 25}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full ${getStrengthClass()}`}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthBar;
