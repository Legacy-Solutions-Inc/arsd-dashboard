import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AutoParseService } from '@/services/accomplishment-reports/auto-parse.service';

/**
 * POST /api/accomplishment-reports/parse-approved
 *
 * Parses approved accomplishment reports and saves the data to the database.
 * Requires superadmin role.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check — superadmin only
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId } = body;
    
    // Validate input
    if (reportId && typeof reportId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid reportId. Must be a string.' }, 
        { status: 400 }
      );
    }
    
    if (reportId) {
      // Parse a specific report
      const result = await AutoParseService.parseApprovedReport(reportId);
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Successfully processed report ${reportId}` 
          : `Failed to process report ${reportId}`,
        recordsSaved: result.recordsSaved,
        error: result.error
      });
    } else {
      // Parse all approved reports
      const result = await AutoParseService.parseAllApprovedReports();
      
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${result.parsed} approved reports`,
        parsed: result.parsed,
        total: result.total,
        errors: result.errors
      });
    }

  } catch (error) {
    console.error('Error in parse-approved endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        message: 'An unexpected error occurred while processing the request'
      }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/accomplishment-reports/parse-approved
 *
 * Retrieves the status of accomplishment reports and their parsing status.
 * Requires superadmin role.
 */
export async function GET() {
  try {
    // Auth check — superadmin only
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { createServiceSupabaseClient } = await import('@/lib/supabase');
    const serviceSupabase = createServiceSupabaseClient();
    
    // Get total count
    const { count, error: countError } = await serviceSupabase
      .from('accomplishment_reports')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting report count:', countError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch report count',
        message: 'Unable to retrieve report statistics'
      }, { status: 500 });
    }

    // Get recent reports with parsing status
    const { data: reports, error } = await serviceSupabase
      .from('accomplishment_reports')
      .select('id, status, parsed_at, parsed_status, project_id, file_name, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch reports', 
        message: 'Unable to retrieve report data'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      reports: reports || [],
      total: count || 0,
      message: `Retrieved ${reports?.length || 0} recent reports out of ${count || 0} total`
    });
  } catch (error) {
    console.error('Error fetching reports status:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error', 
      message: 'An unexpected error occurred while fetching report status'
    }, { status: 500 });
  }
}
