import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL("/sign-in?error=auth_failed", requestUrl.origin));
    }

    // Ensure user has a profile after email confirmation
    if (user) {
      try {
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating profile for confirmed user:', user.id);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email || 'User',
              email: user.email || null,
              role: 'pending',
              status: 'pending'
            });

          if (insertError) {
            console.error('Error creating profile after confirmation:', insertError);
          } else {
            console.log('Profile created successfully after confirmation:', user.id);
          }
        }
      } catch (err) {
        console.error('Error in profile creation after confirmation:', err);
      }
    }
  }

  // URL to redirect to after sign in process completes
  const redirectTo = redirect_to || "/";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 