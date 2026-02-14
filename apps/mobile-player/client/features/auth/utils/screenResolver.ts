import { AuthFlow, Screen, Element } from '../types/authflow.types';

/**
 * Builds a flat map of all screens by name for O(1) lookup
 */
export function buildScreenMap(flow: AuthFlow): Map<string, Screen> {
  const map = new Map<string, Screen>();

  function traverseElement(element: Element) {
    if ('screen' in element && element.screen && typeof element.screen === 'object') {
      const screen = element.screen as Screen;
      if (screen.name) {
        map.set(screen.name, screen);
      }
      if (screen.elements) {
        screen.elements.forEach(traverseElement);
      }
    }
  }

  // Create root screen
  const rootScreen: Screen = {
    name: flow.root.screen,
    elements: flow.root.elements,
  };
  map.set(rootScreen.name, rootScreen);

  // Traverse all elements
  flow.root.elements.forEach(traverseElement);

  return map;
}

/**
 * Resolves template variables like {{nombre_empresa}} with actual values
 */
export function resolveTemplate(
  text: string,
  params?: Record<string, string>
): string {
  if (!params) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] || match;
  });
}

/**
 * Resolves dynamic values like $params.email or $context.oauth_email
 */
export function resolveValue(
  value: string | undefined,
  params: Record<string, any>,
  context: Record<string, any>
): any {
  if (!value) return undefined;

  if (value.startsWith('$params.')) {
    const key = value.substring(8);
    return params[key];
  }

  if (value.startsWith('$context.')) {
    const key = value.substring(9);
    return context[key];
  }

  if (value.startsWith('$')) {
    const key = value.substring(1);
    return context[key] || params[key];
  }

  return value;
}

/**
 * Resolves passParams object, converting $variables to actual values
 */
export function resolvePassParams(
  passParams: Record<string, string> | undefined,
  context: Record<string, any>
): Record<string, any> {
  if (!passParams) return {};

  return Object.entries(passParams).reduce((acc, [key, value]) => {
    if (value.startsWith('$')) {
      const contextKey = value.substring(1);
      acc[key] = context[contextKey];
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
}
