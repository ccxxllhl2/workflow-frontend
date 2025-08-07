// Configuration management utilities for local storage
import api from '../api/index';

export interface AppConfig {
  app_name: string;
  user_id: string;
  session_id?: string;
}

const CONFIG_STORAGE_KEY = 'workflow_app_config';

/**
 * Get configuration from local storage
 */
export const getConfig = (): AppConfig | null => {
  try {
    const configStr = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.error('Error reading config from localStorage:', error);
  }
  return null;
};

/**
 * Save configuration to local storage
 */
export const saveConfig = (config: AppConfig): void => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
};

/**
 * Generate new USER_ID from backend
 */
export const generateUserId = async (): Promise<{ user_id: string; app_name: string }> => {
  try {
    const response = await api.get('/config/user');
    return response.data;
  } catch (error) {
    console.error('Error generating user ID:', error);
    throw error;
  }
};

/**
 * Create new SESSION_ID from backend
 */
export const createSession = async (user_id: string): Promise<{ session_id: string; user_id: string }> => {
  try {
    const response = await api.post('/config/session', { user_id });
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Initialize configuration - get or create USER_ID and SESSION_ID
 */
export const initializeConfig = async (): Promise<AppConfig> => {
  let config = getConfig();
  
  // If no config exists, create new user
  if (!config) {
    const userResponse = await generateUserId();
    config = {
      app_name: userResponse.app_name,
      user_id: userResponse.user_id,
    };
    saveConfig(config);
  }
  
  // If no session exists, create new session
  if (!config.session_id) {
    const sessionResponse = await createSession(config.user_id);
    config.session_id = sessionResponse.session_id;
    saveConfig(config);
  }
  
  return config;
};

/**
 * Create new session (for new chat sessions)
 */
export const createNewSession = async (): Promise<AppConfig> => {
  let config = getConfig();
  
  if (!config) {
    // If no config exists, initialize completely
    return await initializeConfig();
  }
  
  // Create new session for existing user
  const sessionResponse = await createSession(config.user_id);
  config.session_id = sessionResponse.session_id;
  saveConfig(config);
  
  return config;
};

/**
 * Clear configuration (for testing or logout)
 */
export const clearConfig = (): void => {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing config from localStorage:', error);
  }
};