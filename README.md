# AI Workflow Frontend

A modern single-page application for managing AI workflows, built with Vue 3 and Ant Design Vue. This frontend interfaces with a backend API to provide a ChatGPT-like chat interface and workflow state visualization.

## Features

- **Chat Interface**: A ChatGPT-like chat window for interacting with AI agents
- **Workflow Visualization**: Real-time visualization of workflow execution with auto-refresh capability
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Ant Design Vue components

## Technology Stack

- **Vue 3**: Progressive JavaScript framework
- **Ant Design Vue**: UI component library
- **Pinia**: State management
- **Vue Router**: Client-side routing
- **Axios**: HTTP client for API requests
- **G6**: Graph visualization library

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Backend API running at http://127.0.0.1:8000

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to http://localhost:5173

## API Integration

The application integrates with the following backend APIs:

- `GET /agents`: Retrieves agent configurations
- `POST /agents/message`: Sends a message to an agent and gets a response
- `GET /tools`: Retrieves tool configurations
- `GET /state`: Retrieves workflow node states

## Project Structure

```
src/
├── api/                  # API service layer
│   ├── agents.js         # Agents API
│   ├── state.js          # Workflow state API
│   ├── tools.js          # Tools API
│   └── index.js          # API exports
├── assets/               # Static assets
│   └── main.css          # Global CSS
├── components/           # Reusable UI components
├── stores/               # Pinia stores
├── views/                # Page components
│   ├── ChatView.vue      # Chat interface
│   └── WorkflowView.vue  # Workflow visualization
├── App.vue               # Main application component
└── main.js               # Application entry point
```

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Preview Production Build

To preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

## Notes

This is a proof of concept (PoC) application focused on UI presentation rather than performance optimization. The application demonstrates:

1. A chat interface similar to ChatGPT for user-agent interaction
2. A workflow visualization showing the execution of agent nodes
3. Integration with backend APIs for data retrieval and updates

## License

This project is licensed under the MIT License.