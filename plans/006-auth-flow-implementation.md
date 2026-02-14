# Plan 006 - Auth Flow Implementation

## Overview
Implement the authentication flow (register/login) for the mobile player app based on `authflow.json` definition.

## Decisions
- **JSON location**: Bundled in app (no API fetch)
- **Animations**: None
- **Validation**: In code, not JSON

## Implementation Steps

### Phase 1: Core Infrastructure

#### 1.1 Types Definition
Create TypeScript types matching the JSON schema.

**File**: `apps/mobile-player/client/features/auth/types/authflow.types.ts`

```typescript
export type ElementType = 'button' | 'input' | 'radio' | 'checkbox' | 'link' | 'text' | 'list';

export interface BaseElement {
  type: ElementType;
  label: string;
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  screen?: Screen;
  screenRef?: string;
  navigateTo?: 'APP_HOME' | 'BACK';
  passParams?: Record<string, string>;
}

export interface InputElement extends BaseElement {
  type: 'input';
  inputType?: 'date' | 'password' | 'email' | 'tel';
  value?: string; // Can be "$params.email"
}

export interface RadioElement extends BaseElement {
  type: 'radio';
}

export interface CheckboxElement extends BaseElement {
  type: 'checkbox';
  params?: Record<string, string>;
}

export interface LinkElement extends BaseElement {
  type: 'link';
  screenRef?: string;
  navigateTo?: 'BACK';
  action?: 'GOOGLE_OAUTH';
  onComplete?: ConditionalNavigation;
}

export interface TextElement extends BaseElement {
  type: 'text';
}

export interface ListElement extends BaseElement {
  type: 'list';
  items: 'dynamic';
  onSelect: 'APP_HOME' | string;
}

export interface ConditionalNavigation {
  condition: string;
  true: NavigationTarget;
  false: NavigationTarget;
}

export interface NavigationTarget {
  screenRef: string;
  passParams?: Record<string, string>;
}

export interface Screen {
  name: string;
  params?: Record<string, string>;
  receivesParams?: string[];
  elements: Element[];
}

export type Element = ButtonElement | InputElement | RadioElement |
                      CheckboxElement | LinkElement | TextElement | ListElement;

export interface AuthFlow {
  name: string;
  version: string;
  _schema: Record<string, string>;
  _sharedScreens: string[];
  root: {
    screen: string;
    elements: Element[];
  };
}
```

#### 1.2 Auth Flow Context
**File**: `apps/mobile-player/client/features/auth/contexts/AuthFlowContext.tsx`

```typescript
interface AuthFlowContextValue {
  // State
  currentScreen: Screen;
  params: Record<string, any>;
  formData: Record<string, any>;
  context: Record<string, any>; // For $oauth_email, etc.

  // Actions
  navigateTo: (target: Screen | string, params?: Record<string, any>) => void;
  goBack: () => void;
  exitToHome: () => void;
  setFormValue: (field: string, value: any) => void;
  setContext: (key: string, value: any) => void;
  resolveScreenRef: (ref: string) => Screen | null;
}
```

#### 1.3 Screen Resolver Utility
**File**: `apps/mobile-player/client/features/auth/utils/screenResolver.ts`

- `buildScreenMap(flow)` - Creates flat Map<string, Screen> for O(1) lookup
- `resolveScreenRef(name)` - Returns Screen by name
- `resolveTemplate(text, params)` - Replaces `{{var}}` with values
- `resolveValue(value, params, context)` - Handles `$params.x` and `$context.x`

### Phase 2: Element Components

#### 2.1 Element Components
**Location**: `apps/mobile-player/client/features/auth/components/elements/`

| Component | File | Responsibilities |
|-----------|------|------------------|
| ButtonElement | `ButtonElement.tsx` | Renders button, handles screen/screenRef/navigateTo |
| InputElement | `InputElement.tsx` | Text input with types (date, password, email, tel) |
| RadioElement | `RadioElement.tsx` | Radio button (grouped by screen) |
| CheckboxElement | `CheckboxElement.tsx` | Checkbox with template label |
| LinkElement | `LinkElement.tsx` | Pressable text, handles actions/navigation |
| TextElement | `TextElement.tsx` | Static text display |
| ListElement | `ListElement.tsx` | Dynamic list (Google accounts) |

#### 2.2 Element Renderer Factory
**File**: `apps/mobile-player/client/features/auth/components/ElementRenderer.tsx`

```typescript
const elementMap: Record<ElementType, ComponentType<ElementProps>> = {
  button: ButtonElement,
  input: InputElement,
  radio: RadioElement,
  checkbox: CheckboxElement,
  link: LinkElement,
  text: TextElement,
  list: ListElement,
};

export function ElementRenderer({ element, params }: Props) {
  const Component = elementMap[element.type];
  if (!Component) return null;
  return <Component {...element} params={params} />;
}
```

### Phase 3: Screen Renderer

#### 3.1 Screen Renderer Component
**File**: `apps/mobile-player/client/features/auth/components/ScreenRenderer.tsx`

- Receives `screen` and `params`
- Resolves template in screen name
- Renders all elements via ElementRenderer
- Handles radio button grouping

### Phase 4: Action Handlers

#### 4.1 OAuth Handler
**File**: `apps/mobile-player/client/features/auth/handlers/oauthHandler.ts`

```typescript
export async function handleGoogleOAuth(): Promise<OAuthResult> {
  // 1. Trigger Google OAuth (expo-auth-session)
  // 2. Return { email, token, isNewUser }
}

export async function handleFacebookOAuth(): Promise<OAuthResult> {
  // Placeholder for future
}
```

#### 4.2 Phone Verification Handler
**File**: `apps/mobile-player/client/features/auth/handlers/phoneHandler.ts`

```typescript
export async function sendVerificationCode(phone: string): Promise<void> {
  // API call to send SMS
}

export async function verifyCode(phone: string, code: string): Promise<boolean> {
  // API call to verify
}
```

#### 4.3 Auth API Handler
**File**: `apps/mobile-player/client/features/auth/handlers/authApi.ts`

```typescript
export async function checkEmailExists(email: string): Promise<boolean>;
export async function registerUser(data: RegisterData): Promise<User>;
export async function loginUser(email: string, password: string): Promise<User>;
```

### Phase 5: Validation

#### 5.1 Validation Rules (in code)
**File**: `apps/mobile-player/client/features/auth/validation/rules.ts`

```typescript
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email invalido',
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Minimo 6 caracteres',
  },
  phone: {
    required: true,
    pattern: /^\+?[0-9]{10,15}$/,
    message: 'Numero invalido',
  },
  name: {
    required: true,
    minLength: 2,
    message: 'Nombre requerido',
  },
  birthdate: {
    required: true,
    validator: (date: Date) => {
      const age = calculateAge(date);
      return age >= 18;
    },
    message: 'Debes ser mayor de 18 anos',
  },
};
```

#### 5.2 Validation Hook
**File**: `apps/mobile-player/client/features/auth/hooks/useValidation.ts`

```typescript
export function useValidation(screenName: string) {
  // Returns validation functions for current screen's inputs
  const validate = (field: string, value: any): string | null => {
    // Returns error message or null
  };

  const validateAll = (formData: Record<string, any>): boolean => {
    // Validates all fields, returns true if valid
  };

  return { validate, validateAll, errors };
}
```

### Phase 6: Integration

#### 6.1 Auth Entry Point
**File**: `apps/mobile-player/client/app/auth/index.tsx`

```typescript
import authFlow from '../../features/auth/data/authflow.json';

export default function AuthScreen() {
  return (
    <AuthFlowProvider flow={authFlow}>
      <AuthFlowNavigator />
    </AuthFlowProvider>
  );
}
```

#### 6.2 Update App Layout
**File**: `apps/mobile-player/client/app/_layout.tsx`

Add auth stack screen to the navigator.

### Phase 7: Styling

#### 7.1 Auth Theme
**File**: `apps/mobile-player/client/features/auth/styles/theme.ts`

Consistent styling matching "Bingote de Oro" branding:
- Gold primary color (#FFD700)
- Dark text on light backgrounds
- Rounded buttons
- Card-style containers

## File Structure (Final)

```
apps/mobile-player/client/
├── app/
│   ├── _layout.tsx              # Add auth route
│   ├── auth/
│   │   └── index.tsx            # Auth entry point
│   └── index.tsx                # Update to check auth state
│
├── features/
│   └── auth/
│       ├── data/
│       │   └── authflow.json    # Copy from plans/
│       │
│       ├── types/
│       │   └── authflow.types.ts
│       │
│       ├── contexts/
│       │   └── AuthFlowContext.tsx
│       │
│       ├── components/
│       │   ├── ScreenRenderer.tsx
│       │   ├── ElementRenderer.tsx
│       │   ├── AuthFlowNavigator.tsx
│       │   └── elements/
│       │       ├── index.ts
│       │       ├── ButtonElement.tsx
│       │       ├── InputElement.tsx
│       │       ├── RadioElement.tsx
│       │       ├── CheckboxElement.tsx
│       │       ├── LinkElement.tsx
│       │       ├── TextElement.tsx
│       │       └── ListElement.tsx
│       │
│       ├── hooks/
│       │   ├── useAuthFlow.ts
│       │   ├── useFormState.ts
│       │   └── useValidation.ts
│       │
│       ├── utils/
│       │   ├── screenResolver.ts
│       │   ├── templateResolver.ts
│       │   └── paramResolver.ts
│       │
│       ├── handlers/
│       │   ├── oauthHandler.ts
│       │   ├── phoneHandler.ts
│       │   └── authApi.ts
│       │
│       ├── validation/
│       │   └── rules.ts
│       │
│       └── styles/
│           └── theme.ts
```

## Implementation Order

1. **Types** - Define all TypeScript interfaces
2. **Utils** - Screen resolver, template resolver
3. **Context** - AuthFlowContext with navigation logic
4. **Elements** - Individual element components
5. **Renderers** - ElementRenderer, ScreenRenderer
6. **Validation** - Rules and hook
7. **Handlers** - OAuth, phone, API
8. **Integration** - Wire up to app navigation
9. **Testing** - Manual flow testing

## Dependencies to Add

```json
{
  "expo-auth-session": "for Google OAuth",
  "expo-crypto": "for OAuth PKCE",
  "expo-web-browser": "for OAuth redirect"
}
```

## Notes

- No animations per user request
- Validation in code, not JSON
- JSON bundled in app (can migrate to API later)
- Facebook OAuth left as null/placeholder
