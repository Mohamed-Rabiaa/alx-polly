import { createSupabaseServerClient } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

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
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          votes: [],
        },
        { status: 401 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: `Failed to verify option ownership: ${optionError.message}`,
          votes: [],
        },
        { status: 500 }
      );
    }

    if (!optionData || (optionData.polls as any).user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only access votes from your own polls",
          votes: [],
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("option_id", optionId);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to check votes: ${error.message}`,
          votes: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, votes: data || [] });
  } catch (error) {
    console.error("Error in checkVotesForOptionSecure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        votes: [],
      },
      { status: 500 }
    );
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
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: `Failed to verify option ownership: ${optionError.message}`,
        },
        { status: 500 }
      );
    }

    if (!optionData || (optionData.polls as any).user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only delete options from your own polls",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("votes")
      .delete()
      .eq("option_id", optionId)
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete votes: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedVotes: data });
  } catch (error) {
    console.error("Error in deleteVotesForOptionSecure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
