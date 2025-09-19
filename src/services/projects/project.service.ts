import { createClient } from '@/lib/supabase';
import { Project, CreateProjectData, UpdateProjectData, ProjectFilters, ProjectManager } from '@/types/projects';

export class ProjectService {
  private supabase = createClient();

  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    let query = this.supabase
      .from('projects')
      .select(`
        *,
        project_manager:profiles!project_manager_id(
          user_id,
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.project_manager_id) {
      query = query.eq('project_manager_id', filters.project_manager_id);
    }

    if (filters?.search) {
      query = query.or(`project_name.ilike.%${filters.search}%,client.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  }

  async getProjectById(id: string): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(`
        *,
        project_manager:profiles!project_manager_id(
          user_id,
          display_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  }

  async createProject(projectData: CreateProjectData): Promise<Project> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        ...projectData,
        created_by: user.id,
        updated_by: user.id
      })
      .select(`
        *,
        project_manager:profiles!project_manager_id(
          user_id,
          display_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  }

  async updateProject(id: string, projectData: UpdateProjectData): Promise<Project> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('projects')
      .update({
        ...projectData,
        updated_by: user.id
      })
      .eq('id', id)
      .select(`
        *,
        project_manager:profiles!project_manager_id(
          user_id,
          display_name,
          email
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return data;
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  async getAvailableProjectManagers(): Promise<ProjectManager[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .eq('role', 'project_manager')
      .eq('status', 'active')
      .order('display_name');

    if (error) {
      throw new Error(`Failed to fetch project managers: ${error.message}`);
    }

    return data || [];
  }

  async updateLatestAccomplishmentDate(projectId: string, date: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('projects')
      .update({
        latest_accomplishment_update: date,
        updated_by: user.id
      })
      .eq('id', projectId);

    if (error) {
      throw new Error(`Failed to update project accomplishment date: ${error.message}`);
    }
  }
}
