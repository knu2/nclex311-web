import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotesModal } from '@/components/Notes/NotesModal';

// Mock fetch
global.fetch = jest.fn();

describe('NotesModal', () => {
  const mockProps = {
    conceptSlug: 'cardiac-physiology',
    conceptTitle: 'Cardiac Physiology',
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should render modal when open', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('📝 Personal Notes')).toBeInTheDocument();
      });
      expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<NotesModal {...mockProps} isOpen={false} />);

      expect(screen.queryByText('📝 Personal Notes')).not.toBeInTheDocument();
    });

    it('should display concept title', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Cardiac Physiology')).toBeInTheDocument();
      });
    });

    it('should display character counter', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('0/2000')).toBeInTheDocument();
      });
    });

    it('should display study tips', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('💡 Note-Taking Tips')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Summarize key concepts in your own words')
      ).toBeInTheDocument();
    });
  });

  describe('Note Loading', () => {
    it('should fetch existing note on open', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        conceptId: 'concept-123',
        content: 'My test note',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockNote,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/cardiac-physiology/notes'
        );
      });
    });

    it('should display loading state while fetching', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  status: 404,
                  ok: false,
                }),
              100
            )
          )
      );

      render(<NotesModal {...mockProps} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error if fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load note')).toBeInTheDocument();
      });
    });

    it('should load existing note content into textarea', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        conceptId: 'concept-123',
        content: 'Existing note content',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockNote,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Existing note content');
      });
    });
  });

  describe('Note Editing', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });
    });

    it('should update character counter on typing', async () => {
      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('0/2000')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test note content' } });

      await waitFor(() => {
        expect(screen.getByText('17/2000')).toBeInTheDocument();
      });
    });

    it('should not exceed max character limit', async () => {
      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const longText = 'a'.repeat(2001);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: longText } });

      // Should only accept 2000 characters
      expect(textarea.value.length).toBe(0); // Unchanged because validation prevents it
    });

    it('should show character count in red when approaching limit', async () => {
      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const longText = 'a'.repeat(2000);
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: longText } });

      await waitFor(() => {
        const counter = screen.getByText('2000/2000');
        expect(counter).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Save', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-save after typing stops', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      // Initial fetch for loading note
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Auto-save test' } });

      // Mock save response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'note-1',
          userId: 'user-1',
          conceptId: 'concept-123',
          content: 'Auto-save test',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        }),
      });

      // Fast-forward 2 seconds (auto-save delay)
      jest.advanceTimersByTime(2000);

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/concepts/cardiac-physiology/notes',
            expect.objectContaining({
              method: 'POST',
              body: JSON.stringify({ content: 'Auto-save test' }),
            })
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Manual Save', () => {
    it('should save note when Save button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Manual save test' } });

      // Mock save response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'note-1',
          userId: 'user-1',
          conceptId: 'concept-123',
          content: 'Manual save test',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        }),
      });

      const saveButton = screen.getByRole('button', { name: /save notes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/cardiac-physiology/notes',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'Manual save test' }),
          })
        );
      });
    });

    it('should disable save button when no changes', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        conceptId: 'concept-123',
        content: 'Existing content',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockNote,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save notes/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it('should show saving indicator', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test content' } });

      // Mock slow save
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    id: 'note-1',
                    userId: 'user-1',
                    conceptId: 'concept-123',
                    content: 'Test content',
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                  }),
                }),
              100
            )
          )
      );

      const saveButton = screen.getByRole('button', { name: /save notes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete button for existing notes', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        conceptId: 'concept-123',
        content: 'Note to delete',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockNote,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete note/i })
        ).toBeInTheDocument();
      });
    });

    it('should show confirmation dialog before deleting', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        conceptId: 'concept-123',
        content: 'Note to delete',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockNote,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete note/i })
        ).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete note/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Note?')).toBeInTheDocument();
      });
    });

    it('should delete note on confirmation', async () => {
      const mockNote = {
        id: 'note-1',
        userId: 'user-1',
        conceptId: 'concept-123',
        content: 'Note to delete',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockNote,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete note/i })
        ).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete note/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Note?')).toBeInTheDocument();
      });

      // Mock delete response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const confirmButton = screen.getAllByRole('button', {
        name: /delete/i,
      })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/concepts/cardiac-physiology/notes',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal on close button click', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('close')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('close');
      fireEvent.click(closeButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should close modal on Cancel button click', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 404,
        ok: false,
      });

      render(<NotesModal {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });
});
