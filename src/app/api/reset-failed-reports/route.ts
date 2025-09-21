import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/reset-failed-reports
 * 
 * Resets the parsing status of reports that failed to parse, allowing them to be retried.
 * Only resets reports with status 'approved' and parsed_status 'failed'.
 * 
 * Returns:
 * - success: boolean
 * - message: string
 * - resetCount: number of reports reset
 * - resetReports: array of reset report details
 */
export async function POST() {
  try {
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
