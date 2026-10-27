import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import { Alert } from 'react-native';
import { ApiError } from '../types';
import { useAuthStore } from '../store/authStore';

const TOKEN_KEY = 'token_ki_jwt';
const USER_KEY = 'token_ki_user';
const CONDOMINIO_ID_KEY = 'token_ki_condominioId';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adiciona token JWT
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor - trata erros
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Suspenso ou banido pelo síndico: encerra a sessão e mostra o motivo
        const codigo = error.response?.data?.code;
        if (error.response?.status === 403 && (codigo === 'USUARIO_SUSPENSO' || codigo === 'USUARIO_BANIDO')) {
          await this.clearAuth();
          useAuthStore.getState().clearAuth();
          Alert.alert(codigo === 'USUARIO_BANIDO' ? 'Acesso bloqueado' : 'Acesso suspenso', error.response?.data?.error || '');
        }

        // Se erro 401 e não tentou renovar token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Token expirado - limpar storage e redirecionar para login
          await this.clearAuth();
          // O redirecionamento será feito pelo AuthContext/Navigation
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError<ApiError>): Error & { code?: string; statusCode: number } {
    const err = new Error(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Erro desconhecido'
    ) as Error & { code?: string; statusCode: number };

    err.code = error.response?.data?.code;
    err.statusCode = error.response?.status || 0;

    return err;
  }

  private async clearAuth() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(CONDOMINIO_ID_KEY);
    await AsyncStorage.removeItem('token_ki_auth');
  }

  // Métodos HTTP
  async get<T>(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string, data?: unknown) {
    const response = await this.client.delete<T>(url, { data });
    return response.data;
  }

  // Envia uma foto escolhida no aparelho como multipart/form-data. O React Native lê o arquivo
  // direto da URI local; não usamos fetch(uri).blob(), que falha em parte dos aparelhos Android.
  // A API aceita JPEG, PNG ou WebP de até 5 MB (RNF05).
  async enviarFoto<T>(caminho: string, uri: string, tipo: string) {
    const extensao = tipo === 'image/png' ? 'png' : tipo === 'image/webp' ? 'webp' : 'jpg';
    const formulario = new FormData();
    formulario.append('foto', { uri, name: `foto.${extensao}`, type: tipo } as unknown as Blob);

    const token = await AsyncStorage.getItem(TOKEN_KEY);
    // Sem Content-Type manual: o fetch monta o cabeçalho com o boundary do multipart
    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formulario,
    });
    const corpo = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      const err = new Error(corpo.error || 'Não foi possível enviar a foto') as Error & { code?: string; statusCode: number };
      err.code = corpo.code;
      err.statusCode = resposta.status;
      throw err;
    }
    return corpo as T;
  }

  async uploadImagemProduto<T>(produtoId: string, uri: string, tipo: string) {
    return this.enviarFoto<T>(`/produtos/${produtoId}/imagem`, uri, tipo);
  }

  // Setar token manualmente (após login)
  async setToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  // Setar usuario completo (após login)
  async setUser(user: any) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Setar condominio_id
  async setCondominioId(condominioId: string) {
    await AsyncStorage.setItem(CONDOMINIO_ID_KEY, condominioId);
  }

  // Remover token (logout)
  async removeToken() {
    await this.clearAuth();
  }

  async getMe() {
    return this.get<{ usuario: any }>('/auth/me');
  }
}

export const api = new ApiClient();