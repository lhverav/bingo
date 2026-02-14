// API configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.40:3001';

export interface PhoneVerificationResult {
  success: boolean;
  error?: string;
}

/**
 * Send verification code to phone number
 */
export async function sendVerificationCode(phone: string): Promise<PhoneVerificationResult> {
  try {
    const response = await fetch(`${API_URL}/api/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Error al enviar codigo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: 'Error de conexion' };
  }
}

/**
 * Verify the code entered by user
 */
export async function verifyCode(phone: string, code: string): Promise<PhoneVerificationResult> {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Codigo invalido' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, error: 'Error de conexion' };
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(phone: string): Promise<PhoneVerificationResult> {
  return sendVerificationCode(phone);
}
