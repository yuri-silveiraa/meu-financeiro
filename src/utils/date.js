export const formatDate = (date) => {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (date) => {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const getMonthName = (monthIndex) => {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return months[monthIndex] || '';
};

export const getYearOptions = (startYear = 2020) => {
  const currentYear = new Date().getFullYear();
  const options = [];
  for (let year = startYear; year <= currentYear + 2; year++) {
    options.push(year);
  }
  return options;
};