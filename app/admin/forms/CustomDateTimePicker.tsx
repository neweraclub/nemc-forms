'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

interface CustomDateTimePickerProps {
  value: string; // Expected: "YYYY-MM-DDTHH:mm:ss" or ISO string
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
}

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const WEEK_DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const pad2 = (n: number) => String(n).padStart(2, '0');

export function CustomDateTimePicker({
  value,
  onChange,
  label = 'Date et heure de fin (Clôture automatique)',
  helperText = 'Dès que cette date et cette heure précise (hh:mm:ss) sont atteintes, le formulaire se clôture automatiquement.',
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial or fallback date
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const now = new Date();
  const [viewYear, setViewYear] = useState<number>(parsedDate ? parsedDate.getFullYear() : now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedDate ? parsedDate.getMonth() : now.getMonth());

  // Draft state while picker is open
  const [draftDate, setDraftDate] = useState<{
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>(() => {
    const base = parsedDate || new Date(Date.now() + 7 * 24 * 3600 * 1000); // Default to +7 days
    return {
      year: base.getFullYear(),
      month: base.getMonth(),
      day: base.getDate(),
      hours: parsedDate ? parsedDate.getHours() : 23,
      minutes: parsedDate ? parsedDate.getMinutes() : 59,
      seconds: parsedDate ? parsedDate.getSeconds() : 59,
    };
  });

  // Sync draft when value changes externally
  useEffect(() => {
    if (parsedDate) {
      setDraftDate({
        year: parsedDate.getFullYear(),
        month: parsedDate.getMonth(),
        day: parsedDate.getDate(),
        hours: parsedDate.getHours(),
        minutes: parsedDate.getMinutes(),
        seconds: parsedDate.getSeconds(),
      });
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [parsedDate]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeekIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Lun, 6 = Dim

  const isPrevMonthDisabled =
    viewYear < now.getFullYear() ||
    (viewYear === now.getFullYear() && viewMonth <= now.getMonth());

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number) => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetDate = new Date(viewYear, viewMonth, day).getTime();
    if (targetDate < todayStart) return;

    setDraftDate((prev) => ({
      ...prev,
      year: viewYear,
      month: viewMonth,
      day,
    }));
  };

  const applyDateTime = () => {
    let finalHours = draftDate.hours;
    let finalMinutes = draftDate.minutes;
    let finalSeconds = draftDate.seconds;

    const selectedDateTime = new Date(
      draftDate.year,
      draftDate.month,
      draftDate.day,
      finalHours,
      finalMinutes,
      finalSeconds
    );

    // If selected time on today has already elapsed, auto-advance to end of day
    if (selectedDateTime <= new Date()) {
      finalHours = 23;
      finalMinutes = 59;
      finalSeconds = 59;
    }

    const formatted = `${draftDate.year}-${pad2(draftDate.month + 1)}-${pad2(draftDate.day)}T${pad2(
      finalHours
    )}:${pad2(finalMinutes)}:${pad2(finalSeconds)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const clearDateTime = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Quick Presets
  const setPresetDays = (daysFromNow: number, defaultHours = 23, defaultMinutes = 59, defaultSeconds = 59) => {
    const target = new Date(Date.now() + daysFromNow * 24 * 3600 * 1000);
    setDraftDate({
      year: target.getFullYear(),
      month: target.getMonth(),
      day: target.getDate(),
      hours: defaultHours,
      minutes: defaultMinutes,
      seconds: defaultSeconds,
    });
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const setEndOfCurrentMonth = () => {
    const target = new Date(viewYear, viewMonth + 1, 0);
    setDraftDate({
      year: target.getFullYear(),
      month: target.getMonth(),
      day: target.getDate(),
      hours: 23,
      minutes: 59,
      seconds: 59,
    });
  };

  // Pretty Display Label
  const formattedDisplay = useMemo(() => {
    if (!parsedDate) return null;
    try {
      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(parsedDate);
      const dayNum = parsedDate.getDate();
      const monthName = MONTH_NAMES_FR[parsedDate.getMonth()];
      const year = parsedDate.getFullYear();
      const timeStr = `${pad2(parsedDate.getHours())}:${pad2(parsedDate.getMinutes())}:${pad2(
        parsedDate.getSeconds()
      )}`;
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} ${monthName} ${year} à ${timeStr}`;
    } catch {
      return value;
    }
  }, [parsedDate, value]);

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {/* Top Header Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="block text-xs font-bold text-[#18181B] flex items-center gap-2">
          <span>{label}</span>
          {value ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
              Clôture programmée
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
              Illimité (Aucune fin)
            </span>
          )}
        </label>

        {value && (
          <button
            type="button"
            onClick={clearDateTime}
            className="text-xs text-[#DC2626] hover:underline self-start sm:self-auto font-medium"
          >
            Effacer l&apos;échéance (Laisser illimité)
          </button>
        )}
      </div>

      {/* Styled Interactive Trigger Field */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'border-[#3B33FF] ring-2 ring-[#3B33FF]/15 bg-white'
            : value
            ? 'border-[#C7D2FE] bg-[#F5F7FF] hover:border-[#3B33FF]'
            : 'border-[#D4D4D8] bg-white hover:border-[#A1A1AA]'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
              value ? 'bg-[#3B33FF] text-white shadow-xs' : 'bg-[#FAF8F5] text-[#71717A] border border-[#E6DFD5]'
            }`}
          >
            📅
          </div>
          <div className="truncate">
            {formattedDisplay ? (
              <span className="text-xs font-bold text-[#18181B] tracking-tight">{formattedDisplay}</span>
            ) : (
              <span className="text-xs text-[#71717A]">
                Cliquez pour définir une date et heure de clôture (hh:mm:ss)...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {value && (
            <button
              type="button"
              onClick={clearDateTime}
              title="Supprimer la date de fin"
              className="p-1 text-[#A1A1AA] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-md transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <span className={`text-xs text-[#71717A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      <p className="text-[11px] text-[#71717A] leading-relaxed">{helperText}</p>

      {/* Luxury Custom Calendar & Time Picker Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-full sm:w-[410px] bg-white border border-[#E6DFD5] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Presets Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-[#71717A] font-medium shrink-0">Raccourcis :</span>
            <button
              type="button"
              onClick={() => setPresetDays(1)}
              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0E8DB] text-[#18181B] font-semibold border border-[#E6DFD5] transition shrink-0"
            >
              +24h
            </button>
            <button
              type="button"
              onClick={() => setPresetDays(3)}
              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0E8DB] text-[#18181B] font-semibold border border-[#E6DFD5] transition shrink-0"
            >
              +3 jours
            </button>
            <button
              type="button"
              onClick={() => setPresetDays(7)}
              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0E8DB] text-[#18181B] font-semibold border border-[#E6DFD5] transition shrink-0"
            >
              +1 semaine
            </button>
            <button
              type="button"
              onClick={setEndOfCurrentMonth}
              className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0E8DB] text-[#18181B] font-semibold border border-[#E6DFD5] transition shrink-0"
            >
              Fin du mois
            </button>
          </div>

          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD5]">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled}
              className={`p-1.5 rounded-lg transition font-bold ${
                isPrevMonthDisabled
                  ? 'opacity-25 text-[#A1A1AA] cursor-not-allowed'
                  : 'hover:bg-[#FAF8F5] text-[#18181B]'
              }`}
              title={isPrevMonthDisabled ? 'Mois passés inaccessibles' : 'Mois précédent'}
            >
              ◀
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#18181B]">
                {MONTH_NAMES_FR[viewMonth]} {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#18181B] transition font-bold"
              title="Mois suivant"
            >
              ▶
            </button>
          </div>

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#71717A]">
            {WEEK_DAYS_FR.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfWeekIndex }).map((_, i) => (
              <div key={`blank_${i}`} className="h-8" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                draftDate.day === day && draftDate.month === viewMonth && draftDate.year === viewYear;

              const isToday =
                now.getDate() === day && now.getMonth() === viewMonth && now.getFullYear() === viewYear;

              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const dayDate = new Date(viewYear, viewMonth, day).getTime();
              const isPast = dayDate < todayStart;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => !isPast && selectDay(day)}
                  className={`h-8 sm:h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isPast
                      ? 'opacity-20 text-[#A1A1AA] cursor-not-allowed pointer-events-none line-through bg-transparent'
                      : isSelected
                      ? 'brand-gradient-btn text-white font-bold shadow-xs scale-105'
                      : isToday
                      ? 'border border-[#3B33FF] text-[#3B33FF] bg-[#EEF2FF] hover:bg-[#E0E7FF]'
                      : 'text-[#18181B] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Selector Section (HH:MM:SS) */}
          <div className="pt-3 border-t border-[#E6DFD5] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#18181B]">
              <span className="flex items-center gap-1.5">
                <span>⏱️ Heure précise de clôture</span>
                <span className="text-[10px] text-[#71717A] font-normal">(Format 24h &bull; hh:mm:ss)</span>
              </span>

              {/* Quick time shortcut */}
              <button
                type="button"
                onClick={() => setDraftDate((prev) => ({ ...prev, hours: 23, minutes: 59, seconds: 59 }))}
                className="text-[10px] text-[#3B33FF] font-semibold hover:underline"
              >
                23:59:59 (Fin de jour)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Hours */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[#71717A] text-center">Heure (00-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={pad2(draftDate.hours)}
                  onChange={(e) => {
                    const val = Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0));
                    setDraftDate((prev) => ({ ...prev, hours: val }));
                  }}
                  className="w-full h-10 text-center font-mono font-bold text-sm text-[#18181B] bg-[#FAF8F5] border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:bg-white"
                />
              </div>

              {/* Minutes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[#71717A] text-center">Minute (00-59)</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={pad2(draftDate.minutes)}
                  onChange={(e) => {
                    const val = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
                    setDraftDate((prev) => ({ ...prev, minutes: val }));
                  }}
                  className="w-full h-10 text-center font-mono font-bold text-sm text-[#18181B] bg-[#FAF8F5] border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:bg-white"
                />
              </div>

              {/* Seconds */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-[#71717A] text-center">Seconde (00-59)</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={pad2(draftDate.seconds)}
                  onChange={(e) => {
                    const val = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
                    setDraftDate((prev) => ({ ...prev, seconds: val }));
                  }}
                  className="w-full h-10 text-center font-mono font-bold text-sm text-[#18181B] bg-[#FAF8F5] border border-[#D4D4D8] rounded-lg focus:border-[#3B33FF] focus:bg-white"
                />
              </div>
            </div>

            {/* Quick time chips */}
            <div className="flex items-center gap-1.5 pt-1 text-[10px]">
              <span className="text-[#71717A]">Préréglages :</span>
              <button
                type="button"
                onClick={() => setDraftDate((prev) => ({ ...prev, hours: 12, minutes: 0, seconds: 0 }))}
                className="px-2 py-0.5 rounded bg-[#FAF8F5] hover:bg-[#E6DFD5] border border-[#E6DFD5] text-[#18181B] font-medium"
              >
                12:00:00 (Midi)
              </button>
              <button
                type="button"
                onClick={() => setDraftDate((prev) => ({ ...prev, hours: 18, minutes: 0, seconds: 0 }))}
                className="px-2 py-0.5 rounded bg-[#FAF8F5] hover:bg-[#E6DFD5] border border-[#E6DFD5] text-[#18181B] font-medium"
              >
                18:00:00 (Soir)
              </button>
              <button
                type="button"
                onClick={() => setDraftDate((prev) => ({ ...prev, hours: 23, minutes: 59, seconds: 59 }))}
                className="px-2 py-0.5 rounded bg-[#FAF8F5] hover:bg-[#E6DFD5] border border-[#E6DFD5] text-[#18181B] font-medium"
              >
                23:59:59 (Minuit)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearDateTime}
              className="px-3 py-2 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition"
            >
              Illimité / Aucun
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-[#52525B] hover:bg-[#FAF8F5] rounded-lg transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={applyDateTime}
                className="brand-gradient-btn px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs transition hover:brightness-105"
              >
                Appliquer cette échéance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
