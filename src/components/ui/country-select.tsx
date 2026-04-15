"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Check } from "lucide-react";

const countryOptions = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala",
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "Perú", "República Dominicana", "Uruguay", "Venezuela", "Otros",
];

interface CountrySelectProps {
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  label,
  error,
  placeholder = "Seleccioná tu país",
  className = "",
  required = false,
  id,
  disabled = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = searchQuery
    ? countryOptions.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
    : countryOptions;

  const handleSelect = (country: string) => {
    onChange(country);
    setIsOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const inputId = id || "country-select";
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block font-mono text-xs uppercase tracking-widest text-white/40">
          {label}
          {required && <span className="ml-1 text-csc-orange">*</span>}
        </label>
      )}

      <button
        type="button"
        id={inputId}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="country-listbox"
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 font-mono text-sm transition-all focus:outline-none focus:ring-2 focus:ring-csc-orange/20 ${
          isOpen ? "border-csc-orange ring-1 ring-csc-orange/20" : "border-white/8 hover:border-white/16"
        } ${value ? "text-white" : "text-white/30"} ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer glass-input"
        } ${error ? "border-red-500/50 focus:ring-red-500/20" : ""}`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {error && (
        <p className="mt-2 font-mono text-xs text-red-400" role="alert">{error}</p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            id="country-listbox"
            role="listbox"
            aria-label="Países"
            className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/8 bg-[#141211]/95 shadow-2xl"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="border-b border-white/5 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-white/5 py-2 pl-9 pr-3 font-mono text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-csc-orange/30"
                  ref={searchInputRef}
                  aria-label="Buscar país"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    role="option"
                    aria-selected={value === country}
                    onClick={() => handleSelect(country)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 font-mono text-sm transition-all hover:bg-white/5 ${
                      value === country ? "bg-csc-orange/10 text-csc-orange" : "text-white/70"
                    }`}
                  >
                    <span>{country}</span>
                    {value === country && <Check className="h-4 w-4" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 font-mono text-xs text-white/30 text-center">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { countryOptions };
export default CountrySelect;
