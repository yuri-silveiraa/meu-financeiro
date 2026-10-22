import React from 'react';
import Skeleton from './Skeleton';
import StatCardSkeleton from './StatCardSkeleton';

export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {/* Month Nav placeholder */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <Skeleton width="180px" height="38px" borderRadius="20px" />
      </div>

      {/* 4 Stat Cards */}
      <StatCardSkeleton count={4} />

      {/* Projeção de Faturas Chart Placeholder */}
      <div className="card" style={{ marginTop: 24, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <Skeleton width="220px" height="22px" borderRadius="4px" />
          <Skeleton width="140px" height="28px" borderRadius="6px" />
        </div>
        <Skeleton width="100%" height="240px" borderRadius="8px" />
      </div>

      {/* Charts Grid */}
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <Skeleton width="160px" height="20px" borderRadius="4px" style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height="200px" borderRadius="8px" />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <Skeleton width="160px" height="20px" borderRadius="4px" style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height="200px" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
}
