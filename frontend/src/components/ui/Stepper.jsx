import React from 'react';
import { Check } from 'lucide-react';

const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="w-full">
      <div className="relative mb-12 flex items-center justify-between sm:mb-8">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          return (
            <div
              key={index}
              className={`group relative z-10 flex min-w-0 flex-1 flex-col items-center ${
                index === 0 ? 'items-start' : index === steps.length - 1 ? 'items-end' : ''
              }`}
            >
              <button
                onClick={() => onStepClick && onStepClick(index)}
                disabled={!onStepClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-indigo-600 border-indigo-100 text-white' 
                    : isActive 
                      ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100 scale-110' 
                      : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-sm font-black">{index + 1}</span>}
              </button>
              <div className={`absolute top-12 max-w-[92px] text-center leading-3 sm:max-w-none sm:whitespace-nowrap ${
                index === 0 ? 'text-start' : index === steps.length - 1 ? 'text-end' : ''
              }`}>
                <span className={`text-[10px] uppercase tracking-widest font-black transition-colors ${
                  isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
