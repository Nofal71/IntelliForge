import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Chip,
  Snackbar,
} from '@mui/material';
import { Send as SendIcon, SmartToy, Person, Check, ContentCopy } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatbot } from '../../redux/useChatbot';
import { sendChatMessage, fetchModels, type Model } from '../../services/openrouter';
import { updateChat, getChat } from '../../services/firebase';
import { useAuth } from '../../context/Authcontext';
import type { SelectChangeEvent, SxProps, Theme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { nanoid } from '@reduxjs/toolkit';
import { collection, getDocs, getFirestore, where, query as firestoreQuery } from 'firebase/firestore';
import { ragService } from '../../services/ragService';
import { decryptAES256 } from '../../services/AES-256';

interface RAGProject {
  ragProjectId: string;
  name: string;
}

const Chats: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const { activeChat, createMessage, createBotMessage, selectChat, updateChat: updateChatState, updateBotMessage } = useChatbot();
  const { user, userData } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isSavingModel, setIsSavingModel] = useState<boolean>(false);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<null | string>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [ragProjects, setRAGProjects] = useState<RAGProject[]>([]);
  const navigate = useNavigate();
  const [decryptKey, setKey] = useState('')

  useEffect(() => {
    if (!user?.uid || !chatId) {
      setError('User not authenticated or invalid chat ID');
      return;
    }
    let isMounted = true;
    const loadProjectsAndChunks = async () => {
      const db = getFirestore();
      const projectsSnapshot = await getDocs(firestoreQuery(collection(db, 'ragProjects'), where('userId', '==', user.uid)));
      const projectList: RAGProject[] = projectsSnapshot.docs.map(doc => ({
        ragProjectId: doc.id,
        name: doc.data().name as string,
      }));
      if (isMounted) {
        setRAGProjects(projectList);
        setSelectedItems([...projectList.flatMap(e => e.ragProjectId)])
      }
    };
    
    const loadChat = async () => {
      if (!activeChat || activeChat.id !== chatId) {
        setIsLoadingChat(true);
        try {
          const chat = await getChat(user.uid, chatId);
          if (chat && isMounted) {
            updateChatState(chat);
            selectChat(chatId);
          } else {
            setError('Chat not found');
            navigate('/');
          }
        } catch (err) {
          console.error('Error loading chat:', err);
          setError('Failed to load chat');
        } finally {
          if (isMounted) setIsLoadingChat(false);
        }
      }
    };
    
    const loadModels = async () => {
      if (userData?.apiKey) {
        setIsLoadingModels(true);
        try {
          const fetchedModels = await fetchModels(decryptKey);
          if (isMounted) {
            setModels(fetchedModels);
            if (fetchedModels.length === 0) {
              setError('No models available. Verify API key in Settings.');
            }
          }
        } catch (err) {
          console.error('Error fetching models:', err);
          if (isMounted) setError('Failed to fetch models');
        } finally {
          if (isMounted) setIsLoadingModels(false);
        }
      } else {
        if (isMounted) setError('API key not set. Configure in Settings.');
      }
    };
    
    loadChat();
    loadModels();
    loadProjectsAndChunks();
    setKey(decryptAES256(userData?.apiKey))
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedItems(event.target.value as string[]);
  };

  useEffect(() => {
    if (models.length > 0) {
      if (activeChat?.model && activeChat.model !== 'default' && models.some(m => m.id === activeChat.model)) {
        setSelectedModel(activeChat.model);
      } else if (userData?.defaultModel && userData.defaultModel !== 'default' && models.some(m => m.id === userData.defaultModel)) {
        setSelectedModel(userData.defaultModel);
      } else if (models.length > 0) {
        setSelectedModel(models[0].id);
      } else {
        setSelectedModel('');
      }
    }
  }, [activeChat?.model, userData?.defaultModel, models]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [chatId, activeChat?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeChat || !user?.uid || !userData?.apiKey || !chatId || !selectedModel) {
      setError('Please select a model and ensure API key is set.');
      return;
    }
    const userInput = input;
    setInput('');
    setIsSending(true);
    setError('');
    try {
      const userMessageId = nanoid();
      createMessage(activeChat.id, userInput);
      const messages = [
        ...activeChat.messages.map((m: any) => ({
          role: m.type === 'user' ? 'user' : m.type === 'system' ? 'system' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userInput },
      ];
      const botMessageId = nanoid();
      let botMessageContent = '';
      createBotMessage(activeChat.id, botMessageContent, botMessageId);

      const selectedProjects = selectedItems.filter(item => ragProjects.some(p => p.ragProjectId === item));
      if (selectedProjects.length) {
        await ragService.generateRAGResponse(
          selectedProjects,
          userInput,
          decryptKey,
          selectedModel,
          user.uid,
          (chunk) => {
            botMessageContent += chunk;
            updateBotMessage(activeChat.id, botMessageContent, botMessageId);
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        );
      } else {
        const systemPrompt = activeChat.systemPrompt || userData?.systemPrompts?.[selectedModel]?.prompt || '';
        await sendChatMessage(decryptKey, selectedModel, messages, systemPrompt, (chunk) => {
          botMessageContent += chunk;
          updateBotMessage(activeChat.id, botMessageContent, botMessageId);
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }

      const updatedMessages = [
        ...activeChat.messages,
        {
          id: userMessageId,
          chatId: activeChat.id,
          content: userInput,
          type: 'user' as const,
          timestamp: new Date().toISOString(),
        },
        {
          id: botMessageId,
          chatId: activeChat.id,
          content: botMessageContent,
          type: 'bot' as const,
          timestamp: new Date().toISOString(),
        },
      ];
      const updatedChat = { ...activeChat, messages: updatedMessages, model: selectedModel };
      await updateChat(user.uid, chatId, updatedChat);
      updateChatState(updatedChat);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Your API key may be invalid or unpaid. Please check your API key in Settings.');
    } finally {
      setIsSending(false);
    }
  };


  const handleSaveModel = async (value: any) => {
    if (!user?.uid || !activeChat || !chatId) {
      return;
    }
    setIsSavingModel(true);
    setError('');
    try {
      const updatedChat = { ...activeChat, model: value };
      await updateChat(user.uid, chatId, updatedChat);
      updateChatState(updatedChat);
    } catch (err) {
      console.error('Error saving model:', err);
      setError('Failed to save model');
    } finally {
      setIsSavingModel(false);
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

  if (isLoadingChat) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {error && (
        <div>
          <Snackbar
            open={!!error}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              severity="error"
              sx={{
                mb: 2,
                bgcolor: '#fef2f2',
                color: '#b91c1c',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              {error || 'An unexpected error occurred.'}
            </Alert>
          </Snackbar>
        </div>
      )}
      {activeChat ? (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: '0',
              right: '0',
              left: 250,
              px: 10,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              gap: 1.5,
              backgroundColor: 'white',
              zIndex: 100
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: '#1a202c', flexGrow: 1, letterSpacing: '-0.02em' }}
            >
              {activeChat.title}
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                multiple
                value={selectedItems}
                onChange={handleSelectChange}
                displayEmpty
                variant="outlined"
                renderValue={(selected: string[]) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, color: selected.length > 0 ? 'black' : 'gray' }}>
                    {selected.length > 0
                      ? selected.map((value) => {
                        const project = ragProjects.find(p => p.ragProjectId === value);
                        return (
                          <Chip
                            key={value}
                            size='small'
                            label={project ? project.name : value}
                            sx={{ bgcolor: project ? '#d6edff' : '#f1e4ff', fontSize: '0.85rem', color: '#1f2937' }}
                          />
                        );
                      })
                      : 'Select Your Knowledge Base'}
                  </Box>
                )}
                size='small'
                sx={{
                  fontSize: '0.9rem',
                  bgcolor: '#f9fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                }}
              >
                <MenuItem value="" disabled>
                  Select Your Knowlage base
                </MenuItem>
                {
                  ragProjects.length > 0
                    ? ragProjects.map((project: RAGProject) => (
                      <MenuItem key={project.ragProjectId} value={project.ragProjectId} sx={{ fontSize: '0.9rem' }}>
                        Knowladge Base: {project.name}
                      </MenuItem>
                    ))
                    : (
                      null
                    )
                }
                {ragProjects.length === 0 && (
                  <MenuItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography sx={{ flexGrow: 1, fontSize: '0.95rem', color: '#6b7280' }}>
                        No Knowledge Base found.
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        <button
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 14px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            navigate('/knowledge-base');
                          }}
                        >
                          Create Knowledge Base
                        </button>
                      </Box>
                    </Box>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 140 }}>
              <Select
                size='small'
                value={selectedModel}
                onChange={e => handleSaveModel(e.target.value)}
                variant="outlined"
                disabled={isLoadingModels || isSavingModel}
                sx={{
                  fontSize: '0.9rem',
                  bgcolor: '#f9fafb',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d1d5db' },
                }}
              >
                <MenuItem value="" disabled>
                  Select Model
                </MenuItem>
                {isLoadingModels ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} /> Loading models...
                  </MenuItem>
                ) : models.length === 0 ? (
                  <MenuItem disabled>No models available</MenuItem>
                ) : (
                  models.map(model => (
                    <MenuItem key={model.id} value={model.id} sx={{ fontSize: '0.9rem' }}>
                      {model.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              p: 2.5,
              overflowY: 'auto',
              mt: 8,
              mb: 4
            }}
          >
            <AnimatePresence initial={false}>
              {activeChat.messages.map((message, index) => {
                const isCodeMessage = message.type === 'user' && (
                  message.content.trim().startsWith('```') ||
                  (message.content.trim().startsWith('`') && message.content.trim().endsWith('`'))
                );
                const codeContent = isCodeMessage
                  ? message.content.trim().replace(/^`{1,3}([^\n]*)\n?([\s\S]*?)`{0,3}$/, '$2')
                  : null;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      overflow: 'hidden',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        mb: 4,
                        maxWidth: '90%',
                        bgcolor: message.type === 'user' ? '#3b82f6' : '#f9fafb',
                        color: message.type === 'user' ? '#ffffff' : '#111827',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                        border: `1px solid ${message.type === 'user' ? '#3b82f6' : '#e5e7eb'}`,
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {message.type === 'user' ? (
                        <Person sx={{ fontSize: 20, color: '#ffffff', mt: 0.5 }} />
                      ) : (
                        <SmartToy sx={{ fontSize: 20, color: '#6b7280', mt: 0.5 }} />
                      )}
                      {message.type === 'user' && !isCodeMessage ? (
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            fontWeight: 400,
                            wordBreak: 'break-word',
                          }}
                        >
                          {message.content}
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            position: 'relative',
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            width: '100%',
                            '& p': { margin: '0 0 8px 0' },
                            '& h1, & h2, & h3, & h4, & h5, & h6': {
                              fontWeight: 600,
                              color: '#1f2937',
                              mt: 1.5,
                              mb: 1,
                            },
                            '& h1': { fontSize: '1.25rem' },
                            '& h2': { fontSize: '1.15rem' },
                            '& h3': { fontSize: '1.05rem' },
                            '& code': {
                              bgcolor: '#2d3748',
                              color: '#e2e8f0',
                              px: '6px',
                              py: '2px',
                              fontSize: '0.9rem',
                              fontFamily: '"JetBrains Mono", monospace',
                            },
                            '& pre': {
                              bgcolor: '#1f2937',
                              color: '#e2e8f0',
                              p: 2.5,
                              overflowX: 'auto',
                              fontSize: '0.9rem',
                              fontFamily: '"JetBrains Mono", monospace',
                              my: 2,
                            },
                            '& a': {
                              color: '#2563eb',
                              textDecoration: 'underline',
                              wordBreak: 'break-all',
                              '&:hover': {
                                color: '#1d4ed8',
                                textDecoration: 'none',
                              },
                            },
                            '& ul, & ol': {
                              pl: 4,
                              mb: 1.5,
                              color: '#374151',
                              '& li': {
                                mb: 0.5,
                              },
                            },
                            '& ul': {
                              listStyleType: 'disc',
                            },
                            '& ol': {
                              listStyleType: 'decimal',
                            },
                            '& blockquote': {
                              borderLeft: '4px solid #2563eb',
                              bgcolor: '#f9fafb',
                              color: '#374151',
                              pl: 2.5,
                              py: 1,
                              my: 1.5,
                              fontStyle: 'italic',
                            },
                            '& table': {
                              borderCollapse: 'collapse',
                              width: '100%',
                              my: 1.5,
                              border: '1px solid #e5e7eb',
                            },
                            '& th, & td': {
                              border: '1px solid #e5e7eb',
                              px: 1.5,
                              py: 1,
                              textAlign: 'left',
                            },
                            '& th': {
                              bgcolor: '#f3f4f6',
                              fontWeight: 600,
                              color: '#1f2937',
                            },
                            '& td': {
                              color: '#374151',
                            },
                            '& img': {
                              maxWidth: '100%',
                              my: 1.5,
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                            },
                            '& hr': {
                              border: 0,
                              borderTop: '1px solid #e5e7eb',
                              my: 2,
                            },
                            '& strong': {
                              fontWeight: 600,
                              color: '#1f2937',
                            },
                            '& em': {
                              fontStyle: 'italic',
                            },
                          }}
                        >
                          <Tooltip title={copied ? 'Copied!' : 'Copy entire message'} placement="top">
                            <IconButton
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(message.content);
                                  setCopied(message.id);
                                  setTimeout(() => setCopied(null), 2000);
                                } catch (err) {
                                  console.error('Failed to copy:', err);
                                }
                              }}
                              sx={{
                                position: 'absolute',
                                right: -23,
                                bottom: -50,
                                zIndex: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                color: 'gray',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                                },
                              }}
                            >
                              {
                                !isSending && (
                                  copied && copied === message.id
                                    ? <Check sx={{ height: 18, width: 18 }} fontSize="small" />
                                    : <ContentCopy sx={{ height: 18, width: 18 }} fontSize="small" />
                                )
                              }
                            </IconButton>
                          </Tooltip>

                          {message.content === '' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  bgcolor: '#2563eb',
                                  animation: 'bubbleLoader 1s infinite alternate',
                                  '@keyframes bubbleLoader': {
                                    '0%': { opacity: 0.3, transform: 'scale(1)' },
                                    '100%': { opacity: 1, transform: 'scale(1.3)' },
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  bgcolor: '#2563eb',
                                  animation: 'bubbleLoader 1s 0.2s infinite alternate',
                                  '@keyframes bubbleLoader': {
                                    '0%': { opacity: 0.3, transform: 'scale(1)' },
                                    '100%': { opacity: 1, transform: 'scale(1.3)' },
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  bgcolor: '#2563eb',
                                  animation: 'bubbleLoader 1s 0.4s infinite alternate',
                                  '@keyframes bubbleLoader': {
                                    '0%': { opacity: 0.3, transform: 'scale(1)' },
                                    '100%': { opacity: 1, transform: 'scale(1.3)' },
                                  },
                                }}
                              />
                            </Box>
                          ) : (
                            <ReactMarkdown
                              skipHtml={false}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                pre: ({ children }) => {
                                  const [copied, setCopied] = useState(false);
                                  let codeContent = '';
                                  if (Array.isArray(children) && children[0] && typeof children[0] === 'object' && 'props' in children[0]) {
                                    codeContent = (children[0] as any).props?.children || '';
                                  } else if (typeof children === 'object' && children && 'props' in children) {
                                    codeContent = (children as any).props?.children || '';
                                  }

                                  const handleCopy = async () => {
                                    try {
                                      await navigator.clipboard.writeText(codeContent);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    } catch (err) {
                                      console.error('Failed to copy code:', err);
                                    }
                                  };

                                  return (
                                    <Box sx={{ position: 'relative', my: 2 }}>
                                      <pre
                                        style={{
                                          background: '#1f2937',
                                          color: '#e2e8f0',
                                          padding: '20px',
                                          overflowX: 'auto',
                                          fontSize: '0.9rem',
                                          fontFamily: '"JetBrains Mono", monospace',
                                          margin: '10px',
                                          boxSizing: 'border-box',
                                          maxWidth: '95%'
                                        }}
                                      >
                                        {children}
                                      </pre>
                                      <Tooltip title={copied ? 'Copied!' : 'Copy code'} placement="top">
                                        <IconButton
                                          onClick={handleCopy}
                                          sx={{
                                            position: 'absolute',
                                            top: 20,
                                            right: 36,
                                            color: '#f9fafb',
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                                            p: 0.5,
                                          }}
                                        >
                                          {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  );
                                },
                              }}
                            >
                              {isCodeMessage ? codeContent : message.content}
                            </ReactMarkdown>
                          )}
                        </Box>
                      )}
                      {message.type === 'user' && isSending && index === activeChat.messages.length - 1 && (
                        <CircularProgress size={16} sx={{ color: '#ffffff', mt: 0.5, ml: 1 }} />
                      )}
                    </Paper>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </Box>
          <Box sx={{
            backgroundColor: '#f5f7fa',
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Box
              sx={{
                gap: 1,
                p: 1.5,
                display: 'flex',
                mb: 2,
                width: '70%',
                ml: 30
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
                size="small"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                sx={{
                  bgcolor: '#f9fafb',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#d1d5db' },
                    '&:hover fieldset': { borderColor: '#2563eb' },
                  },
                  '& .MuiInputBase-input': { fontSize: '0.95rem', color: '#1a202c' },
                }}
              />
              <IconButton
                color="primary"
                type="button"
                onClick={handleSend}
                disabled={isSending || !input.trim() || !selectedModel}
                sx={{
                  ...buttonSx,
                  bgcolor: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                  '&:disabled': {
                    bgcolor: '#bcd1fa',
                    color: '#e5e7eb',
                  },
                  ml: 1,
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>

        </>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: '#4b5563' }}
            >
              Select or create a chat to start
            </Typography>
          </motion.div>
        </Box>
      )}
    </Box>
  );
};

export default Chats;