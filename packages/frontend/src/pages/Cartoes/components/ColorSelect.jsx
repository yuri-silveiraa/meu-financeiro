import React from 'react';
import { PRESET_CORES } from '../constants';

export default function ColorSelect({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      {PRESET_CORES.map((cor) => {
        const isSelected = value === cor;
        return (
          <button
            key={cor}
            type="button"
            onClick={() => onChange?.(cor)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: cor,
              cursor: 'pointer',
              border: isSelected ? '3px solid #111827' : '2px solid transparent',
              boxShadow: isSelected ? '0 0 0 2px #fff inset, 0 2px 6px rgba(0,0,0,0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
          >
            {isSelected && '✓'}
          </button>
        );
      })}
    </div>
  );
}
