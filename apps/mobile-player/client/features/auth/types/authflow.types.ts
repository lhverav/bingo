// Auth Flow Types - Based on authflow.json schema

export type ElementType = 'button' | 'input' | 'radio' | 'checkbox' | 'link' | 'text' | 'list';

export interface BaseElement {
  type: ElementType;
  label: string;
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  screen?: Screen | null;
  screenRef?: string;
  navigateTo?: 'APP_HOME' | 'BACK';
  passParams?: Record<string, string>;
}

export interface InputElement extends BaseElement {
  type: 'input';
  inputType?: 'date' | 'password' | 'email' | 'tel' | 'text';
  value?: string;
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
  action?: 'GOOGLE_OAUTH' | 'FACEBOOK_OAUTH';
  onComplete?: ConditionalNavigation;
}

export interface TextElement extends BaseElement {
  type: 'text';
}

export interface ListElement extends BaseElement {
  type: 'list';
  items: 'dynamic' | string[];
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

export type Element =
  | ButtonElement
  | InputElement
  | RadioElement
  | CheckboxElement
  | LinkElement
  | TextElement
  | ListElement;

export interface AuthFlowRoot {
  screen: string;
  elements: Element[];
}

export interface AuthFlow {
  name: string;
  version: string;
  _schema: Record<string, string>;
  _sharedScreens: string[];
  root: AuthFlowRoot;
}

// Navigation state
export interface AuthFlowState {
  currentScreen: Screen | null;
  screenStack: Screen[];
  params: Record<string, any>;
  formData: Record<string, any>;
  context: Record<string, any>;
  radioSelections: Record<string, string>;
  checkboxSelections: Record<string, boolean>;
}

export interface AuthFlowContextValue extends AuthFlowState {
  navigateTo: (target: Screen | string, params?: Record<string, any>) => void;
  goBack: () => void;
  exitToHome: () => void;
  setFormValue: (field: string, value: any) => void;
  setContext: (key: string, value: any) => void;
  setRadioSelection: (group: string, value: string) => void;
  setCheckboxSelection: (field: string, checked: boolean) => void;
  resolveScreenRef: (ref: string) => Screen | null;
  getRootScreen: () => Screen;
}
