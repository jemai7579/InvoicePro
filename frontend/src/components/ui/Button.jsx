import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false, 
  icon: Icon,
  loading = false,
  ...props 
}) => {
  const busy = isLoading || loading;
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-premium-100';
  
  const variants = {
    primary: 'bg-premium-600 text-white shadow-lg shadow-premium-100 hover:bg-premium-700 hover:shadow-premium-200',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200/50',
    outline: 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-premium-200 hover:text-premium-700',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    danger: 'bg-rose-500 text-white shadow-lg shadow-rose-100 hover:bg-rose-600',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-3',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={busy}
      {...props}
    >
      {busy ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
      {children}
    </button>
  );
};

export default Button;

