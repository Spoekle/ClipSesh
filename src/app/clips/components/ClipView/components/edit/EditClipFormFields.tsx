'use client';

import React from 'react';
import {
  User,
  Film,
  Link2,
  IdCard,
  Archive,
  Calendar,
  Snowflake,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
          <User className="size-3.5 text-primary" />
          <span>Streamer <span className="text-primary">*</span></span>
        </Label>
        <Input
          type="text"
          value={streamer}
          onChange={(e) => setStreamer(e.target.value)}
          placeholder="Streamer name"
          className={`h-9 bg-background border text-xs text-foreground placeholder:text-muted-foreground ${
            errors.streamer ? 'border-destructive' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.streamer && (
          <p className="text-destructive text-xs mt-1 font-medium">{errors.streamer}</p>
        )}
      </div>

      <div>
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
          <User className="size-3.5 text-muted-foreground/60" />
          <span>Submitter</span>
        </Label>
        <Input
          type="text"
          value={submitter}
          onChange={(e) => setSubmitter(e.target.value)}
          placeholder="Submitted by"
          className="h-9 bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
          <Film className="size-3.5 text-muted-foreground/60" />
          <span>Title <span className="text-primary">*</span></span>
        </Label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Clip title"
          className={`h-9 bg-background border text-xs text-foreground placeholder:text-muted-foreground ${
            errors.title ? 'border-destructive' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-destructive text-xs mt-1 font-medium">{errors.title}</p>
        )}
      </div>

      <div>
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
          <Link2 className="size-3.5 text-muted-foreground/60" />
          <span>Source URL</span>
        </Label>
        <Input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Original clip URL (optional)"
          className={`h-9 bg-background border text-xs text-foreground placeholder:text-muted-foreground ${
            errors.link ? 'border-destructive' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.link && (
          <p className="text-destructive text-xs mt-1 font-medium">{errors.link}</p>
        )}
      </div>

      <div>
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
          <IdCard className="size-3.5 text-muted-foreground/60" />
          <span>Submitter Discord ID</span>
        </Label>
        <Input
          type="text"
          value={submitterId}
          onChange={(e) => setSubmitterId(e.target.value)}
          placeholder="Discord user ID (optional)"
          className={`h-9 bg-background border text-xs text-foreground placeholder:text-muted-foreground ${
            errors.submitterId ? 'border-destructive' : 'border-border'
          }`}
          disabled={isLoading}
        />
        {errors.submitterId && (
          <p className="text-destructive text-xs mt-1 font-medium">{errors.submitterId}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
            <Snowflake className="size-3.5 text-muted-foreground/60" />
            <span>Season</span>
          </Label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full h-9 px-3 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-ring transition-colors cursor-pointer"
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
          <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
            <Calendar className="size-3.5 text-muted-foreground/60" />
            <span>Year</span>
          </Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            min="1900"
            max={new Date().getFullYear() + 10}
            className={`h-9 bg-background border text-xs text-foreground placeholder:text-muted-foreground ${
              errors.year ? 'border-destructive' : 'border-border'
            }`}
            disabled={isLoading}
          />
          {errors.year && (
            <p className="text-destructive text-xs mt-1 font-medium">{errors.year}</p>
          )}
        </div>
      </div>

      <div className="pt-1">
        <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
          <Archive className="size-3.5 text-muted-foreground/60" />
          <span>Archived Status</span>
        </Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="archived-checkbox"
            checked={archived}
            onCheckedChange={(checked) => setArchived(checked === true)}
            disabled={isLoading}
          />
          <label
            htmlFor="archived-checkbox"
            className="text-xs text-foreground font-medium leading-none cursor-pointer"
          >
            Mark as archived
          </label>
        </div>
      </div>
    </div>
  );
};

export default EditClipFormFields;
