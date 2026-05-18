import React from 'react';

const Input = ({ 
  label, 
  error, 
  icon: Icon, 
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
        {Icon && (
          <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-premium-600 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`
            w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900
            transition-all outline-none 
            focus:bg-white focus:border-premium-500 focus:ring-4 focus:ring-premium-500/10
            group-hover:border-slate-300
            placeholder:text-slate-400 font-semibold caret-premium-600
            disabled:bg-slate-100 disabled:text-slate-500
            [appearance:textfield]
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:appearance-none
            ${Icon ? 'ps-11' : ''}
            ${error ? 'border-red-500 bg-red-50/30' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-600 ps-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;

