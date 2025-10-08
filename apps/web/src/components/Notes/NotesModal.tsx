'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Card,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useDebounce } from '@/hooks/useDebounce';

// Constants
const MAX_CHARS = 2000;
const AUTO_SAVE_DELAY = 2000; // 2 seconds

// Study tips content
const STUDY_TIPS = [
  'Summarize key concepts in your own words',
  'Create mnemonics to remember important lists',
  'Note any questions you have for review',
  'Link concepts to real-world examples',
  'Highlight areas you find challenging',
];

// TypeScript Interfaces
export interface NotesModalProps {
  conceptSlug: string;
  conceptTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Note {
  id: string;
  userId: string;
  conceptId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesModalState {
  note: Note | null;
  content: string;
  initialContent: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  showDeleteConfirm: boolean;
}

/**
 * NotesModal Component
 * A full-screen modal for creating and managing personal notes on concepts
 *
 * Features:
 * - Auto-save functionality with debouncing
 * - Character counter with max length validation
 * - Study tips section for guidance
 * - Delete functionality with confirmation
 * - Keyboard navigation and accessibility
 * - Loading and error states
 */
export const NotesModal: React.FC<NotesModalProps> = memo(
  ({ conceptSlug, conceptTitle, isOpen, onClose }) => {
    const [state, setState] = useState<NotesModalState>({
      note: null,
      content: '',
      initialContent: '',
      loading: false,
      saving: false,
      error: null,
      saveStatus: 'idle',
      showDeleteConfirm: false,
    });

    // Debounce content for auto-save
    const debouncedContent = useDebounce(state.content, AUTO_SAVE_DELAY);

    // Fetch existing note when modal opens
    useEffect(() => {
      if (isOpen) {
        fetchNote();
      }
    }, [isOpen, conceptSlug]);

    // Auto-save when debounced content changes
    useEffect(() => {
      // Only auto-save if content has changed from initial and is not empty
      if (
        debouncedContent !== state.initialContent &&
        debouncedContent.trim().length > 0 &&
        !state.loading
      ) {
        saveNote(debouncedContent, true);
      }
    }, [debouncedContent]);

    /**
     * Fetch the existing note for this concept
     */
    const fetchNote = async (): Promise<void> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`/api/concepts/${conceptSlug}/notes`);

        if (response.status === 404) {
          // No existing note - that's OK
          setState(prev => ({
            ...prev,
            loading: false,
            note: null,
            content: '',
            initialContent: '',
          }));
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch note');
        }

        const note: Note = await response.json();
        setState(prev => ({
          ...prev,
          loading: false,
          note,
          content: note.content,
          initialContent: note.content,
        }));
      } catch (error) {
        console.error('Error fetching note:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load note',
        }));
      }
    };

    /**
     * Save note to server
     */
    const saveNote = async (
      contentToSave: string,
      isAutoSave: boolean = false
    ): Promise<void> => {
      // Don't save empty content
      if (contentToSave.trim().length === 0) {
        return;
      }

      setState(prev => ({ ...prev, saving: true, saveStatus: 'saving' }));

      try {
        const response = await fetch(`/api/concepts/${conceptSlug}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: contentToSave }),
        });

        if (!response.ok) {
          throw new Error('Failed to save note');
        }

        const savedNote: Note = await response.json();

        setState(prev => ({
          ...prev,
          saving: false,
          saveStatus: 'saved',
          note: savedNote,
          initialContent: contentToSave,
          error: null,
        }));

        // Clear "saved" status after 2 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, saveStatus: 'idle' }));
        }, 2000);
      } catch (error) {
        console.error('Error saving note:', error);
        setState(prev => ({
          ...prev,
          saving: false,
          saveStatus: 'error',
          error: isAutoSave
            ? 'Auto-save failed'
            : 'Failed to save note. Please try again.',
        }));
      }
    };

    /**
     * Handle manual save button click
     */
    const handleManualSave = (): void => {
      saveNote(state.content, false);
    };

    /**
     * Handle delete button click
     */
    const handleDeleteClick = (): void => {
      setState(prev => ({ ...prev, showDeleteConfirm: true }));
    };

    /**
     * Confirm and execute note deletion
     */
    const handleDeleteConfirm = async (): Promise<void> => {
      setState(prev => ({ ...prev, saving: true, showDeleteConfirm: false }));

      try {
        const response = await fetch(`/api/concepts/${conceptSlug}/notes`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete note');
        }

        // Reset state and close modal
        setState(prev => ({
          ...prev,
          note: null,
          content: '',
          initialContent: '',
          saving: false,
          error: null,
        }));
        onClose();
      } catch (error) {
        console.error('Error deleting note:', error);
        setState(prev => ({
          ...prev,
          saving: false,
          error: 'Failed to delete note. Please try again.',
        }));
      }
    };

    /**
     * Handle content change
     */
    const handleContentChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>
    ): void => {
      const newContent = event.target.value;
      // Enforce max length
      if (newContent.length <= MAX_CHARS) {
        setState(prev => ({ ...prev, content: newContent }));
      }
    };

    /**
     * Handle modal close
     */
    const handleClose = (): void => {
      // Reset state
      setState({
        note: null,
        content: '',
        initialContent: '',
        loading: false,
        saving: false,
        error: null,
        saveStatus: 'idle',
        showDeleteConfirm: false,
      });
      onClose();
    };

    /**
     * Handle ESC key press
     */
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent): void => {
        if (event.key === 'Escape' && !state.showDeleteConfirm) {
          handleClose();
        }
      },
      [state.showDeleteConfirm]
    );

    // Calculate character count and status
    const charCount = state.content.length;
    const isOverLimit = charCount > MAX_CHARS;
    const hasContent = state.content.trim().length > 0;
    const hasChanges = state.content !== state.initialContent;

    return (
      <>
        <Dialog
          open={isOpen}
          onClose={handleClose}
          fullScreen
          aria-labelledby="notes-modal-title"
          aria-describedby="notes-modal-description"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <DialogTitle
            id="notes-modal-title"
            sx={{
              bgcolor: '#2c5aa0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
              px: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                📝 Personal Notes
              </Typography>
              {state.saveStatus === 'saving' && (
                <Typography variant="caption" sx={{ ml: 2 }}>
                  Saving...
                </Typography>
              )}
              {state.saveStatus === 'saved' && (
                <Typography variant="caption" sx={{ ml: 2 }}>
                  ✓ Saved
                </Typography>
              )}
            </Box>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {/* Content */}
          <DialogContent
            id="notes-modal-description"
            sx={{ p: 3, bgcolor: '#f5f7fa' }}
          >
            {state.loading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 300,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
                {/* Error Alert */}
                {state.error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {state.error}
                  </Alert>
                )}

                {/* Concept Title */}
                <Typography
                  variant="h5"
                  sx={{ mb: 3, color: '#2c3e50', fontWeight: 600 }}
                >
                  {conceptTitle}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 3,
                    flexDirection: { xs: 'column', md: 'row' },
                  }}
                >
                  {/* Note Editor */}
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={12}
                      maxRows={20}
                      value={state.content}
                      onChange={handleContentChange}
                      placeholder="Start typing your notes here..."
                      variant="outlined"
                      inputProps={{
                        maxLength: MAX_CHARS,
                        'aria-label': 'Note content',
                      }}
                      sx={{
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '6px',
                          '& fieldset': {
                            borderColor: '#e1e7f0',
                            borderWidth: '2px',
                          },
                          '&:hover fieldset': {
                            borderColor: '#2c5aa0',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#2c5aa0',
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          lineHeight: 1.6,
                        },
                      }}
                    />

                    {/* Character Counter */}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        textAlign: 'right',
                        color: isOverLimit ? '#e17055' : '#6c757d',
                        fontSize: '0.9rem',
                      }}
                    >
                      {charCount}/{MAX_CHARS}
                    </Typography>
                  </Box>

                  {/* Tips Section */}
                  <Card
                    sx={{
                      width: { xs: '100%', md: 300 },
                      bgcolor: '#e8f0fe',
                      borderRadius: '6px',
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LightbulbIcon sx={{ color: '#2c5aa0', mr: 1 }} />
                      <Typography
                        variant="h6"
                        sx={{ color: '#2c5aa0', fontWeight: 600 }}
                      >
                        💡 Note-Taking Tips
                      </Typography>
                    </Box>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {STUDY_TIPS.map((tip, index) => (
                        <Typography
                          key={index}
                          component="li"
                          variant="body2"
                          sx={{ mb: 1, color: '#2c3e50' }}
                        >
                          {tip}
                        </Typography>
                      ))}
                    </Box>
                  </Card>
                </Box>
              </Box>
            )}
          </DialogContent>

          {/* Footer Actions */}
          <DialogActions
            sx={{
              p: 2,
              px: 3,
              bgcolor: 'white',
              borderTop: '1px solid #e1e7f0',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              {state.note && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                  disabled={state.saving}
                  sx={{ minHeight: 44 }}
                >
                  Delete Note
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={state.saving}
                sx={{ minHeight: 44 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={
                  state.saving ? <CircularProgress size={20} /> : <SaveIcon />
                }
                onClick={handleManualSave}
                disabled={
                  state.saving || !hasContent || !hasChanges || isOverLimit
                }
                sx={{
                  minHeight: 44,
                  bgcolor: '#2c5aa0',
                  '&:hover': {
                    bgcolor: '#234a85',
                  },
                }}
              >
                Save Notes
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={state.showDeleteConfirm}
          onClose={() =>
            setState(prev => ({ ...prev, showDeleteConfirm: false }))
          }
          aria-labelledby="delete-confirm-title"
        >
          <DialogTitle id="delete-confirm-title">Delete Note?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setState(prev => ({ ...prev, showDeleteConfirm: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
);

NotesModal.displayName = 'NotesModal';
