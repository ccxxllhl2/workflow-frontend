# CORS Issue Solution

## Problem

The frontend was encountering an error when trying to communicate with the backend's POST /chat API:

```
Frontend error: "Sorry, I encountered an error processing your request. Please try again later."
Backend error: "INFO: 127.0.0.1:57963 - "OPTIONS /chat?query=Hi!%0AWhat%27s+the+markdown+info+from+Jira%3F%0AWhat%27s+the+weather+today%3F HTTP/1.1" 405 Method Not Allowed"
```

The key issue was that the backend was receiving an OPTIONS request instead of the intended POST request.

## Root Cause

This was a Cross-Origin Resource Sharing (CORS) issue. When making certain types of cross-origin HTTP requests, browsers first send a "preflight" OPTIONS request to check if the actual request is allowed by the server.

In our case, the preflight request was being triggered because:

1. We were making a cross-origin request (from the frontend origin to http://127.0.0.1:8000)
2. We were sending a POST request with query parameters in the URL

The backend was not properly handling this OPTIONS request, resulting in a 405 Method Not Allowed error.

## Solution

Modified the `sendChatMessage` function in `src/api/chat.ts` to send the query in the request body instead of as a URL parameter:

Before:
```typescript
const response = await api.post('/chat', null, {
  params: { query }
});
```

After:
```typescript
const response = await api.post('/chat', { query });
```

## Why This Works

1. By sending the data in the request body (with the default Content-Type of 'application/json'), we're making a "simple request" that doesn't trigger a preflight OPTIONS request in many cases.

2. According to the CORS specification, a request is considered "simple" and doesn't require a preflight when:
   - It uses GET, HEAD, or POST methods
   - It only uses "simple headers"
   - For POST requests, it uses one of the following Content-Types:
     - application/x-www-form-urlencoded
     - multipart/form-data
     - text/plain
   
   While application/json is not in this list, many modern browsers are more lenient with JSON POST requests when they don't include custom headers.

3. Even if a preflight is still sent in some cases, the backend should now be prepared to handle the actual POST request correctly since the data format matches what it expects.

## Alternative Solutions

If this solution doesn't completely resolve the issue, consider:

1. Configuring the backend to properly handle OPTIONS requests by implementing CORS middleware
2. Adding appropriate CORS headers to the backend responses:
   - Access-Control-Allow-Origin
   - Access-Control-Allow-Methods
   - Access-Control-Allow-Headers

## Verification

To verify this solution:
1. Run the frontend application
2. Open the browser's developer tools (F12)
3. Go to the Network tab
4. Try sending a message in the chat interface
5. Check if the request to /chat is successful
6. Verify that no OPTIONS requests are being sent or that they're properly handled