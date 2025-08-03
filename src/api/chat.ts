import api from './index';
import { WorkflowApiResponse } from './state';

// 创建一个全局的工作流数据存储
let workflowData: WorkflowApiResponse | null = null;

// 更新工作流数据的函数
export const updateWorkflowData = (data: WorkflowApiResponse) => {
  workflowData = data;
};

// 重置工作流数据的函数 - 用于新的聊天会话
export const resetWorkflowData = () => {
  workflowData = null;
};

// Define the response interface for chat messages
export interface ChatResponse {
  message?: string;
  content?: string;
  [key: string]: any; // Allow for additional properties
}

// Define the state interface
export interface WorkflowState {
  WorkflowState: string;
  Nodes: {
    [key: string]: any;
  };
  Response: string[];
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

/**
 * Sends a message to the chat API without waiting for the response
 * @param message The message to send to the chat
 * @returns Promise that resolves immediately after sending
 */
export const sendChatMessageAsync = async (message: string): Promise<void> => {
  try {
    // Reset workflow data for new chat session
    resetWorkflowData();
    
    // Send message without waiting for response
    api.post('/chat', { message }, { timeout: 120000 }).catch(error => {
      console.error('Error in background chat request:', error);
    });
  } catch (error) {
    console.error('Error sending message to chat:', error);
    throw error;
  }
};

export const getWorkflowState = async function* (): AsyncGenerator<string> {
  // 保存上一次检查时的响应列表长度 - 每次创建新的生成器时都从0开始
  let lastResponseLength = 0;
  
  while (true) {
    try {
      // 安全地检查并获取响应列表
      if (!workflowData) {
        console.warn('workflowData 未定义');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // 检查 Response 属性是否存在且为数组
      if (!Array.isArray(workflowData.Response)) {
        console.warn('workflowData.Response 不是数组');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const response_list = workflowData.Response;

      // 如果响应列表长度增加，说明有新消息
      if (response_list.length > lastResponseLength) {
        // 只产生新增的消息
        yield response_list[-1];
        // 更新上次检查的长度
        lastResponseLength = response_list.length;
      }

      if (workflowData.WorkflowState === 'Finished') {
        break;
      }
      
      // 暂停一小段时间再继续检查
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('监听响应列表时发生错误:', error);
      break;
    }
  }
};