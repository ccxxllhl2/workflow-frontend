import api from './index';

// Define the WorkflowNode interface based on expected API response
export interface WorkflowNode {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'waiting' | 'error';
  agent: string;
  position: {
    x: number;
    y: number;
  };
  [key: string]: any; // Allow for additional properties
}

// Define the WorkflowEdge interface based on expected API response
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any; // Allow for additional properties
}

// Define the WorkflowState interface that combines nodes and edges
export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  lastUpdated: string;
}

/**
 * Fetches the current workflow state from the API
 * @returns Promise with workflow state data
 */
export const getWorkflowState = async (): Promise<WorkflowState> => {
  try {
    const response = await api.get('/state');
    const data = response.data;
    
    // Transform the API response to match the expected format
    // Convert Nodes object to an array of WorkflowNode objects
    let nodesArray: WorkflowNode[] = [];
    
    if (data.Nodes) {
      nodesArray = Object.entries(data.Nodes).map(([nodeName, nodeData]: [string, any], index) => {
        return {
          id: nodeName,
          label: nodeName,
          status: (nodeData.status === 'finished' ? 'completed' : nodeData.status) || 'waiting',
          agent: nodeName,
          message: nodeData.message || '',
          position: {
            x: 100 + (index * 200),
            y: 100 + (index % 2) * 100  // Alternate y positions for better visualization
          }
        };
      });
    }
    
    // Create empty edges array if not provided
    const edgesArray: WorkflowEdge[] = [];
    
    // Return the transformed data
    return {
      nodes: nodesArray,
      edges: edgesArray,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching workflow state:', error);
    throw error;
  }
};

/**
 * Sets up polling for workflow state updates
 * @param callback Function to call with updated state
 * @param interval Polling interval in milliseconds
 * @returns Function to stop polling
 */
export const pollWorkflowState = (
  callback: (state: WorkflowState) => void,
  interval: number = 5000
): () => void => {
  let isPolling = true;
  
  const poll = async () => {
    if (!isPolling) return;
    
    try {
      const state = await getWorkflowState();
      callback(state);
    } catch (error) {
      console.error('Error during workflow state polling:', error);
    }
    
    if (isPolling) {
      setTimeout(poll, interval);
    }
  };
  
  // Start polling
  poll();
  
  // Return function to stop polling
  return () => {
    isPolling = false;
  };
};