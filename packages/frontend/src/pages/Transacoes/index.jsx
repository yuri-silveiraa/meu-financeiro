import React from 'react';
import { TransacoesProvider, useTransacoes } from './TransacoesContext';
import TransacoesToolbar from './components/TransacoesToolbar';
import TransacoesSummary from './components/TransacoesSummary';
import TransacoesFilters from './components/TransacoesFilters';
import TransacoesList from './components/TransacoesList';
import ModalFiltros from './components/ModalFiltros';
import ModalTransacao from './components/ModalTransacao';

function TransacoesContent() {
  const { error } = useTransacoes();

  return (
    <div className="workspace">
      {error && <div className="alert-error">{error}</div>}

      <TransacoesToolbar />
      <TransacoesSummary />

      <div className="workspace-panel">
        <TransacoesFilters />
        <TransacoesList />
      </div>

      <ModalFiltros />
      <ModalTransacao />
    </div>
  );
}

export default function Transacoes() {
  return (
    <TransacoesProvider>
      <TransacoesContent />
    </TransacoesProvider>
  );
}
