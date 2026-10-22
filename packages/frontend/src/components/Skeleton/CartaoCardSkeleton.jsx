import React from 'react';
import Skeleton from './Skeleton';

export default function CartaoCardSkeleton({ count = 2 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}
    >
      {items.map((key) => (
        <div key={key} className="credit-card-skeleton">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Skeleton width="34px" height="24px" borderRadius="4px" />
              <Skeleton width="18px" height="18px" circle />
            </div>
            <Skeleton width="60px" height="20px" borderRadius="10px" />
          </div>

          <div style={{ margin: '20px 0' }}>
            <Skeleton width="120px" height="18px" borderRadius="4px" style={{ marginBottom: 12 }} />
            <Skeleton width="160px" height="24px" borderRadius="6px" style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height="8px" borderRadius="4px" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="70px" height="14px" borderRadius="4px" />
            <div style={{ display: 'flex', gap: 6 }}>
              <Skeleton width="28px" height="28px" borderRadius="6px" />
              <Skeleton width="28px" height="28px" borderRadius="6px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
