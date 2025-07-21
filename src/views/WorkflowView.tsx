import React, { useState, useRef, useEffect } from 'react';
import { Typography, Space, Switch, Select, Button, Alert, Empty, Tag, Spin } from 'antd';
import G6 from '@antv/g6';
import { getWorkflowState, pollWorkflowState } from '../api/state';
import './WorkflowView.css';

const { Title } = Typography;
const { Option } = Select;

interface Node {
  id: string;
  label: string;
  status: string;
  agent: string;
  position: {
    x: number;
    y: number;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  lastUpdated: string;
}

const WorkflowView: React.FC = () => {
  // State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const refreshTimerRef = useRef<any>(null);

  // Computed
  const lastUpdatedFormatted = lastUpdated.toLocaleTimeString();

  // Fetch workflow state
  const fetchWorkflowState = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const data = await getWorkflowState();
      
      // If the API doesn't return position data, add default positions
      const processedNodes = data.nodes.map((node: Node, index: number) => ({
        ...node,
        position: node.position || { x: 100 + (index * 200), y: 100 }
      }));
      
      setNodes(processedNodes);
      setEdges(data.edges);
      setLastUpdated(new Date(data.lastUpdated));
      
      // Update graph
      updateGraph(processedNodes, data.edges);
    } catch (err) {
      console.error('Error fetching workflow state:', err);
      setError('Failed to fetch workflow state');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize graph
  const initGraph = () => {
    if (!graphContainerRef.current || graphRef.current) return;
    
    // Define node and edge styles
    G6.registerNode(
      'workflow-node',
      {
        draw(cfg: any, group: any) {
          const status = cfg.status || 'waiting';
          const width = 150;
          const height = 60;
          const radius = 8;
          
          // Get color based on status
          const getStatusColor = (status: string) => {
            switch (status) {
              case 'running': return '#1890ff';  // Blue
              case 'completed': return '#52c41a'; // Green
              case 'waiting': return '#faad14';   // Yellow
              case 'error': return '#f5222d';     // Red
              default: return '#d9d9d9';          // Gray
            }
          };
          
          const color = getStatusColor(status);
          
          // Create node shape
          const keyShape = group.addShape('rect', {
            attrs: {
              x: -width / 2,
              y: -height / 2,
              width,
              height,
              radius,
              fill: '#fff',
              stroke: color,
              lineWidth: 2,
              cursor: 'pointer',
              shadowColor: 'rgba(0,0,0,0.1)',
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowOffsetY: 0
            },
            name: 'node-keyshape'
          });
          
          // Add label
          group.addShape('text', {
            attrs: {
              text: cfg.label,
              x: 0,
              y: -10,
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'center',
              fill: '#333',
              cursor: 'pointer'
            },
            name: 'node-label'
          });
          
          // Add agent name
          group.addShape('text', {
            attrs: {
              text: cfg.agent,
              x: 0,
              y: 10,
              fontSize: 12,
              textAlign: 'center',
              fill: '#666',
              cursor: 'pointer'
            },
            name: 'node-agent'
          });
          
          // Add status indicator
          group.addShape('rect', {
            attrs: {
              x: -width / 2 + 10,
              y: height / 2 - 15,
              width: width - 20,
              height: 6,
              radius: 3,
              fill: '#f0f0f0'
            },
            name: 'status-bg'
          });
          
          // Status progress
          const progressWidth = status === 'completed' ? width - 20 : 
                               status === 'running' ? (width - 20) * 0.6 : 
                               status === 'waiting' ? 0 : 0;
          
          group.addShape('rect', {
            attrs: {
              x: -width / 2 + 10,
              y: height / 2 - 15,
              width: progressWidth,
              height: 6,
              radius: 3,
              fill: color
            },
            name: 'status-progress'
          });
          
          // Output text (placeholder)
          group.addShape('text', {
            attrs: {
              text: 'Agent output',
              x: 0,
              y: height / 2 + 5,
              fontSize: 10,
              opacity: 0.6,
              textAlign: 'center',
              fill: '#999',
              cursor: 'pointer'
            },
            name: 'node-output'
          });
          
          return keyShape;
        }
      },
      'single-node'
    );
    
    // Create graph instance
    graphRef.current = new G6.Graph({
      container: graphContainerRef.current,
      width: graphContainerRef.current.clientWidth,
      height: graphContainerRef.current.clientHeight,
      fitView: true,
      fitViewPadding: 50,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node']
      },
      defaultNode: {
        type: 'workflow-node'
      },
      defaultEdge: {
        style: {
          stroke: '#b7b7b7',
          lineWidth: 2,
          endArrow: {
            path: G6.Arrow.triangle(8, 10, 0),
            fill: '#b7b7b7'
          }
        },
        labelCfg: {
          autoRotate: true
        }
      },
      layout: {
        type: 'dagre',
        rankdir: 'LR',
        nodesep: 80,
        ranksep: 100
      }
    });
  };

  // Update graph with new data
  const updateGraph = (currentNodes: Node[], currentEdges: Edge[]) => {
    if (!graphRef.current) return;
    
    // Convert nodes and edges to G6 format
    const graphData = {
      nodes: currentNodes.map(node => ({
        id: node.id,
        label: node.label,
        status: node.status,
        agent: node.agent,
        x: node.position.x,
        y: node.position.y
      })),
      edges: currentEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      }))
    };
    
    // Update graph data
    graphRef.current.data(graphData);
    graphRef.current.render();
    graphRef.current.fitView();
  };

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
    
    return () => stopAutoRefresh();
  }, [autoRefresh, refreshInterval]);

  const startAutoRefresh = () => {
    stopAutoRefresh();
    
    // Use the API polling function
    refreshTimerRef.current = pollWorkflowState((data: WorkflowState) => {
      // Process the data
      const processedNodes = data.nodes.map((node, index) => ({
        ...node,
        position: node.position || { x: 100 + (index * 200), y: 100 }
      }));
      
      setNodes(processedNodes);
      setEdges(data.edges);
      setLastUpdated(new Date(data.lastUpdated));
      
      // Update graph
      updateGraph(processedNodes, data.edges);
    }, refreshInterval * 1000);
  };

  const stopAutoRefresh = () => {
    if (refreshTimerRef.current) {
      // Call the stop function returned by pollWorkflowStateAPI
      refreshTimerRef.current();
      refreshTimerRef.current = null;
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current && !graphRef.current.destroyed && graphContainerRef.current) {
        graphRef.current.changeSize(
          graphContainerRef.current.clientWidth,
          graphContainerRef.current.clientHeight
        );
        graphRef.current.fitView();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current && !graphRef.current.destroyed) {
        graphRef.current.destroy();
      }
    };
  }, []);

  // Initialize graph and fetch initial data
  useEffect(() => {
    initGraph();
    fetchWorkflowState();
    
    return () => {
      stopAutoRefresh();
      if (graphRef.current && !graphRef.current.destroyed) {
        graphRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <Title level={4}>Workflow Execution</Title>
        
        <div className="workflow-controls">
          <Space>
            <Switch
              checked={autoRefresh}
              onChange={setAutoRefresh}
              checkedChildren="Auto-refresh On"
              unCheckedChildren="Auto-refresh Off"
            />
            
            <Select
              value={refreshInterval}
              onChange={setRefreshInterval}
              style={{ width: 100 }}
              disabled={!autoRefresh}
            >
              <Option value={2}>2s</Option>
              <Option value={5}>5s</Option>
              <Option value={10}>10s</Option>
              <Option value={30}>30s</Option>
            </Select>
            
            <Button 
              type="primary" 
              loading={isLoading} 
              disabled={autoRefresh}
              onClick={fetchWorkflowState}
            >
              Refresh Now
            </Button>
          </Space>
          
          <span className="last-updated">
            Last updated: {lastUpdatedFormatted}
          </span>
        </div>
      </div>
      
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <div className="workflow-graph-container">
        {isLoading && !autoRefresh && (
          <div className="loading-overlay">
            <Spin size="large" />
          </div>
        )}
        
        {nodes.length === 0 && !isLoading ? (
          <Empty description="No workflow data available" />
        ) : (
          <div className="workflow-graph" ref={graphContainerRef}></div>
        )}
      </div>
      
      <div className="workflow-legend">
        <Title level={5}>Status Legend</Title>
        <Space>
          <Tag color="processing">Running</Tag>
          <Tag color="success">Completed</Tag>
          <Tag color="warning">Waiting</Tag>
          <Tag color="error">Error</Tag>
        </Space>
      </div>
    </div>
  );
};

export default WorkflowView;