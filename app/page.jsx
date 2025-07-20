"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Repeat,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Play,
  CalendarDays,
  Timer,
  RotateCcw,
} from "lucide-react";

// State Management using React Context
const RecurrenceContext = React.createContext();

// Custom hook for date utilities
const useDateUtils = () => {
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const addWeeks = (date, weeks) => {
    return addDays(date, weeks * 7);
  };

  const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const addYears = (date, years) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getDayName = (dayIndex) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayIndex];
  };

  const getOrdinalNum = (n) => {
    return (
      n +
      (n > 0
        ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
        : "")
    );
  };

  return {
    formatDate,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    isSameDay,
    getDayName,
    getOrdinalNum,
  };
};

// Recurrence Logic Hook
const useRecurrenceLogic = (config) => {
  const { addDays, addWeeks, addMonths, addYears, isSameDay } = useDateUtils();

  const shouldIncludeDate = (date, config) => {
    if (config.type === "weekly" && config.selectedDays) {
      return config.selectedDays.includes(date.getDay());
    }

    if (config.type === "monthly" && config.monthlyPattern) {
      if (config.monthlyPattern.type === "dayOfMonth") {
        return date.getDate() === config.monthlyPattern.day;
      } else if (config.monthlyPattern.type === "weekOfMonth") {
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        const dayOfWeek = date.getDay();
        return (
          weekOfMonth === config.monthlyPattern.week &&
          dayOfWeek === config.monthlyPattern.day
        );
      }
    }

    return true;
  };

  const getNextDate = (date, config) => {
    switch (config.type) {
      case "daily":
        return addDays(date, config.interval || 1);
      case "weekly":
        return addDays(date, 1); // Check each day for weekly patterns
      case "monthly":
        if (config.monthlyPattern?.type === "weekOfMonth") {
          return addDays(date, 1); // Check each day for monthly week patterns
        }
        return addMonths(date, config.interval || 1);
      case "yearly":
        return addYears(date, config.interval || 1);
      default:
        return addDays(date, 1);
    }
  };

  const generateRecurringDates = useMemo(() => {
    if (!config.startDate) return [];

    const dates = [];
    let currentDate = new Date(config.startDate);
    const endDate = config.endDate
      ? new Date(config.endDate)
      : addYears(config.startDate, 2);
    const maxDates = 100; // Prevent infinite loops

    while (currentDate <= endDate && dates.length < maxDates) {
      if (shouldIncludeDate(currentDate, config)) {
        dates.push(new Date(currentDate));
      }

      currentDate = getNextDate(currentDate, config);
    }

    return dates;
  }, [config, shouldIncludeDate, getNextDate, addYears]);

  return generateRecurringDates;
};

// Mini Calendar Component
const MiniCalendar = ({ recurringDates, currentDate }) => {
  const [viewDate, setViewDate] = useState(currentDate || new Date());
  const { isSameDay, getDayName } = useDateUtils();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days = [];

    // Previous month's days
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(year, month, -startDay + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Next month's days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const days = getDaysInMonth(viewDate);

  const isRecurringDate = (date) => {
    return recurringDates.some((recurringDate) =>
      isSameDay(date, recurringDate)
    );
  };

  const navigateMonth = (direction) => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          Preview Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 min-w-[120px] text-center">
            {viewDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-gray-500 text-center py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`
              relative h-8 w-8 flex items-center justify-center text-sm rounded-lg transition-all
              ${day.isCurrentMonth ? "text-gray-800" : "text-gray-300"}
              ${
                isRecurringDate(day.date) && day.isCurrentMonth
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                  : "hover:bg-gray-50"
              }
              ${isSameDay(day.date, new Date()) ? "ring-2 ring-blue-400" : ""}
            `}
          >
            {day.date.getDate()}
            {isRecurringDate(day.date) && day.isCurrentMonth && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
          <span>Recurring Dates</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-blue-400 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

// Recurrence Pattern Selector
const RecurrencePatternSelector = ({ config, onChange }) => {
  const { getDayName, getOrdinalNum } = useDateUtils();

  const handlePatternChange = (updates) => {
    onChange({ ...config, ...updates });
  };

  const renderDailyOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Every</label>
        <input
          type="number"
          min="1"
          max="365"
          value={config.interval || 1}
          onChange={(e) =>
            handlePatternChange({ interval: parseInt(e.target.value) || 1 })
          }
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          {(config.interval || 1) === 1 ? "day" : "days"}
        </label>
      </div>
    </div>
  );

  const renderWeeklyOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700">Every</label>
        <input
          type="number"
          min="1"
          max="52"
          value={config.interval || 1}
          onChange={(e) =>
            handlePatternChange({ interval: parseInt(e.target.value) || 1 })
          }
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          {(config.interval || 1) === 1 ? "week" : "weeks"}
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          On these days:
        </label>
        <div className="grid grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              onClick={() => {
                const selectedDays = config.selectedDays || [];
                const newSelectedDays = selectedDays.includes(day)
                  ? selectedDays.filter((d) => d !== day)
                  : [...selectedDays, day];
                handlePatternChange({ selectedDays: newSelectedDays });
              }}
              className={`
                p-3 text-xs font-medium rounded-lg border transition-all
                ${
                  (config.selectedDays || []).includes(day)
                    ? "bg-blue-500 text-white border-blue-500 shadow-md transform scale-105"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                }
              `}
            >
              {getDayName(day).slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonthlyOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium text-gray-700">Every</label>
        <input
          type="number"
          min="1"
          max="12"
          value={config.interval || 1}
          onChange={(e) =>
            handlePatternChange({ interval: parseInt(e.target.value) || 1 })
          }
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          {(config.interval || 1) === 1 ? "month" : "months"}
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="radio"
            id="dayOfMonth"
            name="monthlyPattern"
            checked={
              !config.monthlyPattern ||
              config.monthlyPattern.type === "dayOfMonth"
            }
            onChange={() =>
              handlePatternChange({
                monthlyPattern: {
                  type: "dayOfMonth",
                  day: config.startDate?.getDate() || 1,
                },
              })
            }
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="dayOfMonth" className="text-sm text-gray-700">
            On day {config.startDate?.getDate() || 1} of the month
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="radio"
            id="weekOfMonth"
            name="monthlyPattern"
            checked={config.monthlyPattern?.type === "weekOfMonth"}
            onChange={() => {
              if (config.startDate) {
                const week = Math.ceil(config.startDate.getDate() / 7);
                const day = config.startDate.getDay();
                handlePatternChange({
                  monthlyPattern: { type: "weekOfMonth", week, day },
                });
              }
            }}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="weekOfMonth" className="text-sm text-gray-700">
            {config.startDate && (
              <>
                On the{" "}
                {getOrdinalNum(Math.ceil(config.startDate.getDate() / 7))}{" "}
                {getDayName(config.startDate.getDay())} of the month
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );

  const renderYearlyOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Every</label>
        <input
          type="number"
          min="1"
          max="10"
          value={config.interval || 1}
          onChange={(e) =>
            handlePatternChange({ interval: parseInt(e.target.value) || 1 })
          }
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          {(config.interval || 1) === 1 ? "year" : "years"}
        </label>
      </div>
      {config.startDate && (
        <p className="text-sm text-gray-600">
          On{" "}
          {config.startDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-600" />
        Recurrence Pattern
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { type: "daily", icon: Timer, label: "Daily" },
            { type: "weekly", icon: Calendar, label: "Weekly" },
            { type: "monthly", icon: CalendarDays, label: "Monthly" },
            { type: "yearly", icon: RotateCcw, label: "Yearly" },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => handlePatternChange({ type })}
              className={`
                p-4 rounded-lg border transition-all flex flex-col items-center gap-2
                ${
                  config.type === type
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg transform scale-105"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {config.type === "daily" && renderDailyOptions()}
          {config.type === "weekly" && renderWeeklyOptions()}
          {config.type === "monthly" && renderMonthlyOptions()}
          {config.type === "yearly" && renderYearlyOptions()}
        </div>
      </div>
    </div>
  );
};

// Date Range Selector
const DateRangeSelector = ({ startDate, endDate, onChange }) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Date Range
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={startDate ? startDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              onChange(
                "startDate",
                e.target.value ? new Date(e.target.value) : null
              )
            }
            min={today}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              onChange(
                "endDate",
                e.target.value ? new Date(e.target.value) : null
              )
            }
            min={startDate ? startDate.toISOString().split("T")[0] : today}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
};

// Summary Component
const RecurrenceSummary = ({ config, recurringDates }) => {
  const { formatDate, getDayName, getOrdinalNum } = useDateUtils();

  const getSummaryText = () => {
    if (!config.startDate || !config.type) return "No recurrence configured";

    const startStr = config.startDate.toLocaleDateString();
    const endStr = config.endDate
      ? ` until ${config.endDate.toLocaleDateString()}`
      : "";
    const interval = config.interval || 1;

    switch (config.type) {
      case "daily":
        return `Every ${interval === 1 ? "" : interval + " "}day${
          interval === 1 ? "" : "s"
        } starting ${startStr}${endStr}`;

      case "weekly":
        const days = config.selectedDays || [];
        const dayNames = days.map((d) => getDayName(d)).join(", ");
        return `Every ${interval === 1 ? "" : interval + " "}week${
          interval === 1 ? "" : "s"
        } on ${dayNames || "selected days"} starting ${startStr}${endStr}`;

      case "monthly":
        const pattern = config.monthlyPattern;
        let patternStr = "";
        if (pattern?.type === "dayOfMonth") {
          patternStr = `on day ${pattern.day}`;
        } else if (pattern?.type === "weekOfMonth") {
          patternStr = `on the ${getOrdinalNum(pattern.week)} ${getDayName(
            pattern.day
          )}`;
        }
        return `Every ${interval === 1 ? "" : interval + " "}month${
          interval === 1 ? "" : "s"
        } ${patternStr} starting ${startStr}${endStr}`;

      case "yearly":
        return `Every ${interval === 1 ? "" : interval + " "}year${
          interval === 1 ? "" : "s"
        } starting ${startStr}${endStr}`;

      default:
        return "Invalid recurrence pattern";
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Repeat className="w-5 h-5 text-blue-600" />
        Recurrence Summary
      </h3>

      <div className="space-y-3">
        <p className="text-gray-700 font-medium">{getSummaryText()}</p>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{recurringDates.length} upcoming occurrences</span>
          </div>

          {recurringDates.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Next: {formatDate(recurringDates[0])}</span>
            </div>
          )}
        </div>

        {recurringDates.length > 1 && (
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Next 5 Occurrences:
            </h4>
            <div className="space-y-1">
              {recurringDates.slice(0, 5).map((date, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                  {formatDate(date)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Recurring Date Picker Component
const RecurringDatePicker = () => {
  const [config, setConfig] = useState({
    type: "daily",
    startDate: null,
    endDate: null,
    interval: 1,
    selectedDays: [],
    monthlyPattern: null,
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const recurringDates = useRecurrenceLogic(config);

  const handleConfigChange = (updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleDateRangeChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const resetConfiguration = () => {
    setConfig({
      type: "daily",
      startDate: null,
      endDate: null,
      interval: 1,
      selectedDays: [],
      monthlyPattern: null,
    });
  };

  return (
    <RecurrenceContext.Provider
      value={{ config, recurringDates, handleConfigChange }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <Repeat className="w-8 h-8 text-blue-600" />
              Recurring Date Picker
            </h1>
            <p className="text-gray-600 text-lg">
              Create sophisticated recurring date patterns with ease
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="xl:col-span-2 space-y-6">
              <DateRangeSelector
                startDate={config.startDate}
                endDate={config.endDate}
                onChange={handleDateRangeChange}
              />

              <RecurrencePatternSelector
                config={config}
                onChange={handleConfigChange}
              />

              <RecurrenceSummary
                config={config}
                recurringDates={recurringDates}
              />

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetConfiguration}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {isPreviewOpen ? "Hide" : "Show"} Preview
                </button>
                <button
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105 flex items-center gap-2"
                  onClick={() => {
                    console.log("Configuration:", config);
                    console.log("Generated dates:", recurringDates);
                    alert(
                      `Generated ${recurringDates.length} recurring dates! Check console for details.`
                    );
                  }}
                >
                  <Check className="w-4 h-4" />
                  Apply Configuration
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            {isPreviewOpen && (
              <div className="xl:col-span-1">
                <MiniCalendar
                  recurringDates={recurringDates}
                  currentDate={config.startDate}
                />
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {recurringDates.length}
              </div>
              <div className="text-gray-600">Generated Dates</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {config.type
                  ? config.type.charAt(0).toUpperCase() + config.type.slice(1)
                  : "None"}
              </div>
              <div className="text-gray-600">Recurrence Type</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-gray-100">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {config.interval || 1}
              </div>
              <div className="text-gray-600">Interval</div>
            </div>
          </div>

          {/* Advanced Features Demo */}
          {recurringDates.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                Advanced Features Demo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Export Options
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      📅 Export to Calendar
                    </button>
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      📊 Export to CSV
                    </button>
                    <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      📋 Copy to Clipboard
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">
                    Smart Suggestions
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-green-600 hover:text-green-800 transition-colors">
                      🧠 AI Pattern Recognition
                    </button>
                    <button className="w-full text-left text-sm text-green-600 hover:text-green-800 transition-colors">
                      🔄 Auto-adjust for Holidays
                    </button>
                    <button className="w-full text-left text-sm text-green-600 hover:text-green-800 transition-colors">
                      ⚡ Quick Templates
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">
                    Integration
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-purple-600 hover:text-purple-800 transition-colors">
                      📱 Mobile Notifications
                    </button>
                    <button className="w-full text-left text-sm text-purple-600 hover:text-purple-800 transition-colors">
                      🔗 API Integration
                    </button>
                    <button className="w-full text-left text-sm text-purple-600 hover:text-purple-800 transition-colors">
                      ☁️ Cloud Sync
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">
                    Analytics
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full text-left text-sm text-orange-600 hover:text-orange-800 transition-colors">
                      📈 Usage Statistics
                    </button>
                    <button className="w-full text-left text-sm text-orange-600 hover:text-orange-800 transition-colors">
                      🎯 Pattern Optimization
                    </button>
                    <button className="w-full text-left text-sm text-orange-600 hover:text-orange-800 transition-colors">
                      📊 Efficiency Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Handling and Validation */}
          {config.startDate &&
            config.endDate &&
            config.startDate > config.endDate && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <X className="w-4 h-4" />
                  <span className="font-medium">Invalid Date Range</span>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  End date must be after start date.
                </p>
              </div>
            )}

          {config.type === "weekly" &&
            config.selectedDays &&
            config.selectedDays.length === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">No Days Selected</span>
                </div>
                <p className="text-amber-600 text-sm mt-1">
                  Please select at least one day of the week for weekly
                  recurrence.
                </p>
              </div>
            )}

          {!config.startDate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Start Date Required</span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                Please select a start date to begin creating your recurrence
                pattern.
              </p>
            </div>
          )}
        </div>
      </div>
    </RecurrenceContext.Provider>
  );
};

// Testing Structure Documentation:
//
// Unit Tests would include:
// 1. Date utility functions (addDays, addWeeks, addMonths, addYears, isSameDay)
// 2. Recurrence logic validation for all pattern types
// 3. Calendar date generation accuracy
// 4. Input validation and error handling
//
// Integration Tests would cover:
// 1. Complete component rendering and interaction
// 2. Configuration updates across all sub-components
// 3. Calendar preview synchronization with settings
// 4. Template application and configuration reset
// 5. Cross-browser date handling compatibility
//
// Example test scenarios:
// - Daily recurrence: Generate correct sequence of dates
// - Weekly recurrence: Respect selected days and intervals
// - Monthly patterns: Handle both day-of-month and nth-weekday patterns
// - Edge cases: Month boundaries, leap years, weekend handling

export default RecurringDatePicker;
