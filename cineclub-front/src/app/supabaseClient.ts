import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
  },
});
