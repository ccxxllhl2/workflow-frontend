# Chat API Timeout Solution

## Problem

The frontend was encountering timeout issues when making requests to the backend's POST /chat API. This was happening because the backend needs to process AI requests, which can take longer than the default timeout setting of 10 seconds.

Error message:
```
index.js:37 No response received: XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 10000, withCredentials: false, upload: XMLHttpRequestUpload, …}
Error sending message to chat: AxiosError {message: 'timeout of 10000ms exceeded', name: 'AxiosError', code: 'ECONNABORTED', config: {…}, request: XMLHttpRequest, …}
```

## Root Cause

The default timeout for all API calls was set to 10 seconds (10000 milliseconds) in the Axios instance configuration in `src/api/index.js`:

```javascript
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
})
```

This timeout was too short for the backend to process AI requests, which can take longer to complete.

## Solution

Modified the `sendChatMessage` function in `src/api/chat.ts` to set a specific longer timeout (60 seconds) for the chat API:

Before:
```typescript
const response = await api.post('/chat', { message });
```

After:
```typescript
const response = await api.post('/chat', { message }, { timeout: 60000 });
```

## Why This Works

1. By setting a longer timeout specifically for the chat API, we give the backend more time to process AI requests before the frontend times out.

2. The change only affects the chat API, leaving other API calls with the default timeout of 10 seconds.

3. According to the Axios documentation, we can override the default timeout for a specific request by passing a config object as the third parameter to the post method.

## Alternative Solutions Considered

1. **Increase the global timeout for all API calls**: This would have been simpler to implement but would have affected all API calls, not just the chat API, which might not be necessary for other endpoints.

2. **Implement a long-polling or streaming connection**: This would have provided a more robust solution for long-running operations but would have required significant changes to both frontend and backend.

## Verification

To verify this solution:
1. Run the frontend application
2. Open the browser's developer tools (F12)
3. Go to the Network tab
4. Try sending a message in the chat interface
5. Check if the request to /chat completes successfully without timing out
6. Verify that the response is received from the backend

## Additional Notes

If 60 seconds is still not enough for some AI processing tasks, the timeout value can be further increased. However, it's important to balance user experience with processing time. If AI processing regularly takes longer than 60 seconds, consider implementing a more sophisticated solution such as:

1. Implementing a progress indicator to keep the user informed
2. Using WebSockets for real-time updates
3. Implementing a polling mechanism to check the status of long-running operations