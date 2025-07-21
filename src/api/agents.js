import api from './index'

/**
 * Fetches all agents from the API
 * @returns {Promise<Array>} Promise with array of agents
 */
export const getAgents = async () => {
  try {
    const response = await api.get('/agents')
    return response.data
  } catch (error) {
    console.error('Error fetching agents:', error)
    throw error
  }
}