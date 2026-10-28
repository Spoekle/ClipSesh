import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarMonthViewProps {
  currentMonth: Date;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  selectingStart: boolean;
  tempStartDate: Date | null;
  tempEndDate: Date | null;
  onDateClick: (date: Date) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentMonth,
  onNavigateMonth,
  selectingStart,
  tempStartDate,
  tempEndDate,
  onDateClick,
}) => {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return date >= tempStartDate && date <= tempEndDate;
  };

  const isDateSelected = (date: Date) => {
    return (
      (tempStartDate && date.getTime() === tempStartDate.getTime()) ||
      (tempEndDate && date.getTime() === tempEndDate.getTime())
    );
  };

  return (
    <>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <button
          type="button"
          onClick={() => onNavigateMonth('prev')}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <h3 className="font-semibold text-foreground text-xs sm:text-sm">
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <button
          type="button"
          onClick={() => onNavigateMonth('next')}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      {/* Status indicator */}
      <div className="mb-3 text-[11px] text-primary font-medium text-center">
        {selectingStart ? 'Select start date' : 'Select end date'}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="text-[10px] font-semibold text-center py-1 text-muted-foreground uppercase"
          >
            {day}
          </div>
        ))}
        {getDaysInMonth(currentMonth).map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => onDateClick(date)}
                className={`w-full h-full text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer font-medium ${
                  isDateSelected(date)
                    ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                    : isDateInRange(date)
                    ? 'bg-primary/15 text-primary'
                    : 'hover:bg-secondary text-foreground'
                }`}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
