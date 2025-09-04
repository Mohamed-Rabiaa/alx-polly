'use server'

import { createSupabaseServerClient } from '../supabase-server'

// Secure server actions that respect RLS policies
export async function deleteVotesForOptionSecure(optionId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required' 
      }
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
      }
    }
    
    if (!optionData || optionData.polls.user_id !== user.id) {
      return { 
        success: false, 
        error: 'You can only delete options from your own polls' 
      }
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
      }
    }
    
    return { success: true, deletedVotes: data }
  } catch (error) {
    console.error('Error in deleteVotesForOptionSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function deletePollOptionSecure(optionId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required' 
      }
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
      }
    }
    
    if (!optionData || optionData.polls.user_id !== user.id) {
      return { 
        success: false, 
        error: 'You can only delete options from your own polls' 
      }
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
      }
    }
    
    return { success: true, deletedOption: data }
  } catch (error) {
    console.error('Error in deletePollOptionSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function checkVotesForOptionSecure(optionId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required',
        votes: []
      }
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
      }
    }
    
    if (!optionData || optionData.polls.user_id !== user.id) {
      return { 
        success: false, 
        error: 'You can only access votes from your own polls',
        votes: []
      }
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
      }
    }
    
    return { success: true, votes: data || [] }
  } catch (error) {
    console.error('Error in checkVotesForOptionSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      votes: []
    }
  }
}

export async function verifyOptionExistsSecure(optionId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: 'Authentication required',
        exists: false
      }
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
      }
    }
    
    const option = data?.[0]
    const exists = !!option && option.polls.user_id === user.id
    
    return { 
      success: true, 
      exists, 
      option: exists ? option : null 
    }
  } catch (error) {
    console.error('Error in verifyOptionExistsSecure:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      exists: false
    }
  }
}