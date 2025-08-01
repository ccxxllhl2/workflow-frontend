import api from './index';

// Define the response interface for chat messages
export interface ChatResponse {
  message?: string;
  content?: string;
  [key: string]: any; // Allow for additional properties
}

/**
 * Sends a message to the chat API and returns the response
 * @param message The message to send to the chat
 * @returns Promise with chat response
 */
export const sendChatMessage = async (message: string): Promise<ChatResponse> => {
  try {
    // Send message in the request body instead of URL parameters to avoid OPTIONS preflight
    // Use a longer timeout (60 seconds) for chat API to accommodate AI processing time
    const response = await api.post('/chat', { message }, { timeout: 120000 });
    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error sending message to chat:', error);
    throw error;
  }
};