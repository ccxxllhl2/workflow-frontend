import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Avatar, Spin, message } from 'antd';
import { SendOutlined, InfoCircleOutlined, MenuOutlined } from '@ant-design/icons';
import { sendChatMessageAsync, getWorkflowState, WorkflowState } from '../api/chat';
import WorkflowSidebar from '../components/workflow/WorkflowSidebar';
import './ChatView.css';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const ChatView: React.FC = () => {
  // State
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkflowVisible, setIsWorkflowVisible] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseGeneratorRef = useRef<AsyncGenerator<string, void, unknown> | null>(null);

  // 使用 AsyncGenerator 监听工作流状态变化
  const startStatePolling = async () => {
    // 确保之前的轮询已停止
    stopStatePolling();

    try {
      // 使用 AsyncGenerator 监听响应
      const responseGenerator = getWorkflowState();

      // 启动一个独立进程来处理生成器
      const processResponses = async () => {
        try {
          // 遍历生成器获取新响应
          for await (const responseContent of responseGenerator) {
            // 创建一个新的 agent 消息
            const agentMessage: Message = {
              role: 'agent',
              content: responseContent,
              timestamp: new Date()
            };

            // 添加消息到列表
            setMessages(prevMessages => [...prevMessages, agentMessage]);

            // 如果工作流完成，可以在这里检测并停止
            // 注意：这可能需要另外的状态检查逻辑
          }
        } catch (error) {
          console.error('处理响应时出错:', error);
        } finally {
          setIsLoading(false);
        }
      };

      // 启动处理响应的进程
      processResponses();

    } catch (error) {
      console.error('启动响应监听时出错:', error);
      setIsLoading(false);
    }
  };

  // Stop polling
  const stopStatePolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // 标记生成器引用为 null，下次创建新的生成器
    // 注意：AsyncGenerator 没有直接的取消方法，
    // 我们依赖于 getWorkflowState 中的循环检查和超时
    responseGeneratorRef.current = null;
  };

  // Send message
  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    
    // Show workflow sidebar when user sends a message
    setIsWorkflowVisible(true);
    
    // Send message to backend without waiting for response
    try {
      setIsLoading(true);

      // Send message asynchronously
      await sendChatMessageAsync(userMessage.content);

      // 开始监听响应
      startStatePolling();
      
    } catch (error) {
      message.error('Failed to send message to agent');
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };
  
  // Close workflow sidebar
  const handleCloseWorkflow = () => {
    setIsWorkflowVisible(false);
  };

  // Open workflow sidebar
  const handleOpenWorkflow = () => {
    setIsWorkflowVisible(true);
  }

  // Handle sidebar width changes
  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width);
  };

  // Format message with line breaks and links
  const formatMessage = (text: string): string => {
    if (!text) return '';
    
    // Convert line breaks to <br>
    let formatted = text.replace(/\n/g, '<br>');
    
    // Convert URLs to links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return formatted;
  };

  // Format timestamp
  const formatTime = (timestamp: Date): string => {
    if (!timestamp) return '';
    
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Watch for new messages and scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial setup
  useEffect(() => {
    // Focus on input field
    const inputElement = document.querySelector('.message-input') as HTMLTextAreaElement;
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      stopStatePolling();
    };
  }, []);

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div 
      className="chat-container"
      style={{
        marginLeft: sidebarWidth > 0 ? `${sidebarWidth}px` : '0',
        transition: 'margin-left 0.2s ease'
      }}
    >
      {/* Workflow Sidebar */}
      <WorkflowSidebar 
        isOpen={isWorkflowVisible} 
        onClose={handleCloseWorkflow}
        onWidthChange={handleSidebarWidthChange}
      />
      
      {/* Chat Messages */}
      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="welcome-message">
            <Title level={3}>Welcome to AI Workflow</Title>
            <Paragraph>
              Start a conversation with the AI agent to describe your task.
            </Paragraph>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'agent-message'}`}
            >
              <div className="message-avatar">
                <Avatar 
                  size={40} 
                  style={{ 
                    backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a' 
                  }}
                >
                  {message.role === 'user' ? 'U' : 'A'}
                </Avatar>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {message.role === 'user' ? 'You' : 'Agent'}
                  </span>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div 
                  className="message-text"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="loading-indicator">
            <Spin />
            <span className="loading-text">Agent is thinking...</span>
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="chat-input">
        <div className="input-group">
          <TextArea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            autoSize={{ minRows: 1, maxRows: 5 }}
            disabled={isLoading}
            onKeyDown={handleKeyDown}
            className="message-input"
          />
          {/* Workflow Toggle Button - only show when sidebar is closed and there are messages */}
          {!isWorkflowVisible && messages.length > 0 && (
            <Button 
              type="default" 
              onClick={handleOpenWorkflow}
              className="workflow-toggle-button"
              icon={<MenuOutlined />}
              title="Show Workflow"
              style={{ marginRight: '8px' }}
            />
          )}
          <Button 
            type="primary" 
            disabled={!userInput.trim() || isLoading} 
            onClick={sendMessage}
            className="send-button"
            icon={<SendOutlined />}
          >
            Send
          </Button>
        </div>
        <div className="input-hint">
          <InfoCircleOutlined />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default ChatView;