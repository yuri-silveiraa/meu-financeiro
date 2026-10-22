import React from 'react';
import Skeleton from './Skeleton';

export default function AppSkeleton() {
  return (
    <div className="app-skeleton-container">
      {/* Sidebar Placeholder */}
      <aside className="app-skeleton-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Skeleton width="32px" height="32px" borderRadius="8px" />
          <Skeleton width="130px" height="20px" borderRadius="4px" />
        </div>
        <Skeleton width="100%" height="38px" borderRadius="8px" />
        <Skeleton width="100%" height="38px" borderRadius="8px" />
        <Skeleton width="100%" height="38px" borderRadius="8px" />
        <Skeleton width="100%" height="38px" borderRadius="8px" />
        <Skeleton width="100%" height="38px" borderRadius="8px" />
      </aside>

      {/* Main Content Area */}
      <div className="app-skeleton-main">
        {/* Header */}
        <header className="app-skeleton-header">
          <Skeleton width="140px" height="24px" borderRadius="4px" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Skeleton width="32px" height="32px" circle />
            <Skeleton width="110px" height="24px" borderRadius="6px" />
          </div>
        </header>

        {/* Content */}
        <main className="app-skeleton-content">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Skeleton width="140px" height="42px" borderRadius="12px" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <Skeleton width="100%" height="96px" borderRadius="14px" />
            <Skeleton width="100%" height="96px" borderRadius="14px" />
            <Skeleton width="100%" height="96px" borderRadius="14px" />
            <Skeleton width="100%" height="96px" borderRadius="14px" />
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <Skeleton width="220px" height="38px" borderRadius="8px" />
              <Skeleton width="100px" height="38px" borderRadius="8px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="100%" height="60px" borderRadius="12px" />
              <Skeleton width="100%" height="60px" borderRadius="12px" />
              <Skeleton width="100%" height="60px" borderRadius="12px" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
