const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTransacoes: (filtros) => ipcRenderer.invoke('db:getTransacoes', filtros),
  addTransacao: (transacao) => ipcRenderer.invoke('db:addTransacao', transacao),
  updateTransacao: (transacao) => ipcRenderer.invoke('db:updateTransacao', transacao),
  deleteTransacao: (id) => ipcRenderer.invoke('db:deleteTransacao', id),
  togglePago: (id) => ipcRenderer.invoke('db:togglePago', id),

  getCategorias: () => ipcRenderer.invoke('db:getCategorias'),
  addCategoria: (categoria) => ipcRenderer.invoke('db:addCategoria', categoria),
  updateCategoria: (categoria) => ipcRenderer.invoke('db:updateCategoria', categoria),
  deleteCategoria: (id) => ipcRenderer.invoke('db:deleteCategoria', id),

  getContas: () => ipcRenderer.invoke('db:getContas'),
  addConta: (conta) => ipcRenderer.invoke('db:addConta', conta),

  getMetas: () => ipcRenderer.invoke('db:getMetas'),
  addMeta: (meta) => ipcRenderer.invoke('db:addMeta', meta),
  updateMeta: (meta) => ipcRenderer.invoke('db:updateMeta', meta),

  getGastosFixos: () => ipcRenderer.invoke('db:getGastosFixos'),
  addGastoFixo: (gastoFixo) => ipcRenderer.invoke('db:addGastoFixo', gastoFixo),
  updateGastoFixo: (gastoFixo) => ipcRenderer.invoke('db:updateGastoFixo', gastoFixo),
  deleteGastoFixo: (id) => ipcRenderer.invoke('db:deleteGastoFixo', id),

  getEstatisticas: (mes, ano) => ipcRenderer.invoke('db:getEstatisticas', mes, ano),
  getPrevisoes: () => ipcRenderer.invoke('db:getPrevisoes'),

  openFile: (tipo) => ipcRenderer.invoke('dialog:openFile', tipo),
  readPDF: (filePath) => ipcRenderer.invoke('file:readPDF', filePath)
});
