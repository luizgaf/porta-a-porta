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
    // Perfis com herança: todo usuário compra; vendedor e síndico também vendem; só o síndico modera
    isComprador: hasRole('COMPRADOR'),
    isVendedor: hasRole('VENDEDOR'),
    isSindico: hasRole('SINDICO'),
  };
};