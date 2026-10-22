import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect } from 'vitest';
import {
  Skeleton,
  TransactionCardSkeleton,
  StatCardSkeleton,
  GastoFixoCardSkeleton,
  CartaoCardSkeleton,
  DashboardSkeleton,
  AppSkeleton,
} from '../index';

describe('Skeleton System', () => {
  it('renders base Skeleton with custom dimensions', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<Skeleton width="200px" height="30px" circle={false} />);
    });

    const el = container.querySelector('.skeleton-shimmer');
    expect(el).not.toBeNull();
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('30px');
  });

  it('renders base Skeleton as circle', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<Skeleton height="40px" circle />);
    });

    const el = container.querySelector('.skeleton-shimmer');
    expect(el).not.toBeNull();
    expect(el.style.width).toBe('40px');
    expect(el.style.borderRadius).toBe('50%');
  });

  it('renders TransactionCardSkeleton with specified count', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<TransactionCardSkeleton count={3} />);
    });

    const items = container.querySelectorAll('.tx-card-skeleton');
    expect(items.length).toBe(3);
  });

  it('renders StatCardSkeleton with specified count', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<StatCardSkeleton count={4} />);
    });

    const items = container.querySelectorAll('.stat-card-skeleton');
    expect(items.length).toBe(4);
  });

  it('renders GastoFixoCardSkeleton with specified count', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<GastoFixoCardSkeleton count={2} />);
    });

    const items = container.querySelectorAll('.tx-card-skeleton');
    expect(items.length).toBe(2);
  });

  it('renders CartaoCardSkeleton', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(<CartaoCardSkeleton count={2} />);
    });

    const items = container.querySelectorAll('.credit-card-skeleton');
    expect(items.length).toBe(2);
  });

  it('renders DashboardSkeleton and AppSkeleton without errors', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <div>
          <DashboardSkeleton />
          <AppSkeleton />
        </div>
      );
    });

    expect(container.querySelector('.dashboard-skeleton')).not.toBeNull();
    expect(container.querySelector('.app-skeleton-container')).not.toBeNull();
  });
});
