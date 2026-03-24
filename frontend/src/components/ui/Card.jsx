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
    <div className={`rounded-3xl border transition-all duration-300 ${variants[variant]} ${className}`}>
      {(title || Icon || action) && (
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-premium-50 rounded-xl text-premium-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-bold text-slate-900 font-display">{title}</h3>}
              {subtitle && <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;

