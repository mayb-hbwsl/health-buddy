"use client";

import React, { useId } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

interface HealthChartProps {
  data: DataPoint[];
  color?: string;
  unit?: string;
}

const HealthChart: React.FC<HealthChartProps> = ({ data, color = "#6366f1", unit = "mg/dL" }) => {
  const gradientId = useId(); // Unique ID for each chart's gradient
  
  // Sort data by date ascending for the chart
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format date for X-Axis (e.g., "03/04")
  const chartData = sortedData.map(d => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  if (chartData.length === 0) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
        No trend data available.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="formattedDate" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            formatter={(value: any) => [`${value} ${unit}`, 'Value']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HealthChart;
