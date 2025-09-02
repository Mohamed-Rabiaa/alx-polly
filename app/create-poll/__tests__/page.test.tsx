import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CreatePollPageContent from '../page'
import { useAuth } from '../../context/auth-context'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import { useToast } from '../../components/ui/use-toast'

// Mock the dependencies
const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
}

const mockToast = jest.fn()

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { id: 'poll-123', title: 'Test Poll', description: 'Test Description' }, 
          error: null 
        })),
      })),
    })),
  })),
}

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}))

jest.mock('../../context/auth-context', () => ({
  useAuth: jest.fn(() => ({ user: mockUser })),
}))

jest.mock('../../lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn(() => mockSupabase),
}))

jest.mock('../../components/ui/use-toast', () => ({
  useToast: jest.fn(() => ({ toast: mockToast })),
}))

// Mock the Header component
jest.mock('../../components/layout/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

// Mock the withAuth HOC
jest.mock('../../components/auth/with-auth', () => ({
  withAuth: (Component: React.ComponentType) => Component,
}))

describe('Create Poll Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the create poll form correctly', () => {
      render(<CreatePollPageContent />)
      
      expect(screen.getByText('Create New Poll')).toBeInTheDocument()
      expect(screen.getByText('Design your poll and start gathering responses')).toBeInTheDocument()
      expect(screen.getByLabelText('Poll Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument()
      expect(screen.getByText('Poll Options')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create poll/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
    })

    it('renders initial poll options', () => {
      render(<CreatePollPageContent />)
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i)
      expect(optionInputs).toHaveLength(2)
      expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('allows adding new poll options', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      const addOptionButton = screen.getByRole('button', { name: /add option/i })
      await user.click(addOptionButton)
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i)
      expect(optionInputs).toHaveLength(3)
      expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument()
    })

    it('allows removing poll options when more than 2 exist', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      // Add a third option first
      const addOptionButton = screen.getByRole('button', { name: /add option/i })
      await user.click(addOptionButton)
      
      // Now remove buttons should be visible
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      expect(removeButtons).toHaveLength(3)
      
      // Remove one option
      await user.click(removeButtons[0])
      
      const optionInputs = screen.getAllByPlaceholderText(/option \d+/i)
      expect(optionInputs).toHaveLength(2)
    })

    it('does not show remove buttons when only 2 options exist', () => {
      render(<CreatePollPageContent />)
      
      const removeButtons = screen.queryAllByRole('button', { name: /remove/i })
      expect(removeButtons).toHaveLength(0)
    })

    it('updates form fields correctly', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      const titleInput = screen.getByLabelText('Poll Title')
      const descriptionInput = screen.getByLabelText('Description (Optional)')
      const option1Input = screen.getByPlaceholderText('Option 1')
      const option2Input = screen.getByPlaceholderText('Option 2')
      
      await user.type(titleInput, 'Test Poll Title')
      await user.type(descriptionInput, 'Test Description')
      await user.type(option1Input, 'Option A')
      await user.type(option2Input, 'Option B')
      
      expect(titleInput).toHaveValue('Test Poll Title')
      expect(descriptionInput).toHaveValue('Test Description')
      expect(option1Input).toHaveValue('Option A')
      expect(option2Input).toHaveValue('Option B')
    })
  })

  describe('Preview Functionality', () => {
    it('shows preview modal when preview button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      // Fill in some data
      await user.type(screen.getByLabelText('Poll Title'), 'Preview Test')
      await user.type(screen.getByLabelText('Description (Optional)'), 'Preview Description')
      await user.type(screen.getByPlaceholderText('Option 1'), 'Preview Option 1')
      await user.type(screen.getByPlaceholderText('Option 2'), 'Preview Option 2')
      
      const previewButton = screen.getByRole('button', { name: /preview/i })
      await user.click(previewButton)
      
      // Check if preview modal is shown
      expect(screen.getByText('Preview Test')).toBeInTheDocument()
      expect(screen.getByText('Preview Description')).toBeInTheDocument()
      expect(screen.getByText('Preview Option 1')).toBeInTheDocument()
      expect(screen.getByText('Preview Option 2')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close preview/i })).toBeInTheDocument()
    })

    it('closes preview modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      // Fill in data and open preview
      await user.type(screen.getByLabelText('Poll Title'), 'Preview Test')
      const previewButton = screen.getByRole('button', { name: /preview/i })
      await user.click(previewButton)
      
      // Close preview
      const closeButton = screen.getByRole('button', { name: /close preview/i })
      await user.click(closeButton)
      
      // Preview should be closed
      expect(screen.queryByRole('button', { name: /close preview/i })).not.toBeInTheDocument()
    })
  })

  describe('Poll Creation - Success Scenarios', () => {
    it('creates poll successfully and shows success message', async () => {
      const user = userEvent.setup()
      
      // Mock successful poll creation
      const mockPollInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'poll-123', title: 'Test Poll', description: 'Test Description' }, 
            error: null 
          })),
        })),
      }))
      
      const mockOptionsInsert = jest.fn(() => Promise.resolve({ error: null }))
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'polls') {
          return { insert: mockPollInsert }
        }
        if (table === 'poll_options') {
          return { insert: mockOptionsInsert }
        }
        return { insert: jest.fn() }
      })
      
      render(<CreatePollPageContent />)
      
      // Fill in the form
      await user.type(screen.getByLabelText('Poll Title'), 'Test Poll')
      await user.type(screen.getByLabelText('Description (Optional)'), 'Test Description')
      await user.type(screen.getByPlaceholderText('Option 1'), 'Option A')
      await user.type(screen.getByPlaceholderText('Option 2'), 'Option B')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Wait for the success toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'success',
          title: 'Success',
          description: 'Poll created successfully!'
        })
      })
      
      // Check if redirected to polls page
      expect(mockRouter.push).toHaveBeenCalledWith('/polls')
      
      // Check if form is reset
      expect(screen.getByLabelText('Poll Title')).toHaveValue('')
      expect(screen.getByLabelText('Description (Optional)')).toHaveValue('')
    })

    it('calls Supabase with correct data', async () => {
      const user = userEvent.setup()
      
      const mockPollInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'poll-123' }, 
            error: null 
          })),
        })),
      }))
      
      const mockOptionsInsert = jest.fn(() => Promise.resolve({ error: null }))
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'polls') {
          return { insert: mockPollInsert }
        }
        if (table === 'poll_options') {
          return { insert: mockOptionsInsert }
        }
        return { insert: jest.fn() }
      })
      
      render(<CreatePollPageContent />)
      
      // Fill in the form
      await user.type(screen.getByLabelText('Poll Title'), 'Test Poll')
      await user.type(screen.getByLabelText('Description (Optional)'), 'Test Description')
      await user.type(screen.getByPlaceholderText('Option 1'), 'Option A')
      await user.type(screen.getByPlaceholderText('Option 2'), 'Option B')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Verify poll data
      await waitFor(() => {
        expect(mockPollInsert).toHaveBeenCalledWith({
          title: 'Test Poll',
          description: 'Test Description',
          user_id: 'user-123'
        })
      })
      
      // Verify options data
      await waitFor(() => {
        expect(mockOptionsInsert).toHaveBeenCalledWith([
          { poll_id: 'poll-123', option_text: 'Option A' },
          { poll_id: 'poll-123', option_text: 'Option B' }
        ])
      })
    })
  })

  describe('Poll Creation - Error Scenarios', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks()
      // Ensure user is authenticated for error scenarios (except auth test)
      ;(useAuth as jest.Mock).mockReturnValue({ user: mockUser })
    })

    it('shows error message when user is not authenticated', async () => {
      const user = userEvent.setup()
      
      // Mock no user
      ;(useAuth as jest.Mock).mockReturnValue({ user: null })
      
      render(<CreatePollPageContent />)
      
      // Fill in the form
      await user.type(screen.getByLabelText('Poll Title'), 'Test Poll')
      await user.type(screen.getByPlaceholderText('Option 1'), 'Option A')
      await user.type(screen.getByPlaceholderText('Option 2'), 'Option B')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Check for authentication error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to create a poll.'
        })
      })
    })

    it('shows error message when poll creation fails', async () => {
      const user = userEvent.setup()
      
      // Mock poll creation error
      const mockPollInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Database connection failed' } 
          })),
        })),
      }))
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'polls') {
          return { insert: mockPollInsert }
        }
        return { insert: jest.fn() }
      })
      
      render(<CreatePollPageContent />)
      
      // Fill in the form
      await user.type(screen.getByLabelText('Poll Title'), 'Test Poll')
      await user.type(screen.getByPlaceholderText('Option 1'), 'Option A')
      await user.type(screen.getByPlaceholderText('Option 2'), 'Option B')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Check for error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Error creating poll: Database connection failed'
        })
      })
    })

    it('shows error message when poll options creation fails', async () => {
      const user = userEvent.setup()
      
      // Mock successful poll creation but failed options creation
      const mockPollInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'poll-123' }, 
            error: null 
          })),
        })),
      }))
      
      const mockOptionsInsert = jest.fn(() => Promise.resolve({ 
        error: { message: 'Options creation failed' } 
      }))
      
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'polls') {
          return { insert: mockPollInsert }
        }
        if (table === 'poll_options') {
          return { insert: mockOptionsInsert }
        }
        return { insert: jest.fn() }
      })
      
      render(<CreatePollPageContent />)
      
      // Fill in the form
      await user.type(screen.getByLabelText('Poll Title'), 'Test Poll')
      await user.type(screen.getByPlaceholderText('Option 1'), 'Option A')
      await user.type(screen.getByPlaceholderText('Option 2'), 'Option B')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Check for error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Error creating poll options. Please try again.'
        })
      })
    })
  })

  describe('Form Validation', () => {
    it('requires poll title to be filled', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      // Try to submit without title
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Form should not submit (HTML5 validation)
      const titleInput = screen.getByLabelText('Poll Title')
      expect(titleInput).toBeInvalid()
    })

    it('requires poll options to be filled', async () => {
      const user = userEvent.setup()
      render(<CreatePollPageContent />)
      
      // Fill title but leave options empty
      await user.type(screen.getByLabelText('Poll Title'), 'Test Poll')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Options should be invalid
      const option1Input = screen.getByPlaceholderText('Option 1')
      const option2Input = screen.getByPlaceholderText('Option 2')
      expect(option1Input).toBeInvalid()
      expect(option2Input).toBeInvalid()
    })
  })
})