import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MatchesChartProps {
  expanded?: boolean;
}

const MatchesChart: React.FC<MatchesChartProps> = ({ expanded = false }) => {
  const operationData = [
    { cycle: 'C01', ops: 32, success: 18, failure: 14 },
    { cycle: 'C02', ops: 28, success: 16, failure: 12 },
    { cycle: 'C03', ops: 35, success: 22, failure: 13 },
    { cycle: 'C04', ops: 30, success: 19, failure: 11 },
    { cycle: 'C05', ops: 42, success: 25, failure: 17 },
    { cycle: 'C06', ops: 38, success: 23, failure: 15 },
  ];

  // Custom tooltip with cyber styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--obsidian)',
          border: '2px solid var(--electric-cyan)',
          borderRadius: '8px',
          padding: '12px',
          color: 'var(--ghost-white)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          boxShadow: 'var(--cyber-glow)'
        }}>
          <p style={{ margin: 0, color: 'var(--electric-cyan)', fontWeight: 700 }}>
            CYCLE: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, fontWeight: 600 }}>
              {entry.dataKey.toUpperCase()}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="matches-chart-container">
      <div className="chart-header">
        <h3>Combat Analytics</h3>
      </div>
      <div className="chart-content" style={{ height: expanded ? '400px' : '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={operationData} barGap={4}>
            <CartesianGrid 
              strokeDasharray="2 2" 
              stroke="var(--steel)" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="cycle" 
              tick={{ fill: 'var(--ghost-white)', fontFamily: 'var(--font-display)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--electric-cyan)' }}
            />
            <YAxis 
              tick={{ fill: 'var(--ghost-white)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--electric-cyan)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="success" 
              fill="var(--victory-green)" 
              name="SUCCESS" 
              radius={[2, 2, 0, 0]}
              stroke="var(--victory-green)"
              strokeWidth={1}
            />
            <Bar 
              dataKey="failure" 
              fill="var(--warning-red)" 
              name="FAILURE" 
              radius={[2, 2, 0, 0]}
              stroke="var(--warning-red)"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {expanded && (
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">TOTAL OPS:</span>
            <span className="stat-value" style={{ color: 'var(--electric-cyan)' }}>205</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">SUCCESS RATE:</span>
            <span className="stat-value" style={{ color: 'var(--victory-green)' }}>60%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">AVG/CYCLE:</span>
            <span className="stat-value" style={{ color: 'var(--nuclear-orange)' }}>34</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchesChart;