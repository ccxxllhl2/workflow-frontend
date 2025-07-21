<template>
  <div class="chat-container">
    <!-- Chat Messages -->
    <div class="chat-messages" ref="messagesContainer">
      <template v-if="messages.length === 0">
        <div class="welcome-message">
          <a-typography-title :level="3">Welcome to AI Workflow</a-typography-title>
          <a-typography-paragraph>
            Start a conversation with the AI agent to describe your task.
          </a-typography-paragraph>
        </div>
      </template>
      
      <template v-else>
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message', message.role === 'user' ? 'user-message' : 'agent-message']"
        >
          <div class="message-avatar">
            <a-avatar :size="40" :style="{ backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a' }">
              {{ message.role === 'user' ? 'U' : 'A' }}
            </a-avatar>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{{ message.role === 'user' ? 'You' : 'Agent' }}</span>
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-text" v-html="formatMessage(message.content)"></div>
          </div>
        </div>
      </template>
      
      <div v-if="isLoading" class="loading-indicator">
        <a-spin />
        <span class="loading-text">Agent is thinking...</span>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="chat-input">
      <a-input-group compact>
        <a-textarea
          v-model:value="userInput"
          placeholder="Type your message here..."
          :auto-size="{ minRows: 1, maxRows: 5 }"
          :disabled="isLoading"
          @keydown.enter.prevent="sendMessage"
          class="message-input"
        />
        <a-button 
          type="primary" 
          :disabled="!userInput.trim() || isLoading" 
          @click="sendMessage"
          class="send-button"
        >
          <template #icon><send-outlined /></template>
          Send
        </a-button>
      </a-input-group>
      <div class="input-hint">
        <info-circle-outlined />
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { SendOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { sendMessageToAgent } from '../api/agents'

// State
const userInput = ref('')
const messages = ref([])
const isLoading = ref(false)
const messagesContainer = ref(null)

// Get agent response from the API
const getAgentResponse = async (userMessage) => {
  try {
    const response = await sendMessageToAgent(userMessage)
    
    // Format the response from the API
    return {
      role: 'agent',
      content: response.message || response.content || 'I received your message.',
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Error getting agent response:', error)
    
    // Return a fallback response in case of error
    return {
      role: 'agent',
      content: 'Sorry, I encountered an error processing your request. Please try again later.',
      timestamp: new Date()
    }
  }
}

// Send message
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  // Add user message
  const userMessage = {
    role: 'user',
    content: userInput.value,
    timestamp: new Date()
  }
  messages.value.push(userMessage)
  userInput.value = ''
  
  // Scroll to bottom
  await nextTick()
  scrollToBottom()
  
  // Get agent response
  try {
    isLoading.value = true
    const agentResponse = await getAgentResponse(userMessage.content)
    messages.value.push(agentResponse)
    
    // Scroll to bottom again after response
    await nextTick()
    scrollToBottom()
  } catch (error) {
    message.error('Failed to get response from agent')
    console.error('Error getting agent response:', error)
  } finally {
    isLoading.value = false
  }
}

// Format message with line breaks and links
const formatMessage = (text) => {
  if (!text) return ''
  
  // Convert line breaks to <br>
  let formatted = text.replace(/\n/g, '<br>')
  
  // Convert URLs to links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  
  return formatted
}

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for new messages and scroll to bottom
watch(
  () => messages.value.length,
  () => nextTick(scrollToBottom)
)

// Initial setup
onMounted(() => {
  // Focus on input field
  document.querySelector('.message-input').focus()
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 200px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-message {
  text-align: center;
  margin: auto;
  max-width: 600px;
  padding: 24px;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

.message-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.message-content {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 12px 16px;
  max-width: 80%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background-color: #e6f7ff;
}

.agent-message .message-content {
  background-color: #f6ffed;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.message-sender {
  font-weight: 500;
}

.message-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  align-self: flex-start;
}

.loading-text {
  color: rgba(0, 0, 0, 0.65);
}

.chat-input {
  margin-top: 16px;
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0;
}

.message-input {
  border-radius: 4px 0 0 4px !important;
  resize: none;
}

.send-button {
  border-radius: 0 4px 4px 0;
  height: auto;
}

.input-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  gap: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>