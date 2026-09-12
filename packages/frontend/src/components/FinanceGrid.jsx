import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_OVERLAY = '<span class="finance-grid-overlay">Nenhum registro encontrado</span>';

function readGridState(storageKey) {
  if (!storageKey) return null;

  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeGridState(storageKey, api) {
  if (!storageKey || !api) return;

  try {
    const state = {
      columns: api.getColumnState(),
      filters: api.getFilterModel()
    };
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // localStorage can be unavailable in constrained environments.
  }
}

export const baseGridColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  minWidth: 104,
  suppressHeaderMenuButton: false
};

function FinanceGrid({
  storageKey,
  rowData,
  columnDefs,
  loading = false,
  quickFilterText = '',
  height = 460,
  defaultColDef,
  onApiReady,
  overlayNoRowsTemplate = DEFAULT_OVERLAY,
  rowSelection,
  getRowId,
  selectionActions
}) {
  const gridApiRef = useRef(null);
  const [visibleRows, setVisibleRows] = useState(rowData?.length || 0);
  const [selectedRows, setSelectedRows] = useState([]);

  const mergedDefaultColDef = useMemo(() => ({
    ...baseGridColDef,
    ...defaultColDef
  }), [defaultColDef]);

  const persistState = useCallback(() => {
    writeGridState(storageKey, gridApiRef.current);
  }, [storageKey]);

  const updateVisibleRows = useCallback(() => {
    if (!gridApiRef.current) return;
    setVisibleRows(gridApiRef.current.getDisplayedRowCount());
  }, []);

  const updateSelectedRows = useCallback(() => {
    if (!gridApiRef.current) return;
    setSelectedRows(gridApiRef.current.getSelectedRows());
  }, []);

  const handleGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
    const savedState = readGridState(storageKey);

    if (savedState?.columns) {
      params.api.applyColumnState({ state: savedState.columns, applyOrder: true });
    }

    if (savedState?.filters) {
      params.api.setFilterModel(savedState.filters);
    }

    updateVisibleRows();
    onApiReady?.(params.api);
  }, [onApiReady, storageKey, updateVisibleRows]);

  const resetLayout = useCallback(() => {
    if (!gridApiRef.current) return;
    gridApiRef.current.resetColumnState();
    gridApiRef.current.setFilterModel(null);
    if (storageKey) {
      window.localStorage.removeItem(storageKey);
    }
    updateVisibleRows();
  }, [storageKey, updateVisibleRows]);

  const exportCsv = useCallback(() => {
    gridApiRef.current?.exportDataAsCsv();
  }, []);

  const clearSelection = useCallback(() => {
    gridApiRef.current?.deselectAll();
    setSelectedRows([]);
  }, []);

  useEffect(() => {
    if (!gridApiRef.current) return;

    if (loading) {
      gridApiRef.current.showLoadingOverlay();
      return;
    }

    if (!rowData?.length) {
      gridApiRef.current.showNoRowsOverlay();
      return;
    }

    gridApiRef.current.hideOverlay();
    updateVisibleRows();
    updateSelectedRows();
  }, [loading, rowData, updateSelectedRows, updateVisibleRows]);

  return (
    <div className="finance-grid-shell">
      <div className="finance-grid-meta">
        <span>{visibleRows} de {rowData.length} registros</span>
        <div className="finance-grid-actions">
          <button type="button" className="btn-ghost" onClick={resetLayout}>Resetar layout</button>
          <button type="button" className="btn-ghost" onClick={exportCsv}>Exportar CSV</button>
        </div>
      </div>

      <div className="finance-grid-hint">
        Dica: arraste os headers para reordenar · redimensione pelas bordas · use o menu <strong>⋮</strong> para mostrar/esconder colunas
      </div>

      {selectionActions && selectedRows.length > 0 && (
        <div className="selection-bar">
          <span>{selectedRows.length} selecionado{selectedRows.length > 1 ? 's' : ''}</span>
          <div className="selection-actions">
            {selectionActions?.(selectedRows, clearSelection)}
            <button type="button" className="btn-ghost" onClick={clearSelection}>Limpar seleção</button>
          </div>
        </div>
      )}

      <div className="ag-theme-quartz finance-grid" style={{ height }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={mergedDefaultColDef}
          quickFilterText={quickFilterText}
          rowSelection={rowSelection}
          getRowId={getRowId}
          animateRows
          suppressCellFocus
          overlayNoRowsTemplate={overlayNoRowsTemplate}
          onGridReady={handleGridReady}
          onColumnMoved={persistState}
          onColumnPinned={persistState}
          onColumnResized={persistState}
          onColumnVisible={persistState}
          onFilterChanged={() => {
            persistState();
            updateVisibleRows();
          }}
          onSortChanged={persistState}
          onModelUpdated={updateVisibleRows}
          onSelectionChanged={updateSelectedRows}
        />
      </div>
    </div>
  );
}

export default FinanceGrid;
