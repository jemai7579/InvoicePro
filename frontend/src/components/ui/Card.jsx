import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon, 
  action, 
  className = '', 
  noPadding = false,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-white border-slate-100 shadow-sm',
    premium: 'bg-white border-premium-100 shadow-md border-t-4 border-t-premium-600',
    subtle: 'bg-slate-50/50 border-slate-200/50',
  };

  return (
    <div className={`min-w-0 rounded-2xl border transition-all duration-300 sm:rounded-3xl ${variants[variant]} ${className}`}>
      {(title || Icon || action) && (
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-50 px-4 py-4 sm:items-center sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className="p-2 bg-premium-50 rounded-xl text-premium-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-bold text-slate-900 font-display">{title}</h3>}
              {subtitle && <p className="text-[11px] leading-5 text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;

