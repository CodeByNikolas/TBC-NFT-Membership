import { createClient } from '@supabase/supabase-js';

// Check if we're in a build environment vs runtime
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Use fallback values during build time to prevent build errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isBuildTime ? 'https://placeholder-during-build.supabase.co' : '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isBuildTime ? 'placeholder-key-during-build' : '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || (isBuildTime ? 'placeholder-service-key-during-build' : '');

// Only throw errors at runtime, not during build
if (!isBuildTime) {
  if (!supabaseUrl || supabaseUrl.includes('placeholder-during-build')) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder-key-during-build')) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
);
