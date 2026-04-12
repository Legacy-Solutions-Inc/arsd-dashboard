import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/reset-failed-reports
 *
 * Resets the parsing status of reports that failed to parse, allowing them to be retried.
 * Requires superadmin role.
 */
export async function POST() {
  try {
    // Auth check — superadmin only
    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await authSupabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = createServiceSupabaseClient();
    
    // Reset reports that failed to parse
    const { data: resetReports, error: resetError } = await supabase
      .from('accomplishment_reports')
      .update({
        parsed_at: null,
        parsed_status: null,
        parse_error: null
      })
      .eq('status', 'approved')
      .eq('parsed_status', 'failed')
      .select('id, file_name');
    
    if (resetError) {
      console.error('Error resetting reports:', resetError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to reset reports', 
        message: 'Unable to reset failed report parsing status'
      }, { status: 500 });
    }
    
    const resetCount = resetReports?.length || 0;
    
    return NextResponse.json({
      success: true,
      message: `Successfully reset ${resetCount} failed reports`,
      resetCount,
      resetReports: resetReports?.map(r => ({ 
        id: r.id, 
        file_name: r.file_name 
      })) || []
    });
    
  } catch (error) {
    console.error('Reset failed reports error:', error);
    return NextResponse.json({
      success: false,
      error: 'Reset failed',
      message: 'An unexpected error occurred while resetting failed reports'
    }, { status: 500 });
  }
}
