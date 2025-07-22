import api from './index.js';

// Define the Tool interface based on expected API response
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Record<string, any>;
  [key: string]: any; // Allow for additional properties
}

/**
 * Fetches all tools from the API
 * @returns Promise with array of tools
 */
export const getTools = async (): Promise<Tool[]> => {
  try {
    const response = await api.get('/tools');
    return response.data;
  } catch (error) {
    console.error('Error fetching tools:', error);
    throw error;
  }
};

/**
 * Fetches a single tool by ID
 * @param id The tool ID
 * @returns Promise with tool data
 */
export const getToolById = async (id: string): Promise<Tool> => {
  try {
    const response = await api.get(`/tools/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tool with ID ${id}:`, error);
    throw error;
  }
};