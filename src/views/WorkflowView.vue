<template>
  <div class="workflow-container">
    <div class="workflow-header">
      <a-typography-title :level="4">Workflow Execution</a-typography-title>
      
      <div class="workflow-controls">
        <a-space>
          <a-switch
            v-model:checked="autoRefresh"
            checked-children="Auto-refresh On"
            un-checked-children="Auto-refresh Off"
          />
          
          <a-select
            v-model:value="refreshInterval"
            style="width: 100px"
            :disabled="!autoRefresh"
          >
            <a-select-option :value="2">2s</a-select-option>
            <a-select-option :value="5">5s</a-select-option>
            <a-select-option :value="10">10s</a-select-option>
            <a-select-option :value="30">30s</a-select-option>
          </a-select>
          
          <a-button 
            type="primary" 
            :loading="isLoading" 
            :disabled="autoRefresh"
            @click="fetchWorkflowState"
          >
            Refresh Now
          </a-button>
        </a-space>
        
        <span class="last-updated">
          Last updated: {{ lastUpdatedFormatted }}
        </span>
      </div>
    </div>
    
    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      style="margin-bottom: 16px"
    />
    
    <div class="workflow-graph-container">
      <div v-if="isLoading && !autoRefresh" class="loading-overlay">
        <a-spin size="large" />
      </div>
      
      <template v-if="nodes.length === 0 && !isLoading">
        <a-empty description="No workflow data available" />
      </template>
      
      <template v-else>
        <div class="workflow-graph" ref="graphContainer"></div>
      </template>
    </div>
    
    <div class="workflow-legend">
      <a-typography-title :level="5">Status Legend</a-typography-title>
      <a-space>
        <a-tag color="processing">Running</a-tag>
        <a-tag color="success">Completed</a-tag>
        <a-tag color="warning">Waiting</a-tag>
        <a-tag color="error">Error</a-tag>
      </a-space>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import G6 from '@antv/g6'
import { getWorkflowState as fetchWorkflowStateAPI, pollWorkflowState as pollWorkflowStateAPI } from '../api/state'

// State
const autoRefresh = ref(true)
const refreshInterval = ref(5)
const isLoading = ref(false)
const error = ref('')
const lastUpdated = ref(new Date())
const nodes = ref([])
const edges = ref([])
const graphContainer = ref(null)
let graph = null
let refreshTimer = null

// Computed
const lastUpdatedFormatted = computed(() => {
  return lastUpdated.value.toLocaleTimeString()
})

// Fetch workflow state
const fetchWorkflowState = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const data = await fetchWorkflowStateAPI()
    
    // If the API doesn't return position data, add default positions
    const processedNodes = data.nodes.map((node, index) => ({
      ...node,
      position: node.position || { x: 100 + (index * 200), y: 100 }
    }))
    
    nodes.value = processedNodes
    edges.value = data.edges
    lastUpdated.value = new Date(data.lastUpdated)
    
    // Update graph
    updateGraph()
  } catch (err) {
    console.error('Error fetching workflow state:', err)
    error.value = 'Failed to fetch workflow state'
  } finally {
    isLoading.value = false
  }
}

// Initialize graph
const initGraph = () => {
  if (!graphContainer.value) return
  
  // Define node and edge styles
  G6.registerNode(
    'workflow-node',
    {
      draw(cfg, group) {
        const status = cfg.status || 'waiting'
        const width = 150
        const height = 60
        const radius = 8
        
        // Get color based on status
        const getStatusColor = (status) => {
          switch (status) {
            case 'running': return '#1890ff'  // Blue
            case 'completed': return '#52c41a' // Green
            case 'waiting': return '#faad14'   // Yellow
            case 'error': return '#f5222d'     // Red
            default: return '#d9d9d9'          // Gray
          }
        }
        
        const color = getStatusColor(status)
        
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
        })
        
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
        })
        
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
        })
        
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
        })
        
        // Status progress
        const progressWidth = status === 'completed' ? width - 20 : 
                             status === 'running' ? (width - 20) * 0.6 : 
                             status === 'waiting' ? 0 : 0
        
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
        })
        
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
        })
        
        return keyShape
      }
    },
    'single-node'
  )
  
  // Create graph instance
  graph = new G6.Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
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
  })
  
  // Handle window resize
  const handleResize = () => {
    if (graph && !graph.destroyed) {
      graph.changeSize(
        graphContainer.value.clientWidth,
        graphContainer.value.clientHeight
      )
      graph.fitView()
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // Clean up on component unmount
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    if (graph && !graph.destroyed) {
      graph.destroy()
    }
  })
}

// Update graph with new data
const updateGraph = () => {
  if (!graph || graph.destroyed) return
  
  // Convert nodes and edges to G6 format
  const graphData = {
    nodes: nodes.value.map(node => ({
      id: node.id,
      label: node.label,
      status: node.status,
      agent: node.agent,
      x: node.position.x,
      y: node.position.y
    })),
    edges: edges.value.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    }))
  }
  
  // Update graph data
  graph.data(graphData)
  graph.render()
  graph.fitView()
}

// Set up auto-refresh
watch(autoRefresh, (newValue) => {
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

watch(refreshInterval, () => {
  if (autoRefresh.value) {
    stopAutoRefresh()
    startAutoRefresh()
  }
})

const startAutoRefresh = () => {
  stopAutoRefresh()
  
  // Use the API polling function
  refreshTimer = pollWorkflowStateAPI((data) => {
    // Process the data
    const processedNodes = data.nodes.map((node, index) => ({
      ...node,
      position: node.position || { x: 100 + (index * 200), y: 100 }
    }))
    
    nodes.value = processedNodes
    edges.value = data.edges
    lastUpdated.value = new Date(data.lastUpdated)
    
    // Update graph
    updateGraph()
  }, refreshInterval.value * 1000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    // Call the stop function returned by pollWorkflowStateAPI
    refreshTimer()
    refreshTimer = null
  }
}

// Lifecycle hooks
onMounted(() => {
  // Initialize graph
  initGraph()
  
  // Fetch initial data
  fetchWorkflowState()
  
  // Start auto-refresh if enabled
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.workflow-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.workflow-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.last-updated {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.workflow-graph-container {
  flex: 1;
  min-height: 400px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  position: relative;
  margin-bottom: 16px;
}

.workflow-graph {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.workflow-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background-color: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .workflow-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .workflow-controls {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>