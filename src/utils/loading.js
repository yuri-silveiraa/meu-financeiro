export const withLoading = async (asyncFunction, setLoading, setError) => {
  try {
    setLoading(true);
    setError(null);
    const result = await asyncFunction();
    return result;
  } catch (error) {
    setError(error.message || 'Erro desconhecido');
    console.error(error);
    return null;
  } finally {
    setLoading(false);
  }
};

export const createLoadingState = () => ({
  loading: false,
  error: null
});