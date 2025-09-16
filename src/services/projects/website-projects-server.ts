// Server-side operations for website projects
import { createClient } from "@supabase/supabase-js";

export class WebsiteProjectsServerService {
  static async fetchProjectsForDisplay() {
    // Use anonymous client for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: rawProjects } = await supabase
      .from("website_projects")
      .select(
        `id, name, location, created_at,
         photos:website_project_photos(id, file_path, order_index, alt_text)`
      )
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    const projectsFromDb = rawProjects || [];
    
    // Generate public URLs for better performance (no authentication required)
    const allPhotoUrls = projectsFromDb.flatMap((p: any) => 
      (p.photos || []).map((ph: any) => {
        const { data } = supabase.storage
          .from("website-projects")
          .getPublicUrl(ph.file_path);
        
        return {
          projectId: p.id,
          photoId: ph.id,
          url: data.publicUrl
        };
      })
    );

    // Group URLs by project
    const urlsByProject = allPhotoUrls.reduce((acc, item) => {
      if (!acc[item.projectId]) acc[item.projectId] = [];
      if (item.url) acc[item.projectId].push(item.url);
      return acc;
    }, {} as Record<string, string[]>);

    const projectsWithUrls = projectsFromDb.map((p: any) => {
      const sorted = (p.photos || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
      
      return {
        id: p.id as string,
        name: p.name as string,
        location: p.location as string,
        created_at: p.created_at as string,
        photoUrls: urlsByProject[p.id] || [],
      };
    });

    console.log(`Loaded ${projectsWithUrls.length} projects with photos for public display`);

    return projectsWithUrls;
  }
}

