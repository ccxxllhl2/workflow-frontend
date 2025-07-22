import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Avatar, Spin, message } from 'antd';
import { SendOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { sendChatMessage } from '../api/chat';
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get agent response from the API
  const getAgentResponse = async (userMessage: string): Promise<Message> => {
    try {
      const response = await sendChatMessage(userMessage);
      
      // Format the response from the API
      return {
        role: 'agent',
        content: response.message || response.content || 'I received your message.',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting agent response:', error);
      
      // Return a fallback response in case of error
      return {
        role: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
        timestamp: new Date()
      };
    }
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
    
    // Get agent response
    try {
      setIsLoading(true);
      const agentResponse = await getAgentResponse(userMessage.content);
      setMessages(prevMessages => [...prevMessages, agentResponse]);
    } catch (error) {
      message.error('Failed to get response from agent');
      console.error('Error getting agent response:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Close workflow sidebar
  const handleCloseWorkflow = () => {
    setIsWorkflowVisible(false);
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

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Workflow Sidebar */}
      <WorkflowSidebar 
        isOpen={isWorkflowVisible} 
        onClose={handleCloseWorkflow} 
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