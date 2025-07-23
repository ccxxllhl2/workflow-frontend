import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Grid,
  Paper,
  Chip,
  Stack,
  Button,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getWorkflowState, pollWorkflowState, WorkflowState, WorkflowNode as ApiWorkflowNode, WorkflowEdge as ApiWorkflowEdge } from '../api/state';

const WorkflowPage: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Initialize with empty nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert API data to ReactFlow format
  const convertApiDataToReactFlow = (data: WorkflowState) => {
    if (!data || !data.nodes || !data.edges) {
      return { nodes: [], edges: [] };
    }

    const rfNodes: Node[] = data.nodes.map((node: ApiWorkflowNode) => ({
      id: node.id,
      data: {
        label: node.label,
        status: node.status,
        agent: node.agent,
      },
      position: node.position,
      type: 'customNode',
    }));

    const rfEdges: Edge[] = data.edges.map((edge: ApiWorkflowEdge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    return { nodes: rfNodes, edges: rfEdges };
  };

  // Custom node component
  const CustomNode = ({ data }: { data: any }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'running':
          return '#2D7FF9'; // Primary blue
        case 'completed':
          return '#28A745'; // Success green
        case 'waiting':
          return '#FFC107'; // Warning yellow
        case 'error':
          return '#DC3545'; // Error red
        default:
          return '#6C757D'; // Gray
      }
    };

    return (
      <div
        style={{
          padding: '10px',
          borderRadius: '8px',
          background: 'white',
          border: `2px solid ${getStatusColor(data.status)}`,
          width: '180px',
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{data.label}</div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>{data.agent}</div>
        <Chip
          label={data.status}
          size="small"
          style={{
            backgroundColor: getStatusColor(data.status),
            color: 'white',
            marginTop: '5px',
          }}
        />
      </div>
    );
  };

  // Register custom node types
  const nodeTypes = {
    customNode: CustomNode,
  };

  // Fetch workflow state from API
  const fetchWorkflowState = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWorkflowState();
      const { nodes: rfNodes, edges: rfEdges } = convertApiDataToReactFlow(data);
      setNodes(rfNodes);
      setEdges(rfEdges);
      setLastUpdated(new Date(data.lastUpdated));
      setIsError(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching workflow state:', error);
      setIsError(true);
      setErrorMessage((error as Error)?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);

  // Set up polling for workflow state updates
  useEffect(() => {
    // Initial fetch
    fetchWorkflowState();

    // Set up polling if auto-refresh is enabled
    let stopPolling: (() => void) | null = null;
    
    if (autoRefresh) {
      stopPolling = pollWorkflowState((data) => {
        const { nodes: rfNodes, edges: rfEdges } = convertApiDataToReactFlow(data);
        setNodes(rfNodes);
        setEdges(rfEdges);
        setLastUpdated(new Date(data.lastUpdated));
      }, refreshInterval * 1000);
    }
    
    // Clean up polling when component unmounts or when autoRefresh/refreshInterval changes
    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, [autoRefresh, refreshInterval, setNodes, setEdges, fetchWorkflowState]);

  // Format the last updated time
  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Workflow State
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto-refresh"
              />
            </Grid>
            
            <Grid>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="refresh-interval-label">Interval</InputLabel>
                <Select
                  labelId="refresh-interval-label"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  label="Interval"
                  disabled={!autoRefresh}
                >
                  <MenuItem value={2}>2s</MenuItem>
                  <MenuItem value={5}>5s</MenuItem>
                  <MenuItem value={10}>10s</MenuItem>
                  <MenuItem value={30}>30s</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid>
              <Button 
                variant="outlined" 
                onClick={fetchWorkflowState}
                disabled={autoRefresh || isLoading}
              >
                {isLoading && !autoRefresh ? 'Refreshing...' : 'Refresh Now'}
              </Button>
            </Grid>
            
            <Grid />
            
            <Grid>
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatLastUpdated(lastUpdated)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading workflow state: {errorMessage || 'Unknown error'}
        </Alert>
      )}
      
      <Paper 
        elevation={2} 
        sx={{ 
          height: '500px', 
          mb: 3,
          overflow: 'hidden',
          borderRadius: 2,
          position: 'relative',
        }}
      >
        {isLoading && !autoRefresh && (
          <Box 
            position="absolute" 
            top="0" 
            left="0" 
            right="0" 
            bottom="0" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            bgcolor="rgba(255, 255, 255, 0.7)"
            zIndex={10}
          >
            <CircularProgress />
          </Box>
        )}
        
        {nodes.length === 0 && !isLoading && (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            height="100%"
          >
            <Typography color="text.secondary">
              No workflow data available
            </Typography>
          </Box>
        )}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </Paper>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status Legend
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip label="Running" sx={{ bgcolor: '#2D7FF9', color: 'white' }} />
            <Chip label="Completed" sx={{ bgcolor: '#28A745', color: 'white' }} />
            <Chip label="Waiting" sx={{ bgcolor: '#FFC107', color: 'white' }} />
            <Chip label="Error" sx={{ bgcolor: '#DC3545', color: 'white' }} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkflowPage;