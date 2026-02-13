# Auth Flow Definition Prompt

## Purpose
Define the authentication flow (register/login) screen by screen through interactive Q&A.

## Process
1. I ask about each screen
2. User describes the elements (buttons, inputs, text, etc.)
3. I update the hierarchical `authflow.json` file
4. User says **"next"** to move to a new branch/screen in the flow

## Keywords
- **button**: A tappable action element
- **input**: Text input field
- **checkbox**: Toggleable option
- **link**: Navigational text link
- **text**: Static display text
- **next**: Signal to move to the next screen/branch in the flow

## File Structure
- `authflow.json`: Hierarchical flow definition
- `authprompt.md`: This specification document

## Flow Building Rules
- Each screen has a unique ID
- Elements are listed with their type and properties
- Navigation paths show where each action leads
- The structure mirrors the hierarchical flow
