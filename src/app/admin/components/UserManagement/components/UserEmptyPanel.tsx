'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <ShieldCheck className="size-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">User Details & Editor</h3>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-6 leading-relaxed">
        Select a user from the list on the left to edit their permissions, change passwords, or toggle account status.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onStartCreate}
        className="bg-cc-ground hover:bg-white/5"
      >
        <UserPlus className="size-3.5 text-emerald-400 mr-2" />
        <span>Or create a new user</span>
      </Button>
    </motion.div>
  );
};

export default UserEmptyPanel;
