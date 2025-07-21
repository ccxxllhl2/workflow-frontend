# API Update Documentation

## Chat API Update

### Change Summary
The backend API for chat functionality has been updated to use a standardized JSON body format:

```json
{
  "message": "string"
}
```

### Changes Made
1. Updated the comment in `src/api/chat.ts` to reflect that we're sending a "message" parameter in the request body.

### Implementation Details
The `sendChatMessage` function in `src/api/chat.ts` was already correctly implemented to send the message in the request body with the proper parameter name:

```typescript
const response = await api.post('/chat', { message });
```

This matches the backend API expectation of receiving a JSON body with a "message" field.

### Affected Files
- `src/api/chat.ts` - Updated comment to reflect correct parameter name

### No Changes Required
- `src/views/ChatView.tsx` - Already correctly using the sendChatMessage function with the proper parameter

### Testing
To verify the changes:
1. Run the frontend application
2. Open the browser's developer tools (F12)
3. Go to the Network tab
4. Send a message in the chat interface
5. Verify that the request to /chat includes a JSON body with a "message" field
6. Confirm that the response is properly handled by the application

### API Contract
The current API contract for the chat endpoint is:

**Request:**
- Method: POST
- Endpoint: /chat
- Body: 
  ```json
  {
    "message": "string"
  }
  ```

**Response:**
- Status: 200 OK
- Body:
  ```json
  {
    "message": "string",
    "content": "string"
  }
  ```

  Note: Additional properties may be present in the response.

The frontend application looks for either the "message" or "content" field in the response, with fallback text if neither is present.