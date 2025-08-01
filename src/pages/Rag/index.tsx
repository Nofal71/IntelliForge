import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { InfoOutlined, Delete } from '@mui/icons-material';
import { useAuth } from '../../context/Authcontext';
import { ragService } from '../../services/ragService';
import { getFirestore, collection, query as firestoreQuery, where, getDocs } from 'firebase/firestore';
import { deleteRAGProject } from '../../services/firebase';

interface RAGProject {
  ragProjectId: string;
  name: string;
}

const RAGInterface: React.FC = () => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [ragProjects, setRAGProjects] = useState<RAGProject[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingProject, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }
    let isMounted = true;

    const loadProjects = async () => {
      const db = getFirestore();
      const projectsSnapshot = await getDocs(firestoreQuery(collection(db, 'ragProjects'), where('userId', '==', user.uid)));
      const projectList: RAGProject[] = projectsSnapshot.docs.map(doc => ({
        ragProjectId: doc.id,
        name: doc.data().name as string,
      }));
      if (isMounted) {
        setRAGProjects(projectList);
        if (projectList.length > 0) setSelectedProject(projectList[0].ragProjectId);
      }
    };

    loadProjects().catch(err => setError('Failed to load projects: ' + err.message));

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setError(null);
      }, 4000);
    }
  }, [error]);

  const handleCreateProject = async () => {
    if (!user?.uid || !projectName) {
      setError('Project name required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { ragProjectId, name } = await ragService.saveRAGProjectToFirebase(user.uid, projectName);
      setRAGProjects([...ragProjects, { ragProjectId, name }]);
      setSelectedProject(ragProjectId);
      setProjectName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user?.uid || !selectedProject || files.length === 0) {
      setError('Select a Knowledge Base and at least one file');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await ragService.processDocuments(user.uid, selectedProject, files);
      if (!response) {
        setError('Failed Uploading: Character limit exceeded or invalid files');
        return;
      }
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed Uploading');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!user?.uid) return;
    setDeleting(projectId)
    try {
      await deleteRAGProject(user.uid, projectId);
      setRAGProjects(ragProjects.filter(project => project.ragProjectId !== projectId));
    } catch (error) {
      setError('Failed to delete Knowledge Base');
      console.error(error);
    } finally {
      setDeleting(null)
    }
  };

  if (!user) {
    return <Alert severity="error">Please sign in to use Knowledge Base</Alert>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: { xs: 4, sm: 8 }, px: { xs: 2, sm: 6 } }}>
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            sx={{
              bgcolor: '#fee2e2',
              color: '#b91c1c',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
            }}
          >
            {error || 'An unexpected error occurred.'}
          </Alert>
        </Snackbar>
      )}
      {/* Introductory Section */}
      <Paper
        sx={{
          maxWidth: { xs: '100%', sm: 900 },
          mx: 'auto',
          p: { xs: 2, sm: 4 },
          mb: { xs: 4, sm: 6 },
          borderRadius: '16px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h4"
            sx={{
              color: '#111827',
              fontWeight: 700,
              mr: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Welcome to Your Knowledge Base
          </Typography>
          <Tooltip title="Learn how to manage your Knowledge Bases for personalized AI interactions." arrow>
            <IconButton size="small" sx={{ color: '#6b7280' }}>
              <InfoOutlined fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: '#374151',
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
            lineHeight: 1.7,
            mb: 2,
          }}
        >
          Create and manage your Knowledge Bases by uploading documents to provide context for AI-powered responses. Organize your files into Knowledge Bases and use them to enhance the accuracy and relevance of your interactions.
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#6b7280',
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            fontStyle: 'italic',
          }}
        >
          Start by creating a Knowledge Base and uploading your .txt files below.
        </Typography>
      </Paper>

      <Box sx={{ maxWidth: { xs: '100%', sm: 900 }, mx: 'auto', display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
        {/* Create Knowledge Base */}
        <Paper
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{
                color: '#111827',
                fontWeight: 600,
                mr: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Create Knowledge Base
            </Typography>
            <Tooltip title="Create a new Knowledge Base to organize your documents." arrow>
              <IconButton size="small" sx={{ color: '#6b7280' }}>
                <InfoOutlined fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            label="Knowledge Base Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
            sx={{
              mb: { xs: 2, sm: 3 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': { borderColor: '#d1d5db' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.85rem', sm: '1rem' } },
              '& .MuiInputBase-input': { fontSize: { xs: '0.85rem', sm: '1rem' } },
            }}
          />
          <Button
            variant="contained"
            onClick={handleCreateProject}
            disabled={loading || !projectName}
            sx={{
              bgcolor: '#3b82f6',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              width: { xs: '100%', sm: 'auto' },
              '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-1px)' },
              '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
            }}
          >
            Create Knowledge Base
          </Button>
        </Paper>

        {/* Upload Documents */}
        <Paper
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{
                color: '#111827',
                fontWeight: 600,
                mr: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Upload Documents
            </Typography>
            <Tooltip title="Upload one or more .txt files to your selected Knowledge Base." arrow>
              <IconButton size="small" sx={{ color: '#6b7280' }}>
                <InfoOutlined fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            select
            label="Select Knowledge Base"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            fullWidth
            sx={{
              mb: { xs: 2, sm: 3 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                '& fieldset': { borderColor: '#d1d5db' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': { fontSize: { xs: '0.85rem', sm: '1rem' } },
              '& .MuiInputBase-input': { fontSize: { xs: '0.85rem', sm: '1rem' } },
            }}
            SelectProps={{
              native: false,
              displayEmpty: true,
            }}
          >
            <MenuItem value="" disabled>
              Select a Knowledge Base
            </MenuItem>
            {ragProjects.map((project) => (
              <MenuItem
                key={project.ragProjectId}
                value={project.ragProjectId}
                sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}
              >
                {project.name}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <input
              type="file"
              accept=".txt,.pdf"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              style={{
                display: 'block',
                width: '100%',
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={loading || files.length === 0 || !selectedProject}
            sx={{
              bgcolor: '#3b82f6',
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              width: { xs: '100%', sm: 'auto' },
              '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-1px)' },
              '&:disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' },
            }}
          >
            Upload Documents
          </Button>
        </Paper>

        {/* Knowledge Base List */}
        <Paper
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: '16px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h5"
              sx={{
                color: '#111827',
                fontWeight: 600,
                mr: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Your Knowledge Bases
            </Typography>
            <Tooltip title="View and manage your Knowledge Bases." arrow>
              <IconButton size="small" sx={{ color: '#6b7280' }}>
                <InfoOutlined fontSize="small" sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </IconButton>
            </Tooltip>
          </Box>
          {ragProjects.length === 0 ? (
            <Typography
              variant="body1"
              sx={{
                color: '#6b7280',
                fontStyle: 'italic',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              No Knowledge Bases created yet. Create one above!
            </Typography>
          ) : (
            <List sx={{ bgcolor: '#f9fafb', borderRadius: '8px', p: { xs: 0.5, sm: 1 } }}>
              {ragProjects.map((project) => (
                <ListItem
                  key={project.ragProjectId}
                  sx={{
                    borderBottom: '1px solid #e2e8f0',
                    py: { xs: 1.5, sm: 2 },
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                >
                  <ListItemText
                    primary={project.name}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: '#111827',
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Delete Knowledge Base" arrow>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(project.ragProjectId)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': { bgcolor: '#fee2e2' },
                          p: { xs: 0.5, sm: 1 },
                        }}
                      >
                        {deletingProject && deletingProject === project.ragProjectId ? (
                          <CircularProgress size={24} sx={{ color: '#ef4444' }} />
                        ) : (
                          <Delete sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, sm: 4 } }}>
          <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
        </Box>
      )}
    </Box>
  );
};

export default RAGInterface;