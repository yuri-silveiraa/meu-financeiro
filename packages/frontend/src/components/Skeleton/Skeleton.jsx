import React from 'react';

/**
 * Base shimmer Skeleton component.
 */
export default function Skeleton({
  width = '100%',
  height = '16px',
  circle = false,
  borderRadius = circle ? '50%' : '6px',
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: circle ? height : width,
        height,
        borderRadius: circle ? '50%' : borderRadius,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    />
  );
}
