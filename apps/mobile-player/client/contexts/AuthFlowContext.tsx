import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { router } from 'expo-router';

// =============================================================================
// TYPES
// =============================================================================

export type AuthFlow = 'register' | 'login';
export type AuthProvider = 'email' | 'phone' | 'google';

export interface RegistrationData {
  // Identity (from registration method)
  email?: string;
  password?: string;
  phone?: string;
  phoneVerified?: boolean;
  oauthEmail?: string;
  oauthId?: string;
  oauthProvider?: string;
  suggestedName?: string;

  // Profile (from profile completion)
  birthdate?: string;
  gender?: string;
  name?: string;

  // Preferences
  noAds?: boolean;
  shareData?: boolean;
}

interface AuthFlowState {
  flow: AuthFlow | null;
  provider: AuthProvider | null;
  currentStep: number;
  data: RegistrationData;
  loading: boolean;
  error: string | null;
}

interface AuthFlowContextValue extends AuthFlowState {
  // Computed
  totalSteps: number;
  steps: string[];
  isLastStep: boolean;

  // Actions
  startFlow: (flow: AuthFlow, provider: AuthProvider) => void;
  initializeFlowAt: (flow: AuthFlow, provider: AuthProvider, stepIndex: number, initialData?: Partial<RegistrationData>) => void;
  updateData: (updates: Partial<RegistrationData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  completeFlow: () => void;
}

// =============================================================================
// FLOW DEFINITIONS
// =============================================================================

const FLOW_STEPS: Record<string, string[]> = {
  // Registration flows (name + terms merged into single screen)
  'register:email': [
    '/(auth)/register/email',
    '/(auth)/register/password',
    '/(auth)/profile/birthdate',
    '/(auth)/profile/gender',
    '/(auth)/profile/name',       // Now includes terms
    '/(auth)/profile/notifications',
  ],
  'register:phone': [
    '/(auth)/register/phone',
    '/(auth)/register/sms-verification',
    '/(auth)/profile/birthdate',
    '/(auth)/profile/gender',
    '/(auth)/profile/name',       // Now includes terms
    '/(auth)/profile/notifications',
  ],
  'register:google': [
    '/(auth)/register/google-selector',
    '/(auth)/profile/birthdate',
    '/(auth)/profile/gender',
    '/(auth)/profile/name',       // Now includes terms
    '/(auth)/profile/notifications',
  ],

  // Login flows
  // Note: Phone and Google login flows include profile steps for smart detection.
  // If user doesn't exist, they seamlessly transition to registration.
  'login:email': [
    '/(auth)/login/email',
  ],
  'login:phone': [
    '/(auth)/register/phone',
    '/(auth)/register/sms-verification',
    '/(auth)/profile/birthdate',      // Smart detection: new user → register
    '/(auth)/profile/gender',
    '/(auth)/profile/name',
    '/(auth)/profile/notifications',
  ],
  'login:google': [
    '/(auth)/register/google-selector',
    '/(auth)/profile/birthdate',      // Smart detection: new user → register
    '/(auth)/profile/gender',
    '/(auth)/profile/name',
    '/(auth)/profile/notifications',
  ],
};

// =============================================================================
// CONTEXT
// =============================================================================

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

const initialState: AuthFlowState = {
  flow: null,
  provider: null,
  currentStep: 0,
  data: {},
  loading: false,
  error: null,
};

interface AuthFlowProviderProps {
  children: ReactNode;
}

export function AuthFlowProvider({ children }: AuthFlowProviderProps) {
  const [state, setState] = useState<AuthFlowState>(initialState);

  // Get steps for current flow
  const getFlowKey = useCallback(() => {
    if (!state.flow || !state.provider) return null;
    return `${state.flow}:${state.provider}`;
  }, [state.flow, state.provider]);

  const steps = getFlowKey() ? FLOW_STEPS[getFlowKey()!] || [] : [];
  const totalSteps = steps.length;
  const isLastStep = state.currentStep >= totalSteps - 1;

  // Start a new flow
  const startFlow = useCallback((flow: AuthFlow, provider: AuthProvider) => {
    const flowKey = `${flow}:${provider}`;
    const flowSteps = FLOW_STEPS[flowKey];

    if (!flowSteps || flowSteps.length === 0) {
      console.error(`[AuthFlow] Unknown flow: ${flowKey}`);
      return;
    }

    console.log(`[AuthFlow] Starting flow: ${flowKey}, steps:`, flowSteps.length);

    setState({
      flow,
      provider,
      currentStep: 0,
      data: {},
      loading: false,
      error: null,
    });

    // Navigate to first step
    router.push(flowSteps[0] as any);
  }, []);

  // Initialize flow at a specific step (for OAuth callback scenarios)
  // Does NOT navigate - caller handles navigation
  const initializeFlowAt = useCallback((
    flow: AuthFlow,
    provider: AuthProvider,
    stepIndex: number,
    initialData?: Partial<RegistrationData>
  ) => {
    const flowKey = `${flow}:${provider}`;
    const flowSteps = FLOW_STEPS[flowKey];

    if (!flowSteps || flowSteps.length === 0) {
      console.error(`[AuthFlow] Unknown flow: ${flowKey}`);
      return;
    }

    if (stepIndex < 0 || stepIndex >= flowSteps.length) {
      console.error(`[AuthFlow] Invalid step index: ${stepIndex} for flow ${flowKey}`);
      return;
    }

    console.log(`[AuthFlow] Initializing flow: ${flowKey} at step ${stepIndex}`);

    setState({
      flow,
      provider,
      currentStep: stepIndex,
      data: initialData || {},
      loading: false,
      error: null,
    });
  }, []);

  // Update accumulated data
  const updateData = useCallback((updates: Partial<RegistrationData>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...updates },
      error: null,
    }));
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    // Get current state directly to avoid stale closure
    setState((prev) => {
      const flowKey = prev.flow && prev.provider ? `${prev.flow}:${prev.provider}` : null;

      if (!flowKey) {
        console.error('[AuthFlow] No active flow');
        return prev;
      }

      const flowSteps = FLOW_STEPS[flowKey];
      if (!flowSteps) {
        console.error(`[AuthFlow] Unknown flow: ${flowKey}`);
        return prev;
      }

      const nextIndex = prev.currentStep + 1;

      if (nextIndex >= flowSteps.length) {
        console.log('[AuthFlow] Flow completed - at last step');
        return prev;
      }

      const nextRoute = flowSteps[nextIndex];

      console.log(`[AuthFlow] nextStep:`);
      console.log(`  Flow: ${flowKey}`);
      console.log(`  From: step ${prev.currentStep} → ${flowSteps[prev.currentStep]}`);
      console.log(`  To: step ${nextIndex} → ${nextRoute}`);

      // Schedule navigation for next tick to ensure state is updated first
      queueMicrotask(() => {
        router.push(nextRoute as any);
      });

      return {
        ...prev,
        currentStep: nextIndex,
        error: null,
      };
    });
  }, []);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    const flowKey = getFlowKey();
    if (!flowKey) return;

    const flowSteps = FLOW_STEPS[flowKey];
    const prevIndex = state.currentStep - 1;

    if (prevIndex < 0) {
      // Exit flow - go back to hub
      console.log('[AuthFlow] Exiting flow');
      router.back();
      return;
    }

    console.log(`[AuthFlow] Moving back to step ${prevIndex + 1}/${flowSteps.length}`);

    setState((prev) => ({
      ...prev,
      currentStep: prevIndex,
      error: null,
    }));

    router.back();
  }, [getFlowKey, state.currentStep]);

  // Go to specific step
  const goToStep = useCallback((stepIndex: number) => {
    const flowKey = getFlowKey();
    if (!flowKey) return;

    const flowSteps = FLOW_STEPS[flowKey];
    if (stepIndex < 0 || stepIndex >= flowSteps.length) return;

    setState((prev) => ({
      ...prev,
      currentStep: stepIndex,
      error: null,
    }));

    router.push(flowSteps[stepIndex] as any);
  }, [getFlowKey]);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  // Set error
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  // Reset flow
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Complete flow and navigate to app
  const completeFlow = useCallback(() => {
    console.log('[AuthFlow] Flow completed, navigating to app');
    setState(initialState);
    router.replace('/main');
  }, []);

  const value: AuthFlowContextValue = {
    ...state,
    totalSteps,
    steps,
    isLastStep,
    startFlow,
    initializeFlowAt,
    updateData,
    nextStep,
    prevStep,
    goToStep,
    setLoading,
    setError,
    reset,
    completeFlow,
  };

  return (
    <AuthFlowContext.Provider value={value}>
      {children}
    </AuthFlowContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }
  return context;
}

// =============================================================================
// UTILITY HOOK - For screens that need step info
// =============================================================================

export function useFlowProgress() {
  const { currentStep, totalSteps, flow, provider } = useAuthFlow();

  // For profile screens, we show progress relative to profile steps only
  // Profile steps start at index 2 for email (after email, password)
  // Profile steps start at index 2 for phone (after phone, sms)
  // Profile steps start at index 1 for google (after oauth)

  const getProfileStepOffset = () => {
    if (!flow || !provider) return 0;
    if (flow === 'login') return 0; // Login has no profile steps

    switch (provider) {
      case 'email': return 2; // email, password, then profile
      case 'phone': return 2; // phone, sms, then profile
      case 'google': return 1; // oauth, then profile
      default: return 0;
    }
  };

  const profileOffset = getProfileStepOffset();
  const isProfileStep = currentStep >= profileOffset;

  // Profile has 4 steps: birthdate, gender, name+terms, notifications
  const profileStepCount = 4;
  const profileCurrentStep = isProfileStep ? currentStep - profileOffset + 1 : 0;

  return {
    currentStep: currentStep + 1, // 1-indexed for display
    totalSteps,
    profileCurrentStep,
    profileStepCount,
    isProfileStep,
  };
}
