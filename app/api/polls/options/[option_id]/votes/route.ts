import { createSupabaseServerClient } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";
import { 
  VoteCheckResponse, 
  DeleteVotesResponse, 
  PollOptionWithPoll 
} from "@/app/types/api";
import { ErrorHandler } from "@/app/lib/error-handler";

export async function GET(
  request: Request,
  { params }: { params: { option_id: string } }
) {
  try {
    const optionId = params.option_id;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorResponse: VoteCheckResponse = {
        success: false,
        error: "Authentication required",
        votes: [],
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { data: optionData, error: optionError } = await supabase
      .from("poll_options")
      .select(
        `
        id,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `
      )
      .eq("id", optionId)
      .single();

    if (optionError) {
      const errorResponse: VoteCheckResponse = {
        success: false,
        error: `Failed to verify option ownership: ${optionError.message}`,
        votes: [],
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const typedOptionData = optionData as PollOptionWithPoll;
    if (!typedOptionData || typedOptionData.polls.user_id !== user.id) {
      const errorResponse: VoteCheckResponse = {
        success: false,
        error: "You can only access votes from your own polls",
        votes: [],
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("option_id", optionId);

    if (error) {
      const errorResponse: VoteCheckResponse = {
        success: false,
        error: `Failed to check votes: ${error.message}`,
        votes: [],
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const response: VoteCheckResponse = {
      success: true,
      votes: data || [],
    };
    return NextResponse.json(response);
  } catch (error) {
    const standardError = ErrorHandler.createApiErrorResponse(error, 'Failed to check votes');
    const response: VoteCheckResponse = {
      success: false,
      error: standardError.error,
      votes: [],
    };
    return NextResponse.json(response, { status: standardError.statusCode });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { option_id: string } }
) {
  try {
    const optionId = params.option_id;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      const errorResponse: DeleteVotesResponse = {
        success: false,
        error: "Authentication required",
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { data: optionData, error: optionError } = await supabase
      .from("poll_options")
      .select(
        `
        id,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `
      )
      .eq("id", optionId)
      .single();

    if (optionError) {
      const errorResponse: DeleteVotesResponse = {
        success: false,
        error: `Failed to verify option ownership: ${optionError.message}`,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const typedOptionData = optionData as PollOptionWithPoll;
    if (!typedOptionData || typedOptionData.polls.user_id !== user.id) {
      const errorResponse: DeleteVotesResponse = {
        success: false,
        error: "You can only delete options from your own polls",
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const { data, error } = await supabase
      .from("votes")
      .delete()
      .eq("option_id", optionId)
      .select();

    if (error) {
      const errorResponse: DeleteVotesResponse = {
        success: false,
        error: `Failed to delete votes: ${error.message}`,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const response: DeleteVotesResponse = {
      success: true,
      deletedVotes: data,
    };
    return NextResponse.json(response);
  } catch (error) {
    const standardError = ErrorHandler.createApiErrorResponse(error, 'Failed to delete votes');
    const errorResponse: DeleteVotesResponse = {
      success: false,
      error: standardError.error,
    };
    return NextResponse.json(errorResponse, { status: standardError.statusCode });
  }
}
