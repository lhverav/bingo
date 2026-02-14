// API configuration - update with your actual API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.40:3001';

export interface RegisterData {
  email?: string;
  phone?: string;
  password?: string;
  name: string;
  birthdate: string;
  gender: string;
  acceptsMarketing: boolean;
  sharesDataWithThirdParties: boolean;
  googleId?: string;
  facebookId?: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Check if an email is already registered
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error checking email:', error);
    // In case of error, assume email doesn't exist to allow flow to continue
    return false;
  }
}

/**
 * Check if a phone number is already registered
 */
export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/check-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error checking phone:', error);
    return false;
  }
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Error al registrar' };
    }

    return { success: true, data: result.user };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: 'Error de conexion' };
  }
}

/**
 * Login user with email/password
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Credenciales invalidas' };
    }

    return { success: true, data: result.user };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Error de conexion' };
  }
}

/**
 * Login user with phone/code
 */
export async function loginWithPhone(
  phone: string,
  code: string
): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Codigo invalido' };
    }

    return { success: true, data: result.user };
  } catch (error) {
    console.error('Error logging in with phone:', error);
    return { success: false, error: 'Error de conexion' };
  }
}

/**
 * Login/register with OAuth provider
 */
export async function loginWithOAuth(
  provider: 'google' | 'facebook',
  token: string
): Promise<ApiResponse<User & { isNewUser: boolean }>> {
  try {
    const response = await fetch(`${API_URL}/api/auth/oauth/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || 'Error de autenticacion' };
    }

    return {
      success: true,
      data: { ...result.user, isNewUser: result.isNewUser },
    };
  } catch (error) {
    console.error('Error with OAuth:', error);
    return { success: false, error: 'Error de conexion' };
  }
}
