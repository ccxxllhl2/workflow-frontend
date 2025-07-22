import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, CircularProgress } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { getWorkflowState, pollWorkflowState, WorkflowApiResponse } from '../../api/state.js';

interface WorkflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({ isOpen, onClose }) => {
  const [workflowData, setWorkflowData] = useState<WorkflowApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

  // Start polling when the sidebar is opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Start polling the workflow state
      const stop = pollWorkflowState((state) => {
        console.log('State received in WorkflowSidebar:', state);
        // Check if state has originalData (from state.ts) or use state directly (from state.js)
        if (state) {
          if (state.originalData) {
            console.log('Setting workflowData with originalData:', state.originalData);
            setWorkflowData(state.originalData);
          } else {
            console.log('Setting workflowData with state directly:', state);
            setWorkflowData(state as unknown as WorkflowApiResponse);
          }
        } else {
          console.log('No state received:', state);
        }
        setIsLoading(false);
      }); // Using default 1 second interval
      
      setStopPolling(() => stop);
    } else {
      // Stop polling when the sidebar is closed
      if (stopPolling) {
        stopPolling();
        setStopPolling(null);
      }
    }
    
    // Clean up polling when component unmounts
    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, [isOpen]);

  // Sort nodes by timestamp
  const getSortedNodes = () => {
    if (!workflowData || !workflowData.Nodes) {
      console.log('No workflowData or Nodes:', workflowData);
      return [];
    }
    
    console.log('Nodes before processing:', Object.entries(workflowData.Nodes));
    
    // Define a type guard function to check if nodeData is a valid object with required properties
    const isValidNodeData = (data: any): data is { status: string; timestamp: number; message: string } => {
      return data && typeof data === 'object' && 'timestamp' in data;
    };
    
    // Process all nodes, adding default values for missing properties
    const processedNodes = Object.entries(workflowData.Nodes)
      .map(([nodeName, nodeData]) => {
        // If nodeData is empty or missing properties, provide defaults
        if (!nodeData || typeof nodeData !== 'object') {
          console.log('Empty node data for:', nodeName);
          return [nodeName, { 
            status: 'waiting', 
            timestamp: 0, 
            message: 'Waiting to be processed' 
          }];
        }
        
        // Check if the node object is empty (no properties)
        if (Object.keys(nodeData).length === 0) {
          console.log('Empty object for node:', nodeName);
          return [nodeName, { 
            status: 'waiting', 
            timestamp: 0, 
            message: 'Waiting to be processed' 
          }];
        }
        
        // Ensure all required properties exist
        const processedData = {
          ...nodeData,
          status: nodeData.status || 'waiting',
          timestamp: nodeData.timestamp || 0,
          message: nodeData.message || 'No message available'
        };
        
        return [nodeName, processedData];
      });
    
    console.log('Nodes after processing:', processedNodes);
    
    // Filter out nodes that we don't want to display (optional)
    const filteredNodes = processedNodes.filter(([_, nodeData]) => {
      // You can add conditions here if needed
      return true; // Display all nodes
    });
    
    // Create a properly typed array for sorting and mapping
    const typedNodes = filteredNodes.map(([nodeName, nodeData]) => {
      // Ensure nodeData is treated as an object with the required properties
      if (isValidNodeData(nodeData)) {
        return [nodeName, nodeData] as [string, { status: string; timestamp: number; message: string }];
      }
      // Fallback for any non-conforming data
      return [nodeName, { 
        status: 'waiting', 
        timestamp: 0, 
        message: 'Invalid data format' 
      }] as [string, { status: string; timestamp: number; message: string }];
    });
    
    return typedNodes
      .sort(([_key1, a], [_key2, b]) => a.timestamp - b.timestamp) // Sort by timestamp
      .map(([nodeName, nodeData]) => ({
        name: nodeName,
        ...nodeData
      }));
  };

  const sortedNodes = getSortedNodes();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '300px',
            height: '100vh',
            zIndex: 1000,
            backgroundColor: '#fff',
            boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 2,
              borderBottom: '1px solid #eee'
            }}
          >
            <Typography variant="h6">AI Workflow</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Content */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              padding: 2
            }}
          >
            {isLoading && !workflowData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ position: 'relative' }}>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <Box sx={{ marginBottom: 2, padding: 1, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                    <Typography variant="caption" component="div">
                      WorkflowState: {workflowData?.WorkflowState || 'None'}
                    </Typography>
                    <Typography variant="caption" component="div">
                      Nodes count: {workflowData?.Nodes ? Object.keys(workflowData.Nodes).length : 0}
                    </Typography>
                    <Typography variant="caption" component="div">
                      Sorted nodes count: {sortedNodes.length}
                    </Typography>
                  </Box>
                )}
                
                {/* Vertical line connecting nodes */}
                {sortedNodes.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '25px',
                      top: '30px',
                      bottom: '10px',
                      width: '2px',
                      backgroundColor: '#ddd',
                      zIndex: 0
                    }}
                  />
                )}
                
                {/* Nodes */}
                <AnimatePresence>
                  {sortedNodes.map((node, index) => (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      style={{ marginBottom: '20px', position: 'relative' }}
                    >
                      {/* Node circle */}
                      <motion.div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          zIndex: 1,
                          border: node.status === 'running' ? '2px solid #2196f3' : 
                                  node.status === 'finished' || node.status === 'completed' ? '2px solid #4caf50' : 'none',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <Typography variant="subtitle1">{node.name.charAt(0)}</Typography>
                        {/* Status indicator */}
                        {node.status && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: '-5px',
                              right: '-5px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: 
                                node.status === 'running' ? '#2196f3' : 
                                node.status === 'finished' || node.status === 'completed' ? '#4caf50' : 
                                node.status === 'error' ? '#f44336' : '#ffc107',
                              border: '2px solid white',
                              zIndex: 2
                            }}
                          />
                        )}
                      </motion.div>
                      
                      {/* Message bubble */}
                      <Paper
                        elevation={1}
                        sx={{
                          padding: 2,
                          marginLeft: '60px',
                          marginTop: '-40px',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9',
                          maxWidth: '220px'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {node.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                              color: 'white',
                              backgroundColor: 
                                node.status === 'running' ? '#2196f3' : 
                                node.status === 'finished' || node.status === 'completed' ? '#4caf50' : 
                                node.status === 'error' ? '#f44336' : '#ffc107',
                            }}
                          >
                            {node.status}
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {node.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {node.timestamp ? new Date(node.timestamp * 1000).toLocaleTimeString() : 'No timestamp'}
                          </Typography>
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {sortedNodes.length === 0 && workflowData && (
                  <Typography variant="body2" sx={{ textAlign: 'center', padding: 4, color: 'text.secondary' }}>
                    No workflow nodes available yet. Waiting for data...
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          {/* Footer */}
          <Box
            sx={{
              padding: 2,
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Status: {workflowData?.WorkflowState || (isLoading ? 'Loading...' : 'Waiting for data...')}
            </Typography>
            {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkflowSidebar;