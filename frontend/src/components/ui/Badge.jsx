import React from 'react';

const Badge = ({ 
  children, 
  variant = 'pending', 
  className = '', 
  size = 'md',
  icon: Icon
}) => {
  const variants = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200/40',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/40',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200/40',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200/40',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200/40',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-tight',
    md: 'px-3 py-1 text-[11px] tracking-tight',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}>
      {Icon && <Icon className="w-3 h-3 opacity-80" />}
      {children}
    </span>
  );
};

export default Badge;

