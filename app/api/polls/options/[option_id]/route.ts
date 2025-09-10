import { createSupabaseServerClient } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";
import { 
  OptionVerificationResponse, 
  PollOptionWithPoll,
  DeleteResponse,
  AuthErrorResponse 
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
      const errorResponse: AuthErrorResponse = {
        success: false,
        error: "Authentication required",
      };
      return NextResponse.json(
        { ...errorResponse, exists: false },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("poll_options")
      .select(
        `
        id,
        option_text,
        poll_id,
        polls!inner(
          id,
          user_id
        )
      `
      )
      .eq("id", optionId);

    if (error) {
      const errorResponse: OptionVerificationResponse = {
        success: false,
        error: `Failed to verify option: ${error.message}`,
        exists: false,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const option = data?.[0] as PollOptionWithPoll | undefined;
    const exists = !!option && option.polls.user_id === user.id;

    const response: OptionVerificationResponse = {
      success: true,
      exists,
      option: exists ? option : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    const standardError = ErrorHandler.createApiErrorResponse(error, 'Failed to verify option');
    const errorResponse: OptionVerificationResponse = {
      success: false,
      error: standardError.error,
      exists: false,
    };
    return NextResponse.json(errorResponse, { status: standardError.statusCode });
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
      const errorResponse: AuthErrorResponse = {
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
      const errorResponse: DeleteResponse = {
        success: false,
        error: `Failed to verify option ownership: ${optionError.message}`,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const typedOptionData = optionData as PollOptionWithPoll;
    if (!typedOptionData || typedOptionData.polls.user_id !== user.id) {
      const errorResponse: DeleteResponse = {
        success: false,
        error: "You can only delete options from your own polls",
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    const { data, error } = await supabase
      .from("poll_options")
      .delete()
      .eq("id", optionId)
      .select();

    if (error) {
      const errorResponse: DeleteResponse = {
        success: false,
        error: `Failed to delete poll option: ${error.message}`,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const response: DeleteResponse<PollOptionWithPoll> = {
      success: true,
      deletedOption: data,
    };
    return NextResponse.json(response);
  } catch (error) {
    const standardError = ErrorHandler.createApiErrorResponse(error, 'Failed to delete poll option');
    const errorResponse: DeleteResponse = {
      success: false,
      error: standardError.error,
    };
    return NextResponse.json(errorResponse, { status: standardError.statusCode });
  }
}
