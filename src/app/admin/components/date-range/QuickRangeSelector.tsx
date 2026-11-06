import React from 'react';

interface QuickRange {
  label: string;
  start: Date;
  end: Date;
}

interface QuickRangeSelectorProps {
  onSelectRange: (start: Date, end: Date) => void;
}

export const QuickRangeSelector: React.FC<QuickRangeSelectorProps> = ({
  onSelectRange,
}) => {
  const getQuickRanges = (): QuickRange[] => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    return [
      {
        label: 'Last 7 days',
        start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        end: today,
      },
      {
        label: 'Last 30 days',
        start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        end: today,
      },
      {
        label: 'Last 3 months',
        start: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
        end: today,
      },
      {
        label: 'This year',
        start: new Date(today.getFullYear(), 0, 1),
        end: today,
      },
    ];
  };

  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
        Quick select:
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {getQuickRanges().map((range, index) => (
          <button
            key={index}
            onClick={() => onSelectRange(range.start, range.end)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-cc-ground hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer"
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};
