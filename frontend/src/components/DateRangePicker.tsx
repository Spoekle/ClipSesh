import React, { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaTimes, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
  className = ''
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
        // If end date is before start date, swap them
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
      day: 'numeric' 
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let startDayOfWeek = firstDay.getDay();
    // Convert to Monday-first (0 = Monday, 1 = Tuesday, etc.)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
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
    return (tempStartDate && date.getTime() === tempStartDate.getTime()) ||
           (tempEndDate && date.getTime() === tempEndDate.getTime());
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getQuickRanges = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today
    
    return [
      {
        label: 'Last 7 days',
        start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        end: today
      },
      {
        label: 'Last 30 days',
        start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        end: today
      },
      {
        label: 'Last 3 months',
        start: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
        end: today
      },
      {
        label: 'This year',
        start: new Date(today.getFullYear(), 0, 1),
        end: today
      }
    ];
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
        className="flex items-center gap-2 px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors border border-neutral-300 dark:border-neutral-600 text-sm sm:text-base min-w-0"
      >
        <FaCalendarAlt className="text-sm flex-shrink-0" />
        <span className="text-xs sm:text-sm truncate">{getDisplayText()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 w-screen sm:w-96 max-w-sm sm:max-w-none -mx-4 sm:mx-0"
          >
            <div className="p-3 sm:p-4">
              {/* Quick ranges */}
              <div className="mb-3 sm:mb-4">
                <h4 className="text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">Quick select:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getQuickRanges().map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickRange(range.start, range.end)}
                      className="text-xs px-2 py-2 sm:py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-left sm:text-center"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 sm:p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-lg sm:text-base"
                >
                  ←
                </button>
                <h3 className="font-medium text-neutral-800 dark:text-neutral-200 text-base sm:text-sm">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 sm:p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-lg sm:text-base"
                >
                  →
                </button>
              </div>

              {/* Status indicator */}
              <div className="mb-3 text-xs text-neutral-600 dark:text-neutral-400 text-center">
                {selectingStart ? 'Select start date' : 'Select end date'}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-xs font-medium text-center p-1 sm:p-2 text-neutral-600 dark:text-neutral-400">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date && (
                      <button
                        onClick={() => handleDateClick(date)}
                        className={`w-full h-full text-xs rounded flex items-center justify-center transition-colors touch-manipulation ${
                          isDateSelected(date)
                            ? 'bg-blue-500 text-white'
                            : isDateInRange(date)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0">
                <button
                  onClick={handleClear}
                  className="text-xs px-3 py-2 sm:py-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 rounded sm:bg-transparent sm:dark:bg-transparent"
                >
                  Clear
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 sm:py-1 text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  >
                    <FaTimes className="text-xs" />
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 sm:py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FaCheck className="text-xs" />
                    Apply
                  </button>
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
