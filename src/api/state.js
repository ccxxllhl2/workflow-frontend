import api from './index'

/**
 * Fetches the current workflow state from the API
 * @returns {Promise<Object>} Promise with workflow state data
 */
export const getWorkflowState = async () => {
  try {
    const response = await api.get('/state')
    
    // Add lastUpdated timestamp to the response if not provided by the API
    return {
      ...response.data,
      lastUpdated: response.data.lastUpdated || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching workflow state:', error)
    throw error
  }
}

/**
 * Sets up polling for workflow state updates
 * @param {Function} callback Function to call with updated state
 * @param {number} interval Polling interval in milliseconds
 * @returns {Function} Function to stop polling
 */
export const pollWorkflowState = (
  callback,
  interval = 5000
) => {
  let isPolling = true
  
  const poll = async () => {
    if (!isPolling) return
    
    try {
      const state = await getWorkflowState()
      callback(state)
    } catch (error) {
      console.error('Error during workflow state polling:', error)
    }
    
    if (isPolling) {
      setTimeout(poll, interval)
    }
  }
  
  // Start polling
  poll()
  
  // Return function to stop polling
  return () => {
    isPolling = false
  }
}