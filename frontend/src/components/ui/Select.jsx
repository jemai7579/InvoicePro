import React from 'react';

const Select = ({ 
  label, 
  error, 
  options = [], 
  className = '', 
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ps-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={`
            w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm 
            transition-all outline-none 
            focus:bg-white focus:border-premium-500 focus:ring-4 focus:ring-premium-500/10 
            group-hover:border-slate-300
            appearance-none cursor-pointer font-medium text-slate-700
            ${error ? 'border-red-500 bg-red-50/30' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 end-0 pe-4 flex items-center pointer-events-none text-slate-400">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-600 ps-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
