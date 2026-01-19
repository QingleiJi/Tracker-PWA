import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MeasurementEntry } from '../models/Measurement';
import { format } from 'date-fns';

interface Props {
  entries: MeasurementEntry[];
}

const MeasurementChart: React.FC<Props> = ({ entries }) => {
  if (!entries || entries.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No data</div>;

  const data = entries.map(e => ({
      ...e,
      dateStr: format(e.date, 'MMM d'),
      time: e.date.getTime(),
  })).sort((a, b) => a.time - b.time);

  // Check if we have values
  const hasValues = data.some(d => d.value !== undefined);

  if (!hasValues) {
      return <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Timeline view (entries without values) is not yet supported in this chart.</div>
  }

  return (
    <div style={{ width: '100%', height: 300, background: 'white', borderRadius: 16, padding: '16px 0', marginBottom: 16 }}>
       <ResponsiveContainer>
         <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
                dataKey="dateStr" 
                tick={{fontSize: 11, fill: '#8e8e93'}} 
                axisLine={false} 
                tickLine={false} 
                tickMargin={10}
            />
            <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 11, fill: '#8e8e93'}} 
                axisLine={false} 
                tickLine={false} 
                width={35}
            />
            <Tooltip 
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#8e8e93', marginBottom: 4, fontSize: 12 }}
                itemStyle={{ color: 'var(--ion-color-primary)', fontWeight: 600, fontSize: 14 }}
                cursor={{ stroke: 'var(--ion-color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--ion-color-primary)" 
                strokeWidth={3} 
                dot={{ r: 3, fill: 'var(--ion-color-primary)', strokeWidth: 0 }} 
                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }} 
                isAnimationActive={true}
            />
         </LineChart>
       </ResponsiveContainer>
    </div>
  );
};

export default MeasurementChart;
