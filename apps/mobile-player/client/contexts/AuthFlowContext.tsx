import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { router } from 'expo-router';

// Types
export type AuthFlow = 'register' | 'login';
export type AuthProvider = 'email' | 'phone' | 'google' | 'facebook' | 'guest';

export interface AuthFlowData {
  // Identification
  email?: string;
  phone?: string;
  countryCode?: string;
  oauthId?: string;
  oauthProvider?: string;

  // Credentials
  password?: string;

  // Profile
  birthDate?: string;
  gender?: string;
  name?: string;

  // Consents
  acceptTerms?: boolean;
  noAdsPreference?: boolean;
  shareDataConsent?: boolean;
}

export interface AuthFlowState {
  flow: AuthFlow | null;
  provider: AuthProvider | null;
  currentStep: number;
  data: AuthFlowData;
  isLoading: boolean;
  error: string | null;
}

type AuthFlowAction =
  | { type: 'START_REGISTER'; provider: AuthProvider }
  | { type: 'START_LOGIN'; provider: AuthProvider }
  | { type: 'UPDATE_DATA'; data: Partial<AuthFlowData> }
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

// Flow step definitions
const REGISTER_STEPS: Record<AuthProvider, string[]> = {
  email: ['email-input', 'password-create', 'birth-date', 'gender', 'name', 'terms', 'notifications'],
  phone: ['phone-input', 'sms-code', 'birth-date', 'gender', 'name', 'terms', 'notifications'],
  google: ['oauth', 'birth-date', 'gender', 'name', 'terms', 'notifications'],
  facebook: ['oauth', 'birth-date', 'gender', 'name', 'terms', 'notifications'],
  guest: [],
};

const LOGIN_STEPS: Record<AuthProvider, string[]> = {
  email: ['email-login'],
  phone: ['phone-input', 'sms-code'],
  google: ['oauth'],
  facebook: ['oauth'],
  guest: [],
};

// Screen path mapping
const SCREEN_PATHS: Record<string, string> = {
  'email-input': '/(auth)/register/email',
  'password-create': '/(auth)/register/password',
  'email-login': '/(auth)/login/email',
  'phone-input': '/(auth)/phone-input',
  'sms-code': '/(auth)/sms-code',
  'birth-date': '/(auth)/birth-date',
  'gender': '/(auth)/gender',
  'name': '/(auth)/name',
  'terms': '/(auth)/terms',
  'notifications': '/(auth)/notifications',
  'oauth': '/(auth)/oauth',
};

const initialState: AuthFlowState = {
  flow: null,
  provider: null,
  currentStep: 0,
  data: {},
  isLoading: false,
  error: null,
};

function authFlowReducer(state: AuthFlowState, action: AuthFlowAction): AuthFlowState {
  switch (action.type) {
    case 'START_REGISTER':
      return {
        ...initialState,
        flow: 'register',
        provider: action.provider,
        currentStep: 0,
      };
    case 'START_LOGIN':
      return {
        ...initialState,
        flow: 'login',
        provider: action.provider,
        currentStep: 0,
      };
    case 'UPDATE_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.data },
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AuthFlowContextType {
  state: AuthFlowState;
  startRegister: (provider: AuthProvider) => void;
  startLogin: (provider: AuthProvider) => void;
  updateData: (data: Partial<AuthFlowData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepName: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  getCurrentSteps: () => string[];
  getTotalSteps: () => number;
  getCurrentStepName: () => string | null;
}

const AuthFlowContext = createContext<AuthFlowContextType | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authFlowReducer, initialState);

  const getCurrentSteps = (): string[] => {
    if (!state.flow || !state.provider) return [];
    return state.flow === 'register'
      ? REGISTER_STEPS[state.provider]
      : LOGIN_STEPS[state.provider];
  };

  const getTotalSteps = (): number => getCurrentSteps().length;

  const getCurrentStepName = (): string | null => {
    const steps = getCurrentSteps();
    return steps[state.currentStep] || null;
  };

  const navigateToStep = (stepIndex: number) => {
    const steps = getCurrentSteps();
    const stepName = steps[stepIndex];
    if (stepName && SCREEN_PATHS[stepName]) {
      router.push(SCREEN_PATHS[stepName] as any);
    }
  };

  const startRegister = (provider: AuthProvider) => {
    dispatch({ type: 'START_REGISTER', provider });
    const steps = REGISTER_STEPS[provider];
    if (steps.length > 0 && SCREEN_PATHS[steps[0]]) {
      router.push(SCREEN_PATHS[steps[0]] as any);
    }
  };

  const startLogin = (provider: AuthProvider) => {
    dispatch({ type: 'START_LOGIN', provider });
    const steps = LOGIN_STEPS[provider];
    if (steps.length > 0 && SCREEN_PATHS[steps[0]]) {
      router.push(SCREEN_PATHS[steps[0]] as any);
    }
  };

  const updateData = (data: Partial<AuthFlowData>) => {
    dispatch({ type: 'UPDATE_DATA', data });
  };

  const nextStep = () => {
    const steps = getCurrentSteps();
    const nextIndex = state.currentStep + 1;

    if (nextIndex >= steps.length) {
      // Flow complete - go to home
      router.replace('/');
      dispatch({ type: 'RESET' });
      return;
    }

    dispatch({ type: 'SET_STEP', step: nextIndex });
    navigateToStep(nextIndex);
  };

  const prevStep = () => {
    const prevIndex = state.currentStep - 1;
    if (prevIndex >= 0) {
      dispatch({ type: 'SET_STEP', step: prevIndex });
      router.back();
    }
  };

  const goToStep = (stepName: string) => {
    const steps = getCurrentSteps();
    const index = steps.indexOf(stepName);
    if (index !== -1) {
      dispatch({ type: 'SET_STEP', step: index });
      navigateToStep(index);
    }
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
    router.replace('/(auth)');
  };

  return (
    <AuthFlowContext.Provider
      value={{
        state,
        startRegister,
        startLogin,
        updateData,
        nextStep,
        prevStep,
        goToStep,
        setLoading,
        setError,
        reset,
        getCurrentSteps,
        getTotalSteps,
        getCurrentStepName,
      }}
    >
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }
  return context;
}
