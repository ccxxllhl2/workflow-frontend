# AI Workflow Frontend - Project Structure Guide

## Project Overview

This project is an AI Workflow Frontend application that appears to be in transition between Vue.js and React frameworks. It contains parallel implementations of the same functionality in both frameworks, with nearly identical UI and behavior.

The application has two main views:
1. **Chat View**: A chat interface for interacting with AI agents
2. **Workflow View**: A graph visualization of AI workflow execution

## Project Structure

```
workflow-front/
├── index.html             # Main HTML template (references Vue entry point)
├── package.json           # Project dependencies and scripts
├── src/
│   ├── api/               # API integration
│   │   ├── agents.ts/ts   # Agent-related API calls
│   │   ├── chat.ts        # Chat-related API calls
│   │   ├── index.ts/ts    # Axios configuration
│   │   ├── state.ts/ts    # Workflow state API calls
│   │   └── tools.js/ts    # Tools-related API calls
│   ├── assets/            # Static assets
│   ├── components/        # UI components
│   │   ├── agents/        # Agent-related components
│   │   ├── common/        # Reusable common components
│   │   ├── tools/         # Tool-related components
│   │   └── workflow/      # Workflow-specific components
│   ├── pages/             # React page components
│   ├── utils/             # Utility functions
│   ├── views/             # View components (both React and Vue)
│   │   ├── ChatView.tsx   # React chat view
│   │   ├── ChatView.vue   # Vue chat view
│   │   ├── WorkflowView.tsx # React workflow view
│   │   └── WorkflowView.vue # Vue workflow view
│   ├── App.tsx            # React app root component
│   ├── App.vue            # Vue app root component
│   ├── main.js            # Vue entry point
│   └── main.tsx           # React entry point
└── tsconfig.json          # TypeScript configuration
```

## Framework Duality

The project contains parallel implementations in both Vue.js and React:

1. **Entry Points**:
   - Vue: `main.js` (referenced in index.html)
   - React: `main.tsx`

2. **Root Components**:
   - Vue: `App.vue`
   - React: `App.tsx`

3. **Views**:
   - Vue: `views/*.vue`
   - React: `views/*.tsx`

4. **API Integration**:
   - JavaScript files (`.js`) are likely used by Vue
   - TypeScript files (`.ts`) are likely used by React

## Recommended Reading Order

To understand this codebase, I recommend the following reading order:

### 1. Project Configuration
1. `package.json` - Understand dependencies and scripts
2. `index.html` - Main HTML template
3. `tsconfig.json` - TypeScript configuration

### 2. Entry Points
1. `src/main.js` - Vue entry point
2. `src/main.tsx` - React entry point

### 3. Root Components
1. `src/App.vue` - Vue root component
2. `src/App.tsx` - React root component

### 4. API Integration
1. `src/api/index.ts` - API client configuration
2. `src/api/state.ts` - Workflow state API
3. `src/api/chat.ts` - Chat API
4. `src/api/agents.ts` - Agents API

### 5. Views
1. `src/views/ChatView.tsx` and `src/views/ChatView.vue` - Chat interface
2. `src/views/WorkflowView.tsx` and `src/views/WorkflowView.vue` - Workflow visualization

### 6. Components
Explore components as needed based on their usage in the views.

## Key Features

### Chat View
- Chat interface for interacting with AI agents
- Message sending and receiving
- Message formatting
- Auto-scrolling

### Workflow View
- Graph visualization of AI workflow execution
- Auto-refresh functionality
- Status-based node styling
- Interactive graph with zoom and pan

## Development Notes

1. **Framework Transition**: The project appears to be in transition between Vue and React, with parallel implementations of the same functionality.

2. **API Integration**: The application uses Axios for API calls, with a base URL of `http://127.0.0.1:8000`.

3. **UI Libraries**: 
   - React: Ant Design (`antd`)
   - Vue: Ant Design Vue (`ant-design-vue`)

4. **Visualization**: The Workflow View uses G6 (`@antv/g6`) for graph visualization.

5. **TypeScript**: The React implementation uses TypeScript, while the Vue implementation uses JavaScript with some TypeScript files.

## Conclusion

This project demonstrates a dual-framework approach, possibly during a migration from Vue to React or vice versa. The implementations are remarkably similar, suggesting a careful port of functionality between frameworks.