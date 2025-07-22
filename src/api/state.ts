import api from './index.js';

// Define the original API response structure
export interface WorkflowNodeData {
  status: string;
  timestamp: number;
  message: string;
}

export interface WorkflowApiResponse {
  WorkflowState: string;
  Nodes: {
    [key: string]: WorkflowNodeData;
  };
}

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
  message: string;
  timestamp?: number;
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
  originalData?: WorkflowApiResponse; // Store the original API response
}

/**
 * Fetches the current workflow state from the API
 * @returns Promise with workflow state data
 */
export const getWorkflowState = async (): Promise<WorkflowState> => {
  try {
    const response = await api.get('/state');
    const data = response.data as WorkflowApiResponse;
    
    console.log('API Response Data:', data);
    
    // Transform the API response to match the expected format
    // Convert Nodes object to an array of WorkflowNode objects
    let nodesArray: WorkflowNode[] = [];
    
    if (data && data.Nodes) {
      nodesArray = Object.entries(data.Nodes)
        .filter(([_, nodeData]) => nodeData) // Filter out undefined nodes
        .map(([nodeName, nodeData]: [string, WorkflowNodeData], index) => {
          return {
            id: nodeName,
            label: nodeName,
            status: (nodeData.status === 'finished' ? 'completed' : 
                    nodeData.status === 'running' ? 'running' : 
                    nodeData.status === 'error' ? 'error' : 'waiting') as 'running' | 'completed' | 'waiting' | 'error',
            agent: nodeName,
            message: nodeData.message || '',
            timestamp: nodeData.timestamp,
            position: {
              x: 100 + (index * 200),
              y: 100 + (index % 2) * 100  // Alternate y positions for better visualization
            }
          };
        });
    }
    
    // Create empty edges array if not provided
    const edgesArray: WorkflowEdge[] = [];
    
    // Return the transformed data with the original data preserved
    return {
      nodes: nodesArray,
      edges: edgesArray,
      lastUpdated: new Date().toISOString(),
      originalData: data, // Store the original API response
    };
  } catch (error) {
    console.error('Error fetching workflow state:', error);
    // Instead of throwing the error, return a default state object with originalData
    return {
      nodes: [],
      edges: [],
      lastUpdated: new Date().toISOString(),
      originalData: {
        WorkflowState: 'Error',
        Nodes: {}
      }
    };
  }
};

/**
 * Sets up polling for workflow state updates
 * @param callback Function to call with updated state
 * @param interval Polling interval in milliseconds (default: 1000ms)
 * @returns Function to stop polling
 */
export const pollWorkflowState = (
  callback: (state: WorkflowState) => void,
  interval: number = 1000
): () => void => {
  let isPolling = true;
  
  const poll = async () => {
    if (!isPolling) return;
    
    try {
      const state = await getWorkflowState();
      console.log('State before callback:', state);
      if (isPolling) {
        callback(state);
      }
    } catch (error) {
      console.error('Error during workflow state polling:', error);
    } finally {
      if (isPolling) {
        setTimeout(poll, interval);
      }
    }
  };
  
  // Start polling
  poll();
  
  // Return function to stop polling
  return () => {
    isPolling = false;
  };
};