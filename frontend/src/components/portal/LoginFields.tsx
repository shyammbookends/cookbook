"use client";

import { useState } from "react";

/**
 * Text input that browsers won't autofill: it starts read-only and unlocks on
 * focus, with a throw-away name and autocomplete off, so the ID and password
 * always have to be typed.
 */
const noFill = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "none",
  spellCheck: false,
  "data-lpignore": "true",
  "data-1p-ignore": "true",
} as const;

function SecretInput({ name, value, onChange, disabled, className, placeholder, eyeClass = "text-white/60 hover:text-white", autoFocus, what }: {
  name: string;
  what: string;
  autoFocus?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  eyeClass?: string;
}) {
  const [locked, setLocked] = useState(true);
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...noFill}
        name={name}
        type={show ? "text" : "password"}
        readOnly={locked}
        onFocus={() => setLocked(false)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${className ?? ""} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? `Hide ${what}` : `Show ${what}`}
        title={show ? `Hide ${what}` : `Show ${what}`}
        tabIndex={-1}
        className={`absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${eyeClass}`}
      >
        {show ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4 9.5 7a11.3 11.3 0 0 1-2.4 3.7M6.6 6.6A11.5 11.5 0 0 0 2.5 12c1 3 4.5 7 9.5 7a9.6 9.6 0 0 0 4.1-.9" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12C3.5 9 7 5 12 5s8.5 4 9.5 7c-1 3-4.5 7-9.5 7s-8.5-4-9.5-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

type FieldProps = { value: string; onChange: (v: string) => void; disabled?: boolean; className?: string; placeholder?: string; eyeClass?: string; autoFocus?: boolean };

/** The admin ID: hidden as dots until the eye is pressed. */
export function IdInput({ placeholder = "ID", ...p }: FieldProps) {
  return <SecretInput name="bk-admin-id" what="ID" placeholder={placeholder} {...p} />;
}

export function PasswordInput({ placeholder = "Password", ...p }: FieldProps) {
  return <SecretInput name="bk-admin-key" what="password" placeholder={placeholder} {...p} />;
}
