import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AccomplishmentReportParser } from '@/lib/accomplishment-report-parser';
import { AccomplishmentDataService } from '@/services/accomplishment-reports/accomplishment-data.service';

/**
 * ADMIN-ONLY TEST ROUTE - Safe for production testing
 * POST /api/warehouse/ipow/parse-test
 *
 * Parse IPOW from an Excel file without requiring report approval.
 * Restricted to superadmin only and should be used for diagnostics/maintenance,
 * not as part of the normal accomplishment-report flow.
 *
 * Request (multipart/form-data):
 * - file: Excel file with "IPOW table" sheet
 * - project_id: UUID of project to associate IPOW items with
 * - dry_run: "true" | "false" (optional, default false)
 *
 * Response:
 * - success: boolean
 * - parsed_count: number of IPOW rows parsed
 * - inserted_count: number (only if dry_run=false)
 * - ipow_items: ParsedIPOWRow[] (only if dry_run=true)
 * - error?: string
 */
export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Forbidden: This test route is restricted to superadmin users only' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('project_id') as string;
    const dryRun = formData.get('dry_run') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Missing required field: file' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Missing required field: project_id' }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: `Project not found: ${projectId}` },
        { status: 404 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const parser = new AccomplishmentReportParser(arrayBuffer);
    const parsedData = await parser.parseAccomplishmentReport();

    if (!parsedData.ipow_items || parsedData.ipow_items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No IPOW items found in Excel file. Ensure the file has an "IPOW table" sheet with data.',
        parsed_count: 0,
      });
    }

    const parsedCount = parsedData.ipow_items.length;

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        parsed_count: parsedCount,
        project: {
          id: project.id,
          name: project.project_name,
        },
        ipow_items: parsedData.ipow_items,
        message: `Parsed ${parsedCount} IPOW items (DRY RUN - no database changes)`,
      });
    }

    const dataService = new AccomplishmentDataService();
    await (dataService as any).insertIPOWItems(supabase, projectId, parsedData.ipow_items);

    return NextResponse.json({
      success: true,
      parsed_count: parsedCount,
      inserted_count: parsedCount,
      project: {
        id: project.id,
        name: project.project_name,
      },
      message: `Successfully inserted ${parsedCount} IPOW items for project "${project.project_name}"`,
    });
  } catch (error) {
    console.error('Error in IPOW parse-test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse IPOW',
      },
      { status: 500 }
    );
  }
}
