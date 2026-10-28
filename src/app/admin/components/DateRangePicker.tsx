'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarMonthView } from './date-range/CalendarMonthView';
import { QuickRangeSelector } from './date-range/QuickRangeSelector';
import { Button } from '@/components/ui/button';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setTempStartDate(date);
      setTempEndDate(null);
      setSelectingStart(false);
    } else {
      if (tempStartDate && date < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(date);
      } else {
        setTempEndDate(date);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setSelectingStart(true);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectingStart(true);
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
    } else if (startDate) {
      return `From ${formatDisplayDate(startDate)}`;
    } else if (endDate) {
      return `Until ${formatDisplayDate(endDate)}`;
    }
    return 'Select date range';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleQuickRange = (start: Date, end: Date) => {
    setTempStartDate(start);
    setTempEndDate(end);
    onDateRangeChange(start, end);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background hover:bg-secondary border border-border rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 px-3.5 py-2 transition-colors cursor-pointer min-w-0"
      >
        <Calendar className="size-3.5 shrink-0 text-primary" />
        <span className="truncate">{getDisplayText()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 w-screen sm:w-96 max-w-sm sm:max-w-none -mx-4 sm:mx-0 overflow-hidden text-foreground"
          >
            <div className="p-4 sm:p-5">
              <QuickRangeSelector onSelectRange={handleQuickRange} />

              <CalendarMonthView
                currentMonth={currentMonth}
                onNavigateMonth={navigateMonth}
                selectingStart={selectingStart}
                tempStartDate={tempStartDate}
                tempEndDate={tempEndDate}
                onDateClick={handleDateClick}
              />

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-border gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleClear}
                >
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApply}
                    className="gap-1.5"
                  >
                    <Check className="size-3.5" />
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
