'use server'

import { createSupabaseServerClient } from '../supabase-server'
import { 
  DeleteVotesResponse, 
  DeleteOptionResponse, 
  VoteCheckResponse, 
  OptionExistsResponse,
  PollOptionWithPoll 
} from '@/app/types/api'

// Secure server actions that respect RLS policies
export async function deleteVotesForOptionSecure(optionId: string): Promise<DeleteVotesResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required' 
      } as DeleteVotesResponse
    }
    
    // First verify the user owns the poll that contains this option
    const { data: optionData, error: optionError } = await supabase
      .from('poll_options')
      .select(`
        id,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `)
      .eq('id', optionId)
      .single()
    
    if (optionError) {
      return { 
        success: false, 
        error: `Failed to verify option ownership: ${optionError.message}` 
      } as DeleteVotesResponse
    }
    
    const typedOptionData = optionData as PollOptionWithPoll
    if (!typedOptionData || typedOptionData.polls.user_id !== user.id) {
      return { 
        success: false, 
        error: 'You can only delete options from your own polls' 
      } as DeleteVotesResponse
    }
    
    // Delete votes for this option (RLS should allow this if user owns the poll)
    const { data, error } = await supabase
      .from('votes')
      .delete()
      .eq('option_id', optionId)
      .select()
    
    if (error) {
      return { 
        success: false, 
        error: `Failed to delete votes: ${error.message}` 
      } as DeleteVotesResponse
    }
    
    return { 
      success: true, 
      deletedVotes: data 
    } as DeleteVotesResponse
  } catch (error) {
    console.error('Error in deleteVotesForOptionSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    } as DeleteVotesResponse
  }
}

export async function deletePollOptionSecure(optionId: string): Promise<DeleteOptionResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required' 
      } as DeleteOptionResponse
    }
    
    // First verify the user owns the poll that contains this option
    const { data: optionData, error: optionError } = await supabase
      .from('poll_options')
      .select(`
        id,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `)
      .eq('id', optionId)
      .single()
    
    if (optionError) {
      return { 
        success: false, 
        error: `Failed to verify option ownership: ${optionError.message}` 
      } as DeleteOptionResponse
    }
    
    const typedOptionData = optionData as PollOptionWithPoll
    if (!typedOptionData || typedOptionData.polls.user_id !== user.id) {
      return { 
        success: false, 
        error: 'You can only delete options from your own polls' 
      } as DeleteOptionResponse
    }
    
    // Delete the poll option (RLS should allow this if user owns the poll)
    const { data, error } = await supabase
      .from('poll_options')
      .delete()
      .eq('id', optionId)
      .select()
    
    if (error) {
      return { 
        success: false, 
        error: `Failed to delete poll option: ${error.message}` 
      } as DeleteOptionResponse
    }
    
    return { 
      success: true, 
      deletedOption: data 
    } as DeleteOptionResponse
  } catch (error) {
    console.error('Error in deletePollOptionSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    } as DeleteOptionResponse
  }
}

export async function checkVotesForOptionSecure(optionId: string): Promise<VoteCheckResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required',
        votes: []
      } as VoteCheckResponse
    }
    
    // First verify the user owns the poll that contains this option
    const { data: optionData, error: optionError } = await supabase
      .from('poll_options')
      .select(`
        id,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `)
      .eq('id', optionId)
      .single()
    
    if (optionError) {
      return { 
        success: false, 
        error: `Failed to verify option ownership: ${optionError.message}`,
        votes: []
      } as VoteCheckResponse
    }
    
    const typedOptionData = optionData as PollOptionWithPoll
    if (!typedOptionData || typedOptionData.polls.user_id !== user.id) {
      return { 
        success: false, 
        error: 'You can only access votes from your own polls',
        votes: []
      } as VoteCheckResponse
    }
    
    // Check votes for this option
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('option_id', optionId)
    
    if (error) {
      return { 
        success: false, 
        error: `Failed to check votes: ${error.message}`,
        votes: []
      } as VoteCheckResponse
    }
    
    return { 
      success: true, 
      votes: data || [] 
    } as VoteCheckResponse
  } catch (error) {
    console.error('Error in checkVotesForOptionSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      votes: []
    } as VoteCheckResponse
  }
}

export async function verifyOptionExistsSecure(optionId: string): Promise<OptionExistsResponse> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required',
        exists: false
      } as OptionExistsResponse
    }
    
    // Check if option exists and user owns the poll
    const { data, error } = await supabase
      .from('poll_options')
      .select(`
        id,
        option_text,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `)
      .eq('id', optionId)
    
    if (error) {
      return { 
        success: false, 
        error: `Failed to verify option: ${error.message}`,
        exists: false
      } as OptionExistsResponse
    }
    
    const option = data?.[0] as PollOptionWithPoll
    const exists = !!option && option.polls.user_id === user.id
    
    return { 
      success: true, 
      exists, 
      option: exists ? option : null 
    } as OptionExistsResponse
  } catch (error) {
    console.error('Error in verifyOptionExistsSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      exists: false
    } as OptionExistsResponse
  }
}