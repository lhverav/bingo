import { createContext, useContext, useState, ReactNode } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface RegistrationData {
  // Identity (from registration method)
  email?: string;
  password?: string;
  phone?: string;
  phoneVerified?: boolean;
  oauthEmail?: string;
  oauthId?: string;
  oauthProvider?: string;
  suggestedName?: string; // From OAuth, used to prefill name input

  // Profile (from profile completion)
  birthdate?: string;
  gender?: string;
  name?: string;

  // Preferences
  noAds?: boolean;
  shareData?: boolean;
}

interface RegistrationContextValue {
  data: RegistrationData;
  updateData: (updates: Partial<RegistrationData>) => void;
  clearData: () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface RegistrationProviderProps {
  children: ReactNode;
}

export function RegistrationProvider({ children }: RegistrationProviderProps) {
  const [data, setData] = useState<RegistrationData>({});

  const updateData = (updates: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const clearData = () => {
    setData({});
  };

  return (
    <RegistrationContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </RegistrationContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within RegistrationProvider');
  }
  return context;
}
