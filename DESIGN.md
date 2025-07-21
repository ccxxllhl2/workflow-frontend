# AI Workflow Frontend Design

## Technology Stack

For this modern single-page application, I recommend the following technology stack:

### Core Technologies
- **React**: A popular and powerful library for building user interfaces
- **TypeScript**: For type safety and better developer experience
- **Vite**: Fast build tool (already in the project)

### UI Components and Styling
- **Material UI (MUI)**: A comprehensive React UI framework with beautiful components
- **Emotion**: For CSS-in-JS styling
- **Framer Motion**: For smooth animations and transitions

### State Management and Data Fetching
- **React Query**: For data fetching, caching, and state management of server data
- **Zustand**: A lightweight state management solution for UI state
- **Axios**: For HTTP requests

### Development Tools
- **ESLint**: For code linting
- **Prettier**: For code formatting (already in the project)
- **Vitest**: For unit testing

## Application Architecture

### Directory Structure
```
src/
├── api/                  # API service layer
│   ├── agents.ts         # Agents API
│   ├── state.ts          # Workflow state API
│   ├── tools.ts          # Tools API
│   └── index.ts          # API exports
├── components/           # Reusable UI components
│   ├── common/           # Common UI elements
│   ├── agents/           # Agent-related components
│   ├── tools/            # Tool-related components
│   └── workflow/         # Workflow-related components
├── hooks/                # Custom React hooks
├── pages/                # Page components
│   ├── AgentsPage.tsx    # Agents configuration page
│   ├── ToolsPage.tsx     # Tools configuration page
│   └── WorkflowPage.tsx  # Workflow state page
├── store/                # State management
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── App.tsx               # Main application component
└── main.tsx              # Application entry point
```

## Component Design

### Main Layout
The application will have a modern layout with:
- A sidebar for navigation between the three main views
- A header with application title and potentially user information
- A main content area for displaying the current view
- A footer with relevant information

### Agents Configuration Component
This component will display the agent configurations retrieved from the `/agents` API.

**Features:**
- Display a list of available agents with their configurations
- Allow filtering and searching of agents
- Show detailed information for each agent in an expandable panel
- Visualize agent properties in a user-friendly way

**UI Elements:**
- Cards for each agent with summary information
- Expandable panels for detailed configuration
- Search and filter controls
- Visual indicators for agent status or type

### Tools Configuration Component
This component will display the AI tools configurations retrieved from the `/tools` API.

**Features:**
- Display a list of available tools with their configurations
- Allow filtering and searching of tools
- Show detailed information for each tool in an expandable panel
- Visualize tool properties in a user-friendly way

**UI Elements:**
- Cards for each tool with summary information
- Expandable panels for detailed configuration
- Search and filter controls
- Visual indicators for tool type or category

### Workflow State Component
This component will display the workflow state retrieved from the `/state` API and update it regularly.

**Features:**
- Display the current state of workflow nodes (sub-agents)
- Auto-refresh the state data at regular intervals (e.g., every 5 seconds)
- Visualize the workflow as a graph or tree structure
- Show status indicators for each node

**UI Elements:**
- Interactive graph visualization of the workflow
- Status indicators (colors, icons) for node states
- Timeline or history of state changes
- Auto-refresh controls (pause/resume, interval adjustment)

## Data Flow

1. **API Services**: Responsible for communicating with the backend APIs
   - Fetch agent configurations from `/agents`
   - Fetch tool configurations from `/tools`
   - Fetch and poll workflow state from `/state`

2. **State Management**:
   - Server data (API responses) will be managed with React Query
   - UI state (active tabs, expanded panels, etc.) will be managed with Zustand
   - Component-local state will use React's useState and useReducer

3. **Components**:
   - Page components will fetch data using the API services
   - UI components will receive data as props and render accordingly
   - Workflow state component will implement polling for regular updates

## UI/UX Design

The application will have a modern, clean UI inspired by ChatGPT:

### Color Scheme
- Primary: #2D7FF9 (Blue)
- Secondary: #6C63FF (Purple)
- Background: #F8F9FA (Light Gray)
- Text: #212529 (Dark Gray)
- Success: #28A745 (Green)
- Warning: #FFC107 (Yellow)
- Error: #DC3545 (Red)

### Typography
- Primary Font: Inter or Roboto
- Headings: Semi-bold, larger sizes
- Body Text: Regular weight, comfortable reading size

### UI Elements
- Cards with subtle shadows and rounded corners
- Smooth transitions and animations
- Responsive design for all screen sizes
- Dark mode support

### User Experience
- Intuitive navigation between views
- Consistent design patterns across the application
- Helpful loading states and error messages
- Responsive feedback for user actions

## Implementation Plan

1. Set up the project with the required dependencies
2. Implement the basic application structure and routing
3. Create the API service layer for data fetching
4. Implement the main layout and navigation
5. Develop the Agents Configuration component
6. Develop the Tools Configuration component
7. Develop the Workflow State component with polling
8. Add styling and animations
9. Implement responsive design
10. Test and refine the application

## Mockups

### Main Layout
```
+---------------------------------------+
|  Logo   |  Title                | Nav |
+---------------------------------------+
|        |                              |
|        |                              |
|  Nav   |       Main Content           |
|  Bar   |                              |
|        |                              |
|        |                              |
+---------------------------------------+
|              Footer                   |
+---------------------------------------+
```

### Agents/Tools View
```
+---------------------------------------+
|  Search/Filter                        |
+---------------------------------------+
|  +-----------------------------------+|
|  |  Agent/Tool Card 1                ||
|  |  +-------------------------------+||
|  |  |  Expanded Details (optional)  |||
|  |  +-------------------------------+||
|  +-----------------------------------+|
|  +-----------------------------------+|
|  |  Agent/Tool Card 2                ||
|  +-----------------------------------+|
|  +-----------------------------------+|
|  |  Agent/Tool Card 3                ||
|  +-----------------------------------+|
+---------------------------------------+
```

### Workflow State View
```
+---------------------------------------+
|  Controls | Auto-refresh: ON  | 5s ▼  |
+---------------------------------------+
|                                       |
|    [Node1] -----> [Node3]             |
|      |              |                 |
|      v              v                 |
|    [Node2] -----> [Node4] ---> [Node5]|
|                                       |
+---------------------------------------+
|  Timeline / History                   |
+---------------------------------------+
```

This design provides a modern, user-friendly interface for interacting with the AI workflow system, with a focus on clear visualization of the three main data types: agents, tools, and workflow state.