import { useAuthStore } from '../store';

export const useAuth = () => {
  const { usuario, token, isAuthenticated, isLoading, setAuth, clearAuth, setLoading, updateUsuario, hasRole } =
    useAuthStore();

  return {
    usuario,
    token,
    isAuthenticated,
    isLoading,
    login: setAuth,
    logout: clearAuth,
    setLoading,
    updateUsuario,
    hasRole,
    isVendedor: hasRole('VENDEDOR', 'SINDICO'),
    isSindico: hasRole('SINDICO'),
    isComprador: hasRole('COMPRADOR'),
  };
};