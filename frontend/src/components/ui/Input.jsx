import React, { forwardRef } from 'react';

/**
 * Input component with label, icon, and error state.
 *
 * @param {string} id
 * @param {string} label - Field label
 * @param {string} error - Error message string
 * @param {React.ReactNode} leftIcon - Icon to render inside left side of input
 * @param {React.ReactNode} rightIcon - Icon to render inside right side of input
 * @param {string} className - Additional wrapper classes
 * @param {string} inputClassName - Additional classes applied directly to the <input>
 */
const Input = forwardRef(
  (
    {
      id,
      label,
      error,
      leftIcon,
      rightIcon,
      className = '',
      inputClassName = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-slate-100
              placeholder:text-slate-500 outline-none transition-all duration-200
              focus:bg-white/8 focus:ring-2
              ${error
                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
                : 'border-white/10 focus:border-indigo-500/60 focus:ring-indigo-500/20'
              }
              ${leftIcon  ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
              ${inputClassName}
            `}
            aria-describedby={error ? `${inputId}-error` : undefined}
            aria-invalid={!!error}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-400 flex items-center gap-1 mt-0.5"
            role="alert"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
