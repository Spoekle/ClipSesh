'use client';

import React from 'react';
import {
  FaUser,
  FaVideo,
  FaLink,
  FaIdCard,
  FaArchive,
  FaCalendarAlt,
  FaSnowflake,
} from 'react-icons/fa';

export interface EditErrors {
  streamer?: string;
  title?: string;
  link?: string;
  submitterId?: string;
  year?: string;
}

interface EditClipFormFieldsProps {
  streamer: string;
  setStreamer: (val: string) => void;
  submitter: string;
  setSubmitter: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  link: string;
  setLink: (val: string) => void;
  submitterId: string;
  setSubmitterId: (val: string) => void;
  season: string;
  setSeason: (val: string) => void;
  year: string;
  setYear: (val: string) => void;
  archived: boolean;
  setArchived: (val: boolean) => void;
  isLoading: boolean;
  errors: EditErrors;
}

export const EditClipFormFields: React.FC<EditClipFormFieldsProps> = ({
  streamer,
  setStreamer,
  submitter,
  setSubmitter,
  title,
  setTitle,
  link,
  setLink,
  submitterId,
  setSubmitterId,
  season,
  setSeason,
  year,
  setYear,
  archived,
  setArchived,
  isLoading,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <FaUser className="inline mr-2 text-primary" />
          Streamer <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          value={streamer}
          onChange={(e) => setStreamer(e.target.value)}
          placeholder="Streamer name"
          className={`w-full px-3 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-border/80 transition-colors ${
            errors.streamer ? '!border-rose-500' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.streamer && (
          <p className="text-rose-500 text-xs mt-1 font-medium">{errors.streamer}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <FaUser className="inline mr-2 text-muted-foreground/60" />
          Submitter
        </label>
        <input
          type="text"
          value={submitter}
          onChange={(e) => setSubmitter(e.target.value)}
          placeholder="Submitted by"
          className="w-full px-3 py-2 bg-cc-ground border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-border/80 transition-colors"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <FaVideo className="inline mr-2 text-muted-foreground/60" />
          Title <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Clip title"
          className={`w-full px-3 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-border/80 transition-colors ${
            errors.title ? '!border-rose-500' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-rose-500 text-xs mt-1 font-medium">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <FaLink className="inline mr-2 text-muted-foreground/60" />
          Source URL
        </label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Original clip URL (optional)"
          className={`w-full px-3 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-border/80 transition-colors ${
            errors.link ? '!border-rose-500' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.link && (
          <p className="text-rose-500 text-xs mt-1 font-medium">{errors.link}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          <FaIdCard className="inline mr-2 text-muted-foreground/60" />
          Submitter Discord ID
        </label>
        <input
          type="text"
          value={submitterId}
          onChange={(e) => setSubmitterId(e.target.value)}
          placeholder="Discord user ID (optional)"
          className={`w-full px-3 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-border/80 transition-colors ${
            errors.submitterId ? '!border-rose-500' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.submitterId && (
          <p className="text-rose-500 text-xs mt-1 font-medium">{errors.submitterId}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            <FaSnowflake className="inline mr-2 text-muted-foreground/60" />
            Season
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full px-3 py-2 bg-cc-ground border border-border rounded-xl text-xs text-foreground outline-none focus:border-border/80 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <option value="">Select Season</option>
            <option value="Winter">Winter</option>
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
            <option value="Fall">Fall</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            <FaCalendarAlt className="inline mr-2 text-muted-foreground/60" />
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            min="1900"
            max={new Date().getFullYear() + 10}
            className={`w-full px-3 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-border/80 transition-colors ${
              errors.year ? '!border-rose-500' : 'border-border'
            }`}
            disabled={isLoading}
          />
          {errors.year && (
            <p className="text-rose-500 text-xs mt-1 font-medium">{errors.year}</p>
          )}
        </div>
      </div>

      <div className="pt-1">
        <label className="flex items-center text-xs font-semibold text-muted-foreground mb-1">
          <FaArchive className="inline mr-2 text-muted-foreground/60" />
          Archived Status
        </label>
        <label className="flex items-center cursor-pointer gap-2 mt-1">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded cursor-pointer accent-primary"
            disabled={isLoading}
          />
          <span className="text-xs text-foreground font-medium">
            Mark as archived
          </span>
        </label>
      </div>
    </div>
  );
};

export default EditClipFormFields;
