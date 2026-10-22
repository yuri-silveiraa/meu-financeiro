import React from 'react';
import Skeleton from './Skeleton';

export default function StatCardSkeleton({ count = 4, className = 'stats-grid' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={className}>
      {items.map((key) => (
        <div key={key} className="stat-card stat-card-skeleton">
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Skeleton width="100px" height="14px" borderRadius="4px" />
            <Skeleton width="26px" height="26px" circle />
          </div>
          <div className="stat-value">
            <Skeleton width="130px" height="28px" borderRadius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}
