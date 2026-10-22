import React from 'react';
import Skeleton from './Skeleton';

export default function GastoFixoCardSkeleton({ count = 3 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((key) => (
        <div key={key} className="tx-card tx-card-skeleton">
          <div className="tx-card-left">
            <Skeleton width="4px" height="38px" borderRadius="3px" style={{ marginRight: 6 }} />
            <div className="tx-info" style={{ gap: 6 }}>
              <Skeleton width={`${45 + (key % 3) * 15}%`} height="15px" borderRadius="4px" />
              <div className="tx-subinfo" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Skeleton width="80px" height="18px" borderRadius="12px" />
                <Skeleton width="95px" height="18px" borderRadius="12px" />
                <Skeleton width="65px" height="14px" borderRadius="4px" />
              </div>
            </div>
          </div>

          <div className="tx-card-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Skeleton width="80px" height="20px" borderRadius="4px" />
            <Skeleton width="32px" height="32px" borderRadius="8px" />
            <Skeleton width="32px" height="32px" borderRadius="8px" />
          </div>
        </div>
      ))}
    </>
  );
}
