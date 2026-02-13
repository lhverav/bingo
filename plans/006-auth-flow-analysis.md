# Plan 006 — Authentication Flow Analysis

**Status:** Analysis
**Created:** 2026-02-12
**Source:** Spotify Registration/Login Flow (menu registro-iniciosesion.pdf)

---

## Flow Diagram - Complete View

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOWS                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  ENTRY POINT    │
                              │  (Auth Screen)  │
                              └────────┬────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
                 ▼                     ▼                     ▼
        ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
        │ Registrarme    │    │ Iniciar Sesión │    │ Continuar como │
        │ gratis         │    │                │    │ invitado       │
        └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
                │                     │                     │
    ┌───────────┼───────────┐         │                     │
    │           │           │         │                     │
    ▼           ▼           ▼         │                     │
┌───────┐  ┌───────┐  ┌───────┐       │                     │
│ Email │  │ Phone │  │ OAuth │       │                     │
│ Flow  │  │ Flow  │  │ Flow  │       │                     │
└───┬───┘  └───┬───┘  └───┬───┘       │                     │
    │          │          │           │                     │
    │          │          │    ┌──────┼──────┐              │
    │          │          │    │      │      │              │
    │          │          │    ▼      ▼      ▼              │
    │          │          │ ┌─────┐┌─────┐┌─────┐           │
    │          │          │ │Email││Phone││OAuth│           │
    │          │          │ │Login││Login││Login│           │
    │          │          │ └──┬──┘└──┬──┘└──┬──┘           │
    │          │          │    │      │      │              │
    ▼          ▼          ▼    │      │      │              │
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED SCREENS ZONE                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │BirthDate │  │ Gender   │  │  Name    │  │ Terms &  │        │
│  │ Screen   │  │ Screen   │  │ Screen   │  │ Consents │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Phone   │  │SMS Code  │  │Notifica- │                      │
│  │  Input   │  │  Verify  │  │  tions   │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   HOME SCREEN   │
                    │  (Authenticated)│
                    └─────────────────┘
```

---

## Identified Shared Screens

### Screen Reuse Matrix

| Screen | Email Reg | Phone Reg | Google Reg | Email Login | Phone Login | OAuth Login |
|--------|:---------:|:---------:|:----------:|:-----------:|:-----------:|:-----------:|
| Email Input | ✓ | | | ✓ | | |
| Password Input | ✓ | | | ✓ | | |
| Phone Input | | ✓ | | | ✓ | |
| SMS Code Verify | | ✓ | | | ✓ | |
| **Birth Date** | ✓ | ✓ | ✓ | | | |
| **Gender Select** | ✓ | ✓ | ✓ | | | |
| **Name Input** | ✓ | ✓ | ✓ | | | |
| **Terms & Consents** | ✓ | ✓ | ✓ | | | |
| **Notifications** | ✓ | ✓ | ✓ | | | |

**Bold = Highly reusable (used in 3+ flows)**

---

## Shared Screen Specifications

### 1. BirthDateScreen (SHARED)

```typescript
// app/(auth)/birth-date.tsx

interface BirthDateScreenParams {
  flow: 'register';
  provider: 'email' | 'phone' | 'google' | 'facebook';
  // Data from previous steps
  prefillData?: {
    email?: string;
    phone?: string;
    oauthId?: string;
    oauthProvider?: string;
  };
}

// Behavior:
// - Same UI regardless of provider
// - On submit: navigate to gender screen with accumulated data
```

### 2. GenderScreen (SHARED)

```typescript
// app/(auth)/gender.tsx

interface GenderScreenParams {
  flow: 'register';
  provider: 'email' | 'phone' | 'google' | 'facebook';
  prefillData: {
    email?: string;
    phone?: string;
    oauthId?: string;
    birthDate: string;
  };
}

// Options: 'femenino' | 'masculino' | 'no_binario' | 'otro' | 'prefiero_no_decir'
```

### 3. NameScreen (SHARED)

```typescript
// app/(auth)/name.tsx

interface NameScreenParams {
  flow: 'register';
  provider: 'email' | 'phone' | 'google' | 'facebook';
  prefillData: {
    email?: string;
    phone?: string;
    oauthId?: string;
    birthDate: string;
    gender: string;
    // If OAuth, name might be prefilled from provider
    suggestedName?: string;  // From email (before @) or OAuth profile
  };
}

// Behavior:
// - If suggestedName exists, prefill the input
// - User can modify it
```

### 4. TermsScreen (SHARED)

```typescript
// app/(auth)/terms.tsx

interface TermsScreenParams {
  flow: 'register';
  provider: 'email' | 'phone' | 'google' | 'facebook';
  userData: {
    email?: string;
    phone?: string;
    oauthId?: string;
    birthDate: string;
    gender: string;
    name: string;
    password?: string;  // Only for email registration
  };
}

// Contains:
// - Link to Terms of Use
// - Link to Privacy Policy
// - Checkbox: No ads preference
// - Checkbox: Share data with content providers
// - Button: Create Account
```

### 5. PhoneInputScreen (SHARED between Register & Login)

```typescript
// app/(auth)/phone-input.tsx

interface PhoneInputScreenParams {
  flow: 'register' | 'login';  // KEY DIFFERENCE
  returnTo?: string;  // Where to go after verification
}

// Behavior varies by flow:
// - register: After SMS verify → birth-date screen
// - login: After SMS verify → home screen
```

### 6. SmsCodeScreen (SHARED between Register & Login)

```typescript
// app/(auth)/sms-code.tsx

interface SmsCodeScreenParams {
  flow: 'register' | 'login';
  phone: string;
  countryCode: string;
}

// Behavior varies by flow:
// - register: On success → birth-date screen
// - login: On success → home screen
```

### 7. NotificationsScreen (SHARED)

```typescript
// app/(auth)/notifications.tsx

interface NotificationsScreenParams {
  // No params needed - always same behavior
  // Always goes to home after
}

// Options:
// - "Activar notificaciones" → request permission → home
// - "Ahora no" → skip → home
```

---

## Flow State Machine

```typescript
// contexts/AuthFlowContext.tsx

type AuthFlow = 'register' | 'login';
type AuthProvider = 'email' | 'phone' | 'google' | 'facebook' | 'guest';

interface AuthFlowState {
  flow: AuthFlow;
  provider: AuthProvider;
  currentStep: number;
  totalSteps: number;

  // Accumulated data through the flow
  data: {
    // Identification (one of these)
    email?: string;
    phone?: string;
    oauthId?: string;
    oauthProvider?: string;

    // Credentials (email flow only)
    password?: string;

    // Profile (registration only)
    birthDate?: string;
    gender?: string;
    name?: string;

    // Consents
    acceptTerms?: boolean;
    noAdsPreference?: boolean;
    shareDataConsent?: boolean;
  };
}

// Flow definitions
const REGISTER_EMAIL_STEPS = [
  'email-input',      // 1
  'password-input',   // 2
  'birth-date',       // 3 (SHARED)
  'gender',           // 4 (SHARED)
  'name',             // 5 (SHARED)
  'terms',            // 6 (SHARED)
  'notifications',    // 7 (SHARED)
];

const REGISTER_PHONE_STEPS = [
  'phone-input',      // 1 (SHARED)
  'sms-code',         // 2 (SHARED)
  'birth-date',       // 3 (SHARED)
  'gender',           // 4 (SHARED)
  'name',             // 5 (SHARED)
  'terms',            // 6 (SHARED)
  'notifications',    // 7 (SHARED)
];

const REGISTER_OAUTH_STEPS = [
  'oauth-redirect',   // 1 (external)
  'birth-date',       // 2 (SHARED)
  'gender',           // 3 (SHARED)
  'name',             // 4 (SHARED) - prefilled from OAuth
  'terms',            // 5 (SHARED)
  'notifications',    // 6 (SHARED)
];

const LOGIN_EMAIL_STEPS = [
  'email-input',      // 1
  'password-input',   // 2
];

const LOGIN_PHONE_STEPS = [
  'phone-input',      // 1 (SHARED)
  'sms-code',         // 2 (SHARED)
];
```

---

## Recommended File Structure

```
apps/mobile-player/client/
├── app/
│   ├── (auth)/                          # Auth group (no tab bar)
│   │   ├── _layout.tsx                  # Auth flow layout
│   │   ├── index.tsx                    # Entry: Register/Login choice
│   │   │
│   │   ├── register/
│   │   │   ├── email.tsx                # Email input (register)
│   │   │   └── password.tsx             # Password create
│   │   │
│   │   ├── login/
│   │   │   ├── email.tsx                # Email + password (login)
│   │   │   └── forgot-password.tsx
│   │   │
│   │   ├── phone-input.tsx              # SHARED: phone input
│   │   ├── sms-code.tsx                 # SHARED: SMS verification
│   │   ├── birth-date.tsx               # SHARED: birth date
│   │   ├── gender.tsx                   # SHARED: gender selection
│   │   ├── name.tsx                     # SHARED: name input
│   │   ├── terms.tsx                    # SHARED: terms & consents
│   │   └── notifications.tsx            # SHARED: notification permission
│   │
│   ├── (app)/                           # Main app (with tab bar)
│   │   ├── _layout.tsx
│   │   ├── index.tsx                    # Home
│   │   └── ...
│   │
│   └── _layout.tsx                      # Root layout
│
├── components/
│   └── auth/
│       ├── AuthButton.tsx               # Styled auth buttons
│       ├── AuthInput.tsx                # Styled inputs
│       ├── OAuthButton.tsx              # Google/Facebook buttons
│       ├── PhoneInput.tsx               # Country code + phone
│       ├── GenderSelector.tsx           # Gender option buttons
│       └── ConsentCheckbox.tsx          # Terms checkboxes
│
├── contexts/
│   └── AuthFlowContext.tsx              # Flow state management
│
└── hooks/
    └── useAuthFlow.ts                   # Flow navigation helpers
```

---

## Parameter Passing Strategy

### Option A: URL Params (Expo Router)

```typescript
// Navigate with params
router.push({
  pathname: '/(auth)/birth-date',
  params: {
    flow: 'register',
    provider: 'email',
    email: 'user@example.com',
  }
});

// Receive in screen
const { flow, provider, email } = useLocalSearchParams();
```

### Option B: Context (Recommended for complex flows)

```typescript
// AuthFlowContext.tsx
const AuthFlowContext = createContext<AuthFlowContextType>(null);

export function AuthFlowProvider({ children }) {
  const [state, dispatch] = useReducer(authFlowReducer, initialState);

  const actions = {
    startRegister: (provider: AuthProvider) => {
      dispatch({ type: 'START_REGISTER', provider });
    },
    startLogin: (provider: AuthProvider) => {
      dispatch({ type: 'START_LOGIN', provider });
    },
    updateData: (data: Partial<AuthFlowData>) => {
      dispatch({ type: 'UPDATE_DATA', data });
    },
    nextStep: () => {
      dispatch({ type: 'NEXT_STEP' });
      // Auto-navigate to next screen
    },
    reset: () => {
      dispatch({ type: 'RESET' });
    },
  };

  return (
    <AuthFlowContext.Provider value={{ state, ...actions }}>
      {children}
    </AuthFlowContext.Provider>
  );
}

// Usage in shared screen
function BirthDateScreen() {
  const { state, updateData, nextStep } = useAuthFlow();

  const handleSubmit = (birthDate: string) => {
    updateData({ birthDate });
    nextStep();  // Automatically navigates to gender screen
  };

  return (
    <View>
      <Text>Step {state.currentStep} of {state.totalSteps}</Text>
      {/* ... */}
    </View>
  );
}
```

---

## Visual Flow Diagram (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              REGISTER FLOWS                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

EMAIL REGISTRATION:
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Email   │──►│Password │──►│ Birth   │──►│ Gender  │──►│  Name   │──►│ Terms   │──►│ Notif.  │──► HOME
│ Input   │   │ Create  │   │  Date   │   │ Select  │   │  Input  │   │ Consent │   │ Permis. │
└─────────┘   └─────────┘   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘
                                 │             │             │             │             │
                                 └─────────────┴─────────────┴─────────────┴─────────────┘
                                                    SHARED SCREENS

PHONE REGISTRATION:
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Phone   │──►│  SMS    │──►│ Birth   │──►│ Gender  │──►│  Name   │──►│ Terms   │──►│ Notif.  │──► HOME
│ Input   │   │  Code   │   │  Date   │   │ Select  │   │  Input  │   │ Consent │   │ Permis. │
└────┬────┘   └────┬────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     │             │
     └─────────────┘
     SHARED (also used in login)

GOOGLE OAUTH REGISTRATION:
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Google  │──►│ Birth   │──►│ Gender  │──►│  Name   │──►│ Terms   │──►│ Notif.  │──► HOME
│ OAuth   │   │  Date   │   │ Select  │   │(prefill)│   │ Consent │   │ Permis. │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
    │
    │ If email already exists with password:
    └────────────────────────────────────────────────────────────►┌─────────┐
                                                                  │ Email   │──► (login flow)
                                                                  │ Login   │
                                                                  │(prefill)│
                                                                  └─────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               LOGIN FLOWS                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

EMAIL LOGIN:
┌─────────────────┐
│ Email + Password│──► HOME
│     Login       │
└─────────────────┘

PHONE LOGIN:
┌─────────┐   ┌─────────┐
│ Phone   │──►│  SMS    │──► HOME
│ Input   │   │  Code   │
└─────────┘   └─────────┘
  SHARED        SHARED

OAUTH LOGIN:
┌─────────┐
│ Google/ │──► HOME (if registered)
│Facebook │
└─────────┘
    │
    │ If not registered:
    └──► (redirect to register flow with OAuth data)
```

---

## Implementation Priority

| Priority | Screen | Reuse Count | Complexity |
|----------|--------|-------------|------------|
| 1 | AuthFlowContext | N/A | High |
| 2 | BirthDateScreen | 3 flows | Low |
| 3 | GenderScreen | 3 flows | Low |
| 4 | NameScreen | 3 flows | Low |
| 5 | TermsScreen | 3 flows | Medium |
| 6 | NotificationsScreen | 3 flows | Low |
| 7 | PhoneInputScreen | 2 flows | Medium |
| 8 | SmsCodeScreen | 2 flows | Medium |
| 9 | EmailInputScreen | 2 flows | Low |
| 10 | PasswordScreen | 2 flows | Low |
| 11 | OAuthIntegration | 2 providers | High |

---

## Key Insights from Spotify Flow

1. **Smart Account Linking**: If OAuth email matches existing email account, redirect to email login with prefilled email instead of creating duplicate account.

2. **Progressive Data Collection**: Don't ask for everything upfront. Collect identity first, then profile data step by step.

3. **Name Inference**: Auto-suggest name from email (before @) or OAuth profile, but let user modify.

4. **Unified Verification**: Same phone/SMS screens for both register and login - only the "next destination" changes.

5. **Optional Consents**: Marketing preferences are separate from required terms acceptance.

6. **Deferred Permissions**: Notification permission asked AFTER account creation, not before.
