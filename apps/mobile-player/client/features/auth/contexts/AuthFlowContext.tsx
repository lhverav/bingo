import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AuthFlow, Screen, AuthFlowContextValue, AuthFlowState } from '../types/authflow.types';
import { buildScreenMap, resolvePassParams } from '../utils/screenResolver';

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

interface AuthFlowProviderProps {
  children: React.ReactNode;
  flow: AuthFlow;
  onExitToHome: () => void;
}

export function AuthFlowProvider({ children, flow, onExitToHome }: AuthFlowProviderProps) {
  // Build screen map for O(1) lookups
  const screenMap = useMemo(() => buildScreenMap(flow), [flow]);

  // Create root screen
  const rootScreen = useMemo<Screen>(
    () => ({
      name: flow.root.screen,
      elements: flow.root.elements,
    }),
    [flow]
  );

  // State
  const [state, setState] = useState<AuthFlowState>({
    currentScreen: rootScreen,
    screenStack: [],
    params: {},
    formData: {},
    context: {},
    radioSelections: {},
    checkboxSelections: {},
  });

  // Resolve screen reference
  const resolveScreenRef = useCallback(
    (ref: string): Screen | null => {
      // Handle template variables in ref
      const resolvedRef = ref.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return state.params[key] || state.context[key] || key;
      });
      return screenMap.get(resolvedRef) || null;
    },
    [screenMap, state.params, state.context]
  );

  // Get root screen
  const getRootScreen = useCallback(() => rootScreen, [rootScreen]);

  // Navigate to a screen
  const navigateTo = useCallback(
    (target: Screen | string, params?: Record<string, any>) => {
      let targetScreen: Screen | null = null;

      if (typeof target === 'string') {
        targetScreen = resolveScreenRef(target);
      } else {
        targetScreen = target;
      }

      if (!targetScreen) {
        console.warn('Could not resolve screen:', target);
        return;
      }

      setState((prev) => ({
        ...prev,
        screenStack: prev.currentScreen ? [...prev.screenStack, prev.currentScreen] : prev.screenStack,
        currentScreen: targetScreen,
        params: params || {},
        formData: {},
        radioSelections: {},
        checkboxSelections: {},
      }));
    },
    [resolveScreenRef]
  );

  // Go back to previous screen
  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.screenStack.length === 0) {
        return prev;
      }

      const newStack = [...prev.screenStack];
      const previousScreen = newStack.pop();

      return {
        ...prev,
        screenStack: newStack,
        currentScreen: previousScreen || rootScreen,
        params: {},
        formData: {},
        radioSelections: {},
        checkboxSelections: {},
      };
    });
  }, [rootScreen]);

  // Exit to home
  const exitToHome = useCallback(() => {
    onExitToHome();
  }, [onExitToHome]);

  // Set form value
  const setFormValue = useCallback((field: string, value: any) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
    }));
  }, []);

  // Set context value
  const setContext = useCallback((key: string, value: any) => {
    setState((prev) => ({
      ...prev,
      context: { ...prev.context, [key]: value },
    }));
  }, []);

  // Set radio selection
  const setRadioSelection = useCallback((group: string, value: string) => {
    setState((prev) => ({
      ...prev,
      radioSelections: { ...prev.radioSelections, [group]: value },
    }));
  }, []);

  // Set checkbox selection
  const setCheckboxSelection = useCallback((field: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      checkboxSelections: { ...prev.checkboxSelections, [field]: checked },
    }));
  }, []);

  const contextValue: AuthFlowContextValue = {
    ...state,
    navigateTo,
    goBack,
    exitToHome,
    setFormValue,
    setContext,
    setRadioSelection,
    setCheckboxSelection,
    resolveScreenRef,
    getRootScreen,
  };

  return (
    <AuthFlowContext.Provider value={contextValue}>
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow(): AuthFlowContextValue {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within an AuthFlowProvider');
  }
  return context;
}
