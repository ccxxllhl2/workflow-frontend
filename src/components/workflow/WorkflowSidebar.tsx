import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, CircularProgress, Button, Menu, MenuItem } from '@mui/material';
import { Close as CloseIcon, History as HistoryIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { pollWorkflowState, WorkflowApiResponse } from '../../api/state';
import { updateWorkflowData } from '../../api/chat';

interface WorkflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
}

interface WorkflowHistoryRecord {
  timestamp: string;
  workflowData: WorkflowApiResponse;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({ isOpen, onClose, onWidthChange }) => {
  const [workflowData, setWorkflowData] = useState<WorkflowApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('workflowSidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 300;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [historyMenuAnchor, setHistoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryRecord[]>(() => {
    const savedHistory = localStorage.getItem('workflowHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Start polling when the sidebar is opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Start polling the workflow state
      const stop = pollWorkflowState((state) => {
        //console.log('State received in WorkflowSidebar:', state);
        // Check if state has originalData (from state.ts) or use state directly (from state.ts)
        if (state) {
          let currentWorkflowData: WorkflowApiResponse;
          
          if (state.originalData) {
            //console.log('Setting workflowData with originalData:', state.originalData);
            currentWorkflowData = state.originalData;
            // 更新共享的工作流数据
            updateWorkflowData(state.originalData);
          } else {
            //console.log('Setting workflowData with state directly:', state);
            currentWorkflowData = state as unknown as WorkflowApiResponse;
            // 更新共享的工作流数据
            updateWorkflowData(currentWorkflowData);
          }
          
          // Handle different WorkflowState conditions
          if (currentWorkflowData.WorkflowState === 'Init') {
            // Clear workflow display for Init state
            setWorkflowData({
              WorkflowState: 'Init',
              Nodes: {},
              Response: []
            });
          } else if (currentWorkflowData.WorkflowState === 'Running') {
            // Continue current behavior for Running state
            setWorkflowData(currentWorkflowData);
          } else if (currentWorkflowData.WorkflowState === 'Finished') {
            // Store workflow record with timestamp for Finished state
            setWorkflowData(currentWorkflowData);
            
            // Save to history if not already saved
            const timestamp = new Date().toISOString();
            const newRecord: WorkflowHistoryRecord = {
              timestamp,
              workflowData: currentWorkflowData
            };
            
            setWorkflowHistory(prevHistory => {
              // Check if this record already exists (avoid duplicates)
              const exists = prevHistory.some(record => 
                JSON.stringify(record.workflowData) === JSON.stringify(currentWorkflowData)
              );
              
              if (!exists) {
                const updatedHistory = [...prevHistory, newRecord];
                localStorage.setItem('workflowHistory', JSON.stringify(updatedHistory));
                return updatedHistory;
              }
              return prevHistory;
            });
          } else {
            // Default behavior for other states
            setWorkflowData(currentWorkflowData);
          }
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

  // Notify parent component of width changes
  useEffect(() => {
    if (onWidthChange) {
      onWidthChange(isOpen ? sidebarWidth : 0);
    }
  }, [isOpen, sidebarWidth, onWidthChange]);

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 250 && newWidth <= 600) { // Min 250px, Max 600px
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('workflowSidebarWidth', sidebarWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  // Handle history menu
  const handleHistoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setHistoryMenuAnchor(event.currentTarget);
  };

  const handleHistoryMenuClose = () => {
    setHistoryMenuAnchor(null);
  };

  // Download workflow history record
  const downloadHistoryRecord = (record: WorkflowHistoryRecord) => {
    const dataStr = JSON.stringify(record.workflowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${new Date(record.timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleHistoryMenuClose();
  };

  // Sort nodes by timestamp
  const getSortedNodes = () => {
    if (!workflowData || !workflowData.Nodes) {
      //console.log('No workflowData or Nodes:', workflowData);
      return [];
    }
    
    //console.log('Nodes before processing:', Object.entries(workflowData.Nodes));
    
    // Define a type guard function to check if nodeData is a valid object with required properties
    const isValidNodeData = (data: any): data is { status: string; timestamp: number; message: string } => {
      return data && typeof data === 'object' && 'timestamp' in data;
    };
    
    // Process all nodes, adding default values for missing properties
    const processedNodes = Object.entries(workflowData.Nodes)
      .map(([nodeName, nodeData]) => {
        // If nodeData is empty or missing properties, provide defaults
        if (!nodeData || typeof nodeData !== 'object') {
          //console.log('Empty node data for:', nodeName);
          return [nodeName, { 
            status: 'waiting', 
            timestamp: 0, 
            message: 'Waiting to be processed' 
          }];
        }
        
        // Check if the node object is empty (no properties)
        if (Object.keys(nodeData).length === 0) {
          //console.log('Empty object for node:', nodeName);
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
    
    //console.log('Nodes after processing:', processedNodes);
    
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

  //console.log('Sorted nodes:', sortedNodes);

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
            width: `${sidebarWidth}px`,
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
                  {sortedNodes.filter(node=>node?.timestamp).map((node, index) => (
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
                          maxWidth: `${sidebarWidth - 80}px` // Adapt to sidebar width with 80px margin for spacing
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon />}
              onClick={handleHistoryMenuOpen}
              disabled={workflowHistory.length === 0}
              sx={{ textTransform: 'none' }}
            >
              Workflow History ({workflowHistory.length})
            </Button>
            {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Box>
          
          {/* History Menu */}
          <Menu
            anchorEl={historyMenuAnchor}
            open={Boolean(historyMenuAnchor)}
            onClose={handleHistoryMenuClose}
            PaperProps={{
              style: {
                maxHeight: 300,
                width: '300px',
              },
            }}
          >
            {workflowHistory.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  No workflow history available
                </Typography>
              </MenuItem>
            ) : (
              workflowHistory.map((record, index) => (
                <MenuItem
                  key={index}
                  onClick={() => downloadHistoryRecord(record)}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Nodes: {Object.keys(record.workflowData.Nodes || {}).length} | 
                    State: {record.workflowData.WorkflowState}
                  </Typography>
                  <Typography variant="caption" color="primary">
                    Click to download
                  </Typography>
                </MenuItem>
              ))
            )}
          </Menu>
          
          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '4px',
              height: '100%',
              backgroundColor: isResizing ? '#1976d2' : 'transparent',
              cursor: 'ew-resize',
              zIndex: 1001,
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkflowSidebar;