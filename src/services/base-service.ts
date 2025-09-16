// Base service class for common functionality
import { createClient } from '@/lib/supabase';
import { AppError, handleError } from '@/lib/errors';

export abstract class BaseService {
  protected supabase;

  constructor() {
    this.supabase = createClient();
  }

  protected async handleSupabaseError<T>(
    operation: () => Promise<{ data: T; error: any }>
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        throw new AppError(
          error.message || 'Database operation failed',
          500,
          'DATABASE_ERROR'
        );
      }
      
      return data;
    } catch (error) {
      throw handleError(error);
    }
  }

  protected validateRequired(data: any, fields: string[]): void {
    for (const field of fields) {
      if (!data[field]) {
        throw new AppError(`Missing required field: ${field}`, 400, 'VALIDATION_ERROR');
      }
    }
  }
}
