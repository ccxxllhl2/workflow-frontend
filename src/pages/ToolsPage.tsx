import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  Collapse,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, ExpandMore, ExpandLess, Code as CodeIcon, Storage as StorageIcon, Language as LanguageIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getTools, Tool } from '../api/tools';
import { useQuery } from '@tanstack/react-query';

const ToolsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  
  // Fetch tools data using React Query
  const { 
    data: tools = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['tools'],
    queryFn: getTools,
  });

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (toolId: string) => {
    setExpandedTool(expandedTool === toolId ? null : toolId);
  };

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data':
        return <StorageIcon fontSize="small" />;
      case 'web':
        return <LanguageIcon fontSize="small" />;
      case 'code':
        return <CodeIcon fontSize="small" />;
      default:
        return undefined; // Return undefined instead of null for type compatibility
    }
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
        Tools Configuration
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search tools..."
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
          Error loading tools: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      )}
      
      {!isLoading && !isError && filteredTools.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No tools found. {searchTerm ? 'Try adjusting your search.' : ''}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {!isLoading && filteredTools.length > 0 ? (
          filteredTools.map((tool, index) => (
            <Grid item xs={12} key={tool.id}>
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
                        <Typography variant="h6">{tool.name}</Typography>
                        <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                          <Chip 
                            icon={getCategoryIcon(tool.category)} 
                            label={tool.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </Stack>
                        <Typography variant="body1">{tool.description}</Typography>
                      </Box>
                      <IconButton onClick={() => toggleExpand(tool.id)}>
                        {expandedTool === tool.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                    
                    <Collapse in={expandedTool === tool.id}>
                      <Box mt={2}>
                        <Typography variant="subtitle1">Configuration:</Typography>
                        <pre style={{ 
                          backgroundColor: '#f5f5f5', 
                          padding: '10px', 
                          borderRadius: '4px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(tool.config, null, 2)}
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
            <Grid item xs={12}>
              <Typography align="center">No tools found matching your search criteria.</Typography>
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
};

export default ToolsPage;