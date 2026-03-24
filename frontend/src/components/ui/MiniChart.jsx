import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const MiniChart = ({ data, color = "#6366f1" }) => {
  // Mock data if none provided
  const chartData = data || [
    { value: 400 }, { value: 300 }, { value: 500 }, 
    { value: 450 }, { value: 600 }, { value: 550 }, 
    { value: 700 }
  ];

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#gradient-${color})`} 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniChart;
