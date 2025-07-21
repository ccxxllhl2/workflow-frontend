import api from './index'

/**
 * Fetches all tools from the API
 * @returns {Promise<Array>} Promise with array of tools
 */
export const getTools = async () => {
  try {
    const response = await api.get('/tools')
    return response.data
  } catch (error) {
    console.error('Error fetching tools:', error)
    throw error
  }
}