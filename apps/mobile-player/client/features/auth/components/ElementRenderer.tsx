import React from 'react';
import { Element, ElementType } from '../types/authflow.types';
import {
  ButtonElementComponent,
  InputElementComponent,
  RadioElementComponent,
  CheckboxElementComponent,
  LinkElementComponent,
  TextElementComponent,
  ListElementComponent,
} from './elements';

interface Props {
  element: Element;
  params?: Record<string, any>;
  radioGroupName?: string;
  validationErrors?: Record<string, string>;
  onBeforeNavigate?: () => Promise<boolean>;
}

const elementComponents: Record<ElementType, React.ComponentType<any>> = {
  button: ButtonElementComponent,
  input: InputElementComponent,
  radio: RadioElementComponent,
  checkbox: CheckboxElementComponent,
  link: LinkElementComponent,
  text: TextElementComponent,
  list: ListElementComponent,
};

export function ElementRenderer({
  element,
  params,
  radioGroupName,
  validationErrors,
  onBeforeNavigate,
}: Props) {
  const Component = elementComponents[element.type];

  if (!Component) {
    console.warn(`Unknown element type: ${element.type}`);
    return null;
  }

  // Build props based on element type
  const elementProps: any = {
    ...element,
    params,
  };

  // Add radio group name for radio elements
  if (element.type === 'radio' && radioGroupName) {
    elementProps.groupName = radioGroupName;
  }

  // Add validation error for input elements
  if (element.type === 'input' && validationErrors) {
    elementProps.error = validationErrors[element.label];
  }

  // Add before navigate hook for buttons
  if (element.type === 'button' && onBeforeNavigate) {
    elementProps.onBeforeNavigate = onBeforeNavigate;
  }

  return <Component {...elementProps} />;
}
