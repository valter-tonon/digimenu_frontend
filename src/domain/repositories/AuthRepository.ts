export interface AuthRepository {
  login(credentials: { email: string, password: string, device_name: string }): Promise<{ token: string }>;
  getMe(): Promise<any>;
  logout(): Promise<void>;
  isAuthenticated(): boolean;
} 