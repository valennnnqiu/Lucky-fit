"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoCitySuggestion } from "@/lib/types";
import { fetchCitySuggestions, formatCityLabel, formatCityQuery } from "@/lib/geo";
import { wireInputClass } from "@/components/wire-frame";

type Props = {
  id?: string;
  value: string;
  onChange: (weatherCity: string) => void;
  placeholder?: string;
  inputClassName?: string;
  listClassName?: string;
  itemClassName?: string;
  /** Accessible name for the combobox (input + list) */
  ariaLabel?: string;
  ariaInvalid?: boolean;
};

export function CityCombobox({
  id,
  value,
  onChange,
  placeholder,
  inputClassName,
  listClassName,
  itemClassName,
  ariaLabel,
  ariaInvalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<GeoCitySuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDoc);
    return () => document.removeEventListener("mousedown", handleDoc);
  }, []);

  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (trimmed.length < 1) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      setHits([]);
      fetchCitySuggestions(trimmed)
        .then(setHits)
        .finally(() => setLoading(false));
    }, 280);
  }, []);

  function handleInput(v: string) {
    onChange(v);
    setOpen(true);
    runSearch(v);
  }

  function pick(c: GeoCitySuggestion) {
    onChange(formatCityQuery(c));
    setOpen(false);
    setHits([]);
  }

  const inputCn = inputClassName ?? wireInputClass;
  const listCn =
    listClassName ??
    "absolute left-0 right-0 top-[calc(100%+2px)] z-20 max-h-56 overflow-auto border-2 border-neutral-900 bg-white py-0 text-left text-sm";
  const itemCn =
    itemClassName ??
    "flex h-9 w-full items-center px-2 text-left font-mono text-xs leading-none text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200";

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel ?? "City search"}
        aria-invalid={ariaInvalid ?? false}
        aria-autocomplete="list"
        aria-expanded={open && value.trim().length >= 1}
        aria-controls={open && value.trim().length >= 1 ? `${id ?? "city"}-listbox` : undefined}
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          setOpen(true);
          if (value.trim()) runSearch(value);
        }}
        placeholder={placeholder}
        className={inputCn}
      />
      {open && value.trim().length >= 1 && (
        <ul id={`${id ?? "city"}-listbox`} className={listCn} role="listbox">
          {loading && (
            <li className="flex h-9 items-center px-2 font-mono text-[10px] text-neutral-600">
              Searching…
            </li>
          )}
          {!loading &&
            hits.map((c, i) => (
              <li key={`${c.name}-${c.country}-${c.lat}-${i}`}>
                <button
                  type="button"
                  role="option"
                  className={itemCn}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                >
                  {formatCityLabel(c)}
                </button>
              </li>
            ))}
          {!loading && hits.length === 0 && (
            <li className="flex h-9 items-center px-2 font-mono text-[10px] text-neutral-600">
              No matches
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
