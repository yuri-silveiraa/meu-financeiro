import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { BANDEIRAS, PRESET_CORES } from '../constants';
import ColorSelect from '../components/ColorSelect';
import { useCartoes } from '../CartoesContext';

describe('Cartoes Constants & Components', () => {
  it('should define expected credit card flags and colors', () => {
    expect(BANDEIRAS.length).toBeGreaterThanOrEqual(8);
    expect(BANDEIRAS.some((b) => b.value === 'mastercard')).toBe(true);
    expect(BANDEIRAS.some((b) => b.value === 'visa')).toBe(true);
    expect(PRESET_CORES).toContain('#6366f1');
    expect(PRESET_CORES).toContain('#820ad1');
  });

  it('useCartoes should throw an error when used outside CartoesProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Consumer() {
      useCartoes();
      return null;
    }

    expect(() => {
      const container = document.createElement('div');
      const root = createRoot(container);
      act(() => {
        root.render(<Consumer />);
      });
    }).toThrow('useCartoes deve ser usado dentro de um CartoesProvider');
    spy.mockRestore();
  });


  it('ColorSelect renders preset buttons and calls onChange', () => {
    const handleChange = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<ColorSelect value="#6366f1" onChange={handleChange} />);
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(PRESET_CORES.length);

    // Selected button shows checkmark
    const selectedButton = Array.from(buttons).find((btn) => btn.textContent.includes('✓'));
    expect(selectedButton).toBeDefined();

    // Clicking another button triggers onChange
    act(() => {
      buttons[1].click();
    });

    expect(handleChange).toHaveBeenCalledWith(PRESET_CORES[1]);
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

