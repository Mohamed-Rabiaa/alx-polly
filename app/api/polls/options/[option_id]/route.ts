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
          exists: false,
        },
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
      return NextResponse.json(
        {
          success: false,
          error: `Failed to verify option: ${error.message}`,
          exists: false,
        },
        { status: 500 }
      );
    }

    const option = data?.[0];
    const exists = !!option && (option.polls as any).user_id === user.id;

    return NextResponse.json({
      success: true,
      exists,
      option: exists ? option : null,
    });
  } catch (error) {
    console.error("Error in verifyOptionExistsSecure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        exists: false,
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
      .from("poll_options")
      .delete()
      .eq("id", optionId)
      .select();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete poll option: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedOption: data });
  } catch (error) {
    console.error("Error in deletePollOptionSecure:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
