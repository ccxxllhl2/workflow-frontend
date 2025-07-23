import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getAgents, Agent } from '../api/agents';
import { useQuery } from '@tanstack/react-query';

const AgentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  
  // Fetch agents data using React Query
  const { 
    data: agents = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
  });

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId);
  };

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Agents Configuration
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search agents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {isLoading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading agents: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      )}
      
      {!isLoading && !isError && filteredAgents.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No agents found. {searchTerm ? 'Try adjusting your search.' : ''}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {!isLoading && filteredAgents.length > 0 ? (
          filteredAgents.map((agent, index) => (
            <Grid key={agent.id}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{agent.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Type: {agent.type}
                        </Typography>
                        <Typography variant="body1">{agent.description}</Typography>
                      </Box>
                      <IconButton onClick={() => toggleExpand(agent.id)}>
                        {expandedAgent === agent.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                    
                    <Collapse in={expandedAgent === agent.id}>
                      <Box mt={2}>
                        <Typography variant="subtitle1">Configuration:</Typography>
                        <pre style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '10px', 
                          borderRadius: '4px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(agent.config, null, 2)}
                        </pre>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
        ) : (
          !isLoading && searchTerm && (
            <Grid>
              <Typography align="center">No agents found matching your search criteria.</Typography>
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
};

export default AgentsPage;