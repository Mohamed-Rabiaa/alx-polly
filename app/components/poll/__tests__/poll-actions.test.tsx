import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { Poll as PollActions } from '../poll-actions'
import { createSupabaseBrowserClient } from '../../../lib/supabase'
import { useToast } from '../../ui/use-toast'

// Mock the dependencies
const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
}

const mockToast = jest.fn()

const mockSupabase = {
  from: jest.fn(() => ({
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}))

jest.mock('../../../lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn(() => mockSupabase),
}))

jest.mock('../../ui/use-toast', () => ({
  useToast: jest.fn(() => ({ toast: mockToast })),
}))

describe('Poll Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProps = {
    pollId: 'test-poll-id',
    pollCreatorId: 'creator-id',
    currentUserId: 'current-user-id',
  }

  describe('Rendering', () => {
    it('renders edit and delete buttons when user is authenticated', () => {
      render(<PollActions {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('does not render when currentUserId is undefined', () => {
      render(<PollActions {...defaultProps} currentUserId={undefined} />)
      
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })

    it('renders with correct button styles and icons', () => {
      render(<PollActions {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      
      expect(editButton).toHaveClass('flex', 'items-center')
      expect(deleteButton).toHaveClass('flex', 'items-center')
    })
  })

  describe('Edit Functionality', () => {
    it('navigates to edit page when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<PollActions {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/polls/test-poll-id/edit')
    })
  })

  describe('Delete Functionality', () => {
    it('opens confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<PollActions {...defaultProps} />)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
    })

    it('shows cancel and delete poll buttons in confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<PollActions {...defaultProps} />)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete poll/i })).toBeInTheDocument()
    })

    it('successfully deletes poll and shows success toast', async () => {
      const user = userEvent.setup()
      const onPollDeleted = jest.fn()
      
      render(<PollActions {...defaultProps} onPollDeleted={onPollDeleted} />)
      
      // Open confirmation dialog
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete poll/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('polls')
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Poll deleted',
          description: 'Your poll has been successfully deleted.',
        })
        expect(onPollDeleted).toHaveBeenCalled()
      })
    })

    it('calls router.refresh when onPollDeleted is not provided', async () => {
      const user = userEvent.setup()
      
      render(<PollActions {...defaultProps} />)
      
      // Open confirmation dialog
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete poll/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled()
      })
    })

    it('handles delete error and shows error toast', async () => {
      const user = userEvent.setup()
      const deleteError = new Error('Delete failed')
      
      // Mock Supabase to return an error
      const mockSupabaseWithError = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: deleteError })),
          })),
        })),
      }
      ;(createSupabaseBrowserClient as jest.Mock).mockReturnValue(mockSupabaseWithError)
      
      render(<PollActions {...defaultProps} />)
      
      // Open confirmation dialog
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete poll/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to delete the poll. Please try again.',
          variant: 'destructive',
        })
      })
    })

    it('shows loading state during deletion', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      const mockSupabaseWithDelay = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))),
          })),
        })),
      }
      ;(createSupabaseBrowserClient as jest.Mock).mockReturnValue(mockSupabaseWithDelay)
      
      render(<PollActions {...defaultProps} />)
      
      // Open confirmation dialog
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete poll/i })
      await user.click(confirmButton)
      
      // Wait for loading state
    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument()
    })
    
    // Check that the delete action button shows loading state
    const deletingButton = screen.getByRole('button', { name: /deleting/i })
    expect(deletingButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })

    it('disables buttons during deletion', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      const mockSupabaseWithDelay = {
        from: jest.fn(() => ({
          delete: jest.fn(() => ({
            eq: jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))),
          })),
        })),
      }
      ;(createSupabaseBrowserClient as jest.Mock).mockReturnValue(mockSupabaseWithDelay)
      
      render(<PollActions {...defaultProps} />)
      
      // Open confirmation dialog
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete poll/i })
      await user.click(confirmButton)
      
      // Check that the delete action button shows loading state
      const deletingButton = screen.getByRole('button', { name: /deleting/i })
      expect(deletingButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })
  })

  describe('Props Validation', () => {
    it('works with all required props', () => {
      render(<PollActions {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('works with optional onPollDeleted callback', () => {
      const onPollDeleted = jest.fn()
      render(<PollActions {...defaultProps} onPollDeleted={onPollDeleted} />)
      
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })
})