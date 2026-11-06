'use client';

import React, { useState } from 'react';
import { CalendarClock, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSeasonStatus, useUpdateSeasonAutomation } from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';
import { SeasonAutomationConfig } from '@/types/adminTypes';

const MIN_ARCHIVE_DAY = 21;
const MAX_ARCHIVE_DAY = 28;

export const SeasonAutomationSection: React.FC = () => {
  const { data, isLoading, isError, refetch } = useSeasonStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <CalendarClock className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Season Automation</h3>
          <p className="text-xs text-muted-foreground">
            Seasons change on the 21st of March, June, September and December. The closing season is
            zipped and archived automatically on the archive day.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Loading automation settings…</span>
        </div>
      ) : isError || !data ? (
        <div className="flex items-center justify-between bg-cc-ground border border-border p-4 rounded-xl text-xs text-muted-foreground">
          <span>Could not load season automation settings.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <SeasonAutomationForm
          key={`${data.seasonAutomation.enabled}-${data.seasonAutomation.zipArchiveDay}`}
          settings={data.seasonAutomation}
        />
      )}
    </div>
  );
};

const SeasonAutomationForm: React.FC<{ settings: SeasonAutomationConfig }> = ({ settings }) => {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [zipArchiveDay, setZipArchiveDay] = useState(String(settings.zipArchiveDay));
  const updateMutation = useUpdateSeasonAutomation();
  const { showSuccess, showError } = useNotification();

  const parsedDay = Number(zipArchiveDay);
  const isDayValid =
    Number.isInteger(parsedDay) && parsedDay >= MIN_ARCHIVE_DAY && parsedDay <= MAX_ARCHIVE_DAY;
  const isDirty = enabled !== settings.enabled || parsedDay !== settings.zipArchiveDay;
  const skips = settings.autoArchiveSkips ?? [];

  const handleSave = async () => {
    if (!isDayValid) return;
    try {
      await updateMutation.mutateAsync({ enabled, zipArchiveDay: parsedDay });
      showSuccess('Season automation settings saved');
    } catch {
      showError('Failed to save season automation settings. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-cc-ground border border-border p-4 rounded-xl flex items-start justify-between gap-4">
          <div>
            <label
              htmlFor="seasonAutomationEnabled"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
            >
              Automatic Archiving
            </label>
            <p className="text-[11px] text-muted-foreground">
              When off, seasons are only archived when an admin force-archives them
            </p>
          </div>
          <Switch
            id="seasonAutomationEnabled"
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(checked)}
          />
        </div>

        <div className="bg-cc-ground border border-border p-4 rounded-xl">
          <label
            htmlFor="zipArchiveDay"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
          >
            Archive Day
          </label>
          <Input
            type="number"
            id="zipArchiveDay"
            value={zipArchiveDay}
            onChange={(e) => setZipArchiveDay(e.target.value)}
            className="bg-cc-card border-border text-xs text-white"
            min={MIN_ARCHIVE_DAY}
            max={MAX_ARCHIVE_DAY}
            aria-invalid={!isDayValid}
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {isDayValid
              ? `Day of the transition month the closing season is archived. Days 21–${parsedDay - 1} are a voting grace period.`
              : `Enter a whole number from ${MIN_ARCHIVE_DAY} to ${MAX_ARCHIVE_DAY}.`}
          </p>
        </div>
      </div>

      {skips.length > 0 && (
        <div className="bg-cc-ground border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Paused Seasons
          </p>
          <p className="text-[11px] text-muted-foreground mb-2">
            These seasons were unarchived by an admin, so they won&apos;t be archived automatically.
            Force-archive a season from Content Management to resume.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skips.map((skip) => (
              <span
                key={`${skip.season}-${skip.year}`}
                className="px-2 py-0.5 rounded-md bg-cc-card border border-border text-[11px] text-white"
              >
                {skip.season} {skip.year}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="default"
        size="default"
        onClick={handleSave}
        disabled={!isDirty || !isDayValid || updateMutation.isPending}
        className="w-full gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold"
      >
        {updateMutation.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        <span>Save Automation Settings</span>
      </Button>
    </div>
  );
};

export default SeasonAutomationSection;
