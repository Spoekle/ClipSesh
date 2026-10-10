'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaUserPlus } from 'react-icons/fa';

interface UserEmptyPanelProps {
  onStartCreate: () => void;
}

export const UserEmptyPanel: React.FC<UserEmptyPanelProps> = ({ onStartCreate }) => {
  return (
    <motion.div
      key="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-cc-card border border-border p-8 rounded-2xl text-center select-none"
    >
      <div className="w-14 h-14 rounded-2xl bg-cc-ground border border-border flex items-center justify-center text-muted-foreground mx-auto mb-4 text-xl">
        <FaUserShield />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">User Details & Editor</h3>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
        Select a user from the list on the left to edit their permissions, change passwords, or toggle account status.
      </p>
      <button
        type="button"
        onClick={onStartCreate}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cc-ground hover:bg-white/5 text-foreground text-xs font-medium border border-border transition-colors cursor-pointer"
      >
        <FaUserPlus className="text-emerald-400" />
        <span>Or create a new user</span>
      </button>
    </motion.div>
  );
};

export default UserEmptyPanel;
