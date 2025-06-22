import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  TextField,
  ListItem,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Menu as MenuIcon, Analytics, Edit, LibraryBooks, Person, MoreVert, Settings } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useNavigate } from 'react-router-dom';
import { useChatbot } from '../../redux/useChatbot';
import { deleteChat, getChats, saveChat, updateChatTitle } from '../../services/firebase';
import { useAuth } from '../../context/Authcontext';
import type { SxProps, Theme } from '@mui/material';
import { nanoid } from '@reduxjs/toolkit';
import type { EditChatTitleDialogProps } from '../../types';

const EditChatTitleDialog: React.FC<EditChatTitleDialogProps> = ({ open, chatId, onClose, chats }) => {
  const { user } = useAuth();
  const { updateChat: updateChatState } = useChatbot();
  const [newTitle, setNewTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!user?.uid || !chatId || !newTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }
    setIsUpdating(true);
    setError('');
    try {
      await updateChatTitle(user.uid, chatId, newTitle.trim());
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        updateChatState({ ...chat, title: newTitle.trim() });
      }
      onClose();
      setNewTitle('')
    } catch (err) {
      console.error('Error updating chat title:', err);
      setError('Failed to update title');
    } finally {
      setIsUpdating(false);
    }
  };

  const buttonSx: SxProps<Theme> = {
    fontSize: '0.9rem',
    fontWeight: 600,
    textTransform: 'none',
    padding: '8px 16px',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: 'primary.dark',
      transform: 'translateY(-1px)',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          boxShadow: 'none',
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, color: '#1a202c' }}>Edit Chat Title</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#4b5563', mb: 2 }}>
          Enter a new title for your chat.
        </DialogContentText>
        <TextField
          fullWidth
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Chat title"
          error={!!error}
          helperText={error}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#d1d5db' },
              '&:hover fieldset': { borderColor: '#2563eb' },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          type='button'
          disabled={isUpdating}
          sx={{ color: '#6b7280' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          color="primary"
          variant="contained"
          type='button'
          disabled={isUpdating || !newTitle.trim()}
          startIcon={isUpdating ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ ...buttonSx, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const Layout: React.FC = () => {
  const { user, userData } = useAuth();
  const { chats, createChat, selectChat, activeChatId, deleteChat: deleteChatState } = useChatbot();
  const navigate = useNavigate();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [chatToEdit, setChatToEdit] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 600;
      setIsMobile(mobile);
      setOpenDrawer(!mobile);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadChats = async () => {
    if (!user?.uid) return;
    try {
      const fetchedChats = await getChats(user.uid);
      fetchedChats.forEach(chat => {
        if (!chats.some(c => c.id === chat.id)) {
          createChat({
            id: chat.id,
            title: chat.title || `Chat ${chats.length + 1}`,
            model: chat.model || 'default',
            systemPrompt: chat.systemPrompt || '',
            messages: chat.messages || [],
          });
        }
      });
    } catch (err) {
      console.error('Error loading chats:', err);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const handleCreateChat = async () => {
    if (!user?.uid || !userData) {
      console.error('User not authenticated or userData missing');
      return;
    }
    const model = userData.defaultModel && userData.defaultModel !== 'default' ? userData.defaultModel : 'default';
    const systemPrompt = userData.systemPrompts?.[model]?.prompt || '';
    const id = nanoid();
    const newChat = {
      title: `Chat ${chats.length + 1}`,
      model,
      systemPrompt,
      messages: [],
      id,
    };
    try {
      const savePayload = createChat(newChat);
      await saveChat(user.uid, savePayload);
      selectChat(savePayload.id);
      navigate(`/chats/${savePayload.id}`);
      if (isMobile) setOpenDrawer(false);
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const handleOpenDeleteDialog = (chatId: string) => {
    setChatToDelete(chatId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setChatToDelete(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!user || !chatToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChat(user.uid, chatToDelete);
      deleteChatState(chatToDelete);
      handleCloseDeleteDialog();
      if (isMobile) setOpenDrawer(false);
    } catch (err) {
      console.error('Error deleting chat:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrawerClose = () => {
    setOpenDrawer(false);
  };

  const buttonSx: SxProps<Theme> = {
    fontSize: '0.9rem',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: 'primary.dark',
      transform: 'translateY(-1px)',
    },
  };
  
  const drawerWidth = isMobile ? '80%' : 280;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f7fa' }}>
      {isMobile && (
        <Box sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1300 }}>
          <IconButton
            onClick={() => setOpenDrawer(true)}
            sx={{
              bgcolor: '#ffffff',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#f0f2f5' },
            }}
          >
            <MenuIcon color="primary" />
          </IconButton>
        </Box>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={openDrawer}
        elevation={0}
        onClose={handleDrawerClose}
        sx={{
          width: drawerWidth,
          borderRadius:0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: '#ffffff',
            // borderRight: '1px solid #e0e4e8',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            boxShadow: 'none',
          },
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e4e8' }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#1a202c', letterSpacing: '-0.02em' }}
          >
            TeamRouter
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1 }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<AddIcon />}
              type='button'
              onClick={handleCreateChat}
              sx={{
                ...buttonSx,
                bgcolor: '#2563eb',
                color: '#ffffff',
                boxShadow: 'none',
              }}
            >
              New Chat
            </Button>
          </motion.div>
        </Box>
        <Divider sx={{ my: 1, borderColor: '#e0e4e8' }} />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
          <List>
            <AnimatePresence>
              {chats.map(chat => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListItemButton
                    onClick={() => {
                      selectChat(chat.id);
                      navigate(`/chats/${chat.id}`);
                      if (isMobile) setOpenDrawer(false);
                    }}
                    selected={chat.id === activeChatId}
                    sx={{
                      borderRadius: '8px',
                      mb: 0.5,
                      py: 1,
                      px: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&.Mui-selected': {
                        bgcolor: '#e3f2fd',
                        '&:hover': { bgcolor: '#dbeafe' },
                      },
                      '&:hover': { bgcolor: '#f9fafb' },
                    }}
                  >
                    <ListItemText
                      primary={chat.title}
                      sx={{
                        color: '#374151',
                        '& .MuiTypography-root': { fontSize: '0.95rem', fontWeight: 500 },
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            setChatToEdit(chat.id);
                            setOpenEditDialog(true);
                          }}
                          sx={{ color: '#6b7280', '&:hover': { color: '#2563eb' } }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenDeleteDialog(chat.id);
                          }}
                          sx={{ color: '#6b7280', '&:hover': { color: '#ef4444' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </motion.div>
                    </Box>
                  </ListItemButton>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Box>
        <Divider sx={{ borderColor: '#e0e4e8' }} />

        <EditChatTitleDialog
          open={openEditDialog}
          chatId={chatToEdit}
          onClose={() => {
            setOpenEditDialog(false);
            setChatToEdit(null);
          }}
          chats={chats}
        />

        <Box sx={{ p: 1, bgcolor: '#ffffff', borderRadius: '12px',  }}>
          <List>
            {[
              { icon: <LibraryBooks />, label: 'Knowledge Base', path: '/knowledge-base ' },
            ].map(item => (
              <ListItemButton
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setOpenDrawer(false);
                }}
                sx={{
                  borderRadius: '8px',
                  py: 1.2,
                  px: 2,
                  mb: 0.5,
                  color: '#374151',
                  '&:hover': { bgcolor: '#f9fafb' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {item.icon}
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
            <ListItem sx={{ borderRadius: '8px', py: 1.2, px: 2, mb: 0.5, '&:hover': { bgcolor: '#f9fafb' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <ListItemButton
                  onClick={() => {
                    navigate('/user');
                    if (isMobile) setOpenDrawer(false);
                  }}
                  sx={{
                    py:1,
                    px:0,
                    flexGrow: 1,
                    borderRadius: '8px',
                    color: '#374151',
                    '&:hover': { bgcolor: 'transparent' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Person sx={{ fontSize: 20 }} />
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                      Profile
                    </Typography>
                  </Box>
                </ListItemButton>
                <Select
                  value=""
                  displayEmpty
                  onChange={(e) => {
                    if (e.target.value) {
                      navigate(e.target.value as string);
                      if (isMobile) setOpenDrawer(false);
                    }
                  }}
                  renderValue={() => <MoreVert sx={{ fontSize: 20, color: '#374151' }} />}
                  sx={{
                    width:'25px',
                    bgcolor: 'transparent',
                    '& .MuiSelect-select': { p: 0, display: 'flex', alignItems: 'center' ,  },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': { bgcolor: '#f9fafb' },
                    '& .MuiSelect-icon': { display: 'none' },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: '8px',
                        boxShadow: 'none',
                        mt: 1,
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled sx={{ display: 'none' }} />
                  {[
                    { icon: <Analytics sx={{ fontSize: 18 }} />, label: 'Analytics', path: '/analytics' },
                    { icon: <Settings sx={{ fontSize: 18 }} />, label: 'Settings', path: '/settings' },
                  ].map(item => (
                    <MenuItem
                      key={item.label}
                      value={item.path}
                      sx={{ py: 1, px: 2, gap: 1.5, color: '#374151', '&:hover': { bgcolor: '#f9fafb' } }}
                    >
                      {item.icon}
                      <Typography sx={{ fontSize: '0.95rem' }}>
                        {item.label}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </ListItem>
          </List>
        </Box>

      </Drawer>
      <Box
        sx={{
          flexGrow: 1,
          p: isMobile ? 2 : 3,
          overflowY: 'auto',
          bgcolor: '#f5f7fa',
          mt: isMobile ? 7 : 0,
        }}
      >
        <Outlet />
      </Box>
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: 'none',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a202c' }}>
          Delete Chat
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#4b5563' }}>
            Are you sure you want to delete this chat? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            color="inherit"
            disabled={isDeleting}
            type='button'
            sx={{ color: '#6b7280', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            type='button'
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ ...buttonSx, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;