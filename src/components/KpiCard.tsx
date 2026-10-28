import React from 'react';

interface KpiCardProps {
  label: string;
  value: number | string;
  desc?: string;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  desc,
  variant = 'default',
  onClick
}) => {
  return (
    <div className={`kpi-card ${variant}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
      </div>
      {desc && <div className="kpi-desc">{desc}</div>}
    </div>
  );
};
