import React, { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaCheck } from 'react-icons/fa';
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
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
        className="bg-[#141414] hover:bg-[#202020] border border-[#262626] rounded-xl text-xs font-medium text-[#aaaaaa] hover:text-[#f1f1f1] flex items-center gap-2 px-3.5 py-2 transition-colors cursor-pointer min-w-0"
      >
        <FaCalendarAlt className="text-xs shrink-0 text-cc-red" />
        <span className="truncate">{getDisplayText()}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-[#181818] border border-[#262626] rounded-2xl shadow-2xl z-50 w-screen sm:w-96 max-w-sm sm:max-w-none -mx-4 sm:mx-0 overflow-hidden text-[#f1f1f1]"
          >
            <div className="p-4 sm:p-5">
              {/* Quick ranges */}
              <div className="mb-4">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-[#717171]">Quick select:</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {getQuickRanges().map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickRange(range.start, range.end)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors text-center cursor-pointer"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#262626]">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 rounded-lg hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors cursor-pointer"
                >
                  ←
                </button>
                <h3 className="font-semibold text-[#f1f1f1] text-xs sm:text-sm">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 rounded-lg hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors cursor-pointer"
                >
                  →
                </button>
              </div>

              {/* Status indicator */}
              <div className="mb-3 text-[11px] text-cc-red font-medium text-center">
                {selectingStart ? 'Select start date' : 'Select end date'}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-[10px] font-semibold text-center py-1 text-[#717171] uppercase">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date && (
                      <button
                        onClick={() => handleDateClick(date)}
                        className={`w-full h-full text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer font-medium ${
                          isDateSelected(date)
                            ? 'bg-cc-red text-white shadow-sm font-bold'
                            : isDateInRange(date)
                            ? 'bg-cc-red/15 text-cc-red'
                            : 'hover:bg-[#222222] text-[#d4d4d4]'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-[#262626] gap-2">
                <button
                  onClick={handleClear}
                  className="text-xs px-2.5 py-1.5 text-[#717171] hover:text-[#aaaaaa] transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-[#141414] hover:bg-[#222222] border border-[#262626] px-3 py-1.5 text-xs rounded-xl text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="bg-cc-red hover:bg-cc-red-hover text-white px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <FaCheck size={10} />
                    <span>Apply</span>
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
