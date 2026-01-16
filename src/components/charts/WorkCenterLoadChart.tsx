'use client';

import React from 'react';
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

interface WorkCenterLoadChartProps {
  data: any[];
}

const WorkCenterLoadChart: React.FC<WorkCenterLoadChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <defs>
          <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" stopOpacity={1} />
            <stop offset="20%" stopColor="#facc15" stopOpacity={1} />
            <stop offset="40%" stopColor="#eab308" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#ca8a04" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#a16207" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#854d0e" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="inProgressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity={1} />
            <stop offset="20%" stopColor="#60a5fa" stopOpacity={1} />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#2563eb" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#1d4ed8" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#1e40af" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86efac" stopOpacity={1} />
            <stop offset="20%" stopColor="#4ade80" stopOpacity={1} />
            <stop offset="40%" stopColor="#22c55e" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#16a34a" stopOpacity={0.8} />
            <stop offset="80%" stopColor="#15803d" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#14532d" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="work_center_name" stroke="#999" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
        <YAxis stroke="#999" tick={{ fontSize: 11 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #D4AF37', fontSize: '12px' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar 
          dataKey="pending" 
          fill="url(#pendingGradient)" 
          name="Pending" 
          fillOpacity={0.9}
          stroke="#eab308"
          strokeWidth={2}
          barSize={40}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#pendingGradient)', fillOpacity: 1, stroke: '#fde047', strokeWidth: 3 }} 
        >
          <LabelList 
            dataKey="pending" 
            position="top" 
            fill="#fde047"
            fontSize={10}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
        <Bar 
          dataKey="in_progress" 
          fill="url(#inProgressGradient)" 
          name="In Progress" 
          fillOpacity={0.9}
          stroke="#3b82f6"
          strokeWidth={2}
          barSize={40}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#inProgressGradient)', fillOpacity: 1, stroke: '#93c5fd', strokeWidth: 3 }} 
        >
          <LabelList 
            dataKey="in_progress" 
            position="top" 
            fill="#93c5fd"
            fontSize={10}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
        <Bar 
          dataKey="completed" 
          fill="url(#completedGradient)" 
          name="Completed" 
          fillOpacity={0.9}
          stroke="#22c55e"
          strokeWidth={2}
          barSize={40}
          radius={[6, 6, 0, 0]}
          activeBar={{ fill: 'url(#completedGradient)', fillOpacity: 1, stroke: '#86efac', strokeWidth: 3 }} 
        >
          <LabelList 
            dataKey="completed" 
            position="top" 
            fill="#86efac"
            fontSize={11}
            fontWeight="bold"
            formatter={(value: number) => value > 0 ? value : ''}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WorkCenterLoadChart;
