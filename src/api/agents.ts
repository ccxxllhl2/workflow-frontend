import api from './index.js';

// Define the Agent interface based on expected API response
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  config: Record<string, any>;
  [key: string]: any; // Allow for additional properties
}

// Define the response interface for agent messages
export interface AgentMessageResponse {
  message?: string;
  content?: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Fetches all agents from the API
 * @returns Promise with array of agents
 */
export const getAgents = async (): Promise<Agent[]> => {
  try {
    const response = await api.get('/agents');
    return response.data;
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
};

/**
 * Fetches a single agent by ID
 * @param id The agent ID
 * @returns Promise with agent data
 */
export const getAgentById = async (id: string): Promise<Agent> => {
  try {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching agent with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Sends a message to an agent and returns the response
 * @param message The message to send to the agent
 * @param agentId Optional agent ID (if not provided, uses default agent)
 * @returns Promise with agent response
 */
export const sendMessageToAgent = async (
  message: string,
  agentId?: string
): Promise<AgentMessageResponse> => {
  try {
    const endpoint = agentId ? `/agents/${agentId}/message` : '/agents/message';
    const response = await api.post(endpoint, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message to agent:', error);
    throw error;
  }
};