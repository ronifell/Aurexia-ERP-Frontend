'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface DailyProductionChartProps {
  data: any[];
}

const DailyProductionChart: React.FC<DailyProductionChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="30%" barGap={50}>
        <defs>
          <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" stopOpacity={1} />
            <stop offset="20%" stopColor="#4ade80" stopOpacity={1} />
            <stop offset="40%" stopColor="#22c55e" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#16a34a" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#15803d" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#14532d" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="scrapGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
            <stop offset="20%" stopColor="#f87171" stopOpacity={1} />
            <stop offset="40%" stopColor="#ef4444" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#dc2626" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#b91c1c" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#991b1b" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#999" tick={{ fontSize: 11 }} />
        <YAxis stroke="#999" tick={{ fontSize: 11 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37', fontSize: '12px' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar 
          dataKey="good" 
          fill="url(#goodGradient)" 
          name="Good" 
          fillOpacity={0.9}
          stroke="#22c55e"
          strokeWidth={2}
          barSize={105}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#goodGradient)', fillOpacity: 1, stroke: '#86efac', strokeWidth: 3 }} 
        >
          <LabelList 
            dataKey="good" 
            position="top" 
            fill="#86efac"
            fontSize={11}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
        <Bar 
          dataKey="scrap" 
          fill="url(#scrapGradient)" 
          name="Scrap" 
          fillOpacity={0.9}
          stroke="#ef4444"
          strokeWidth={2}
          barSize={105}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#scrapGradient)', fillOpacity: 1, stroke: '#fca5a5', strokeWidth: 3 }} 
        >
          <LabelList 
            dataKey="scrap" 
            position="top" 
            fill="#fca5a5"
            fontSize={11}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyProductionChart;
