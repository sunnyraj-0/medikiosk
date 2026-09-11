import { createClient } from '@supabase/supabase-js';

// Supabase project: rmiptuqbkeeejrjspujb (MediKiosk.gov.in)
// Publishable key — safe to expose client-side; it is only ever sent
// to Supabase's REST API and is subject to Row Level Security.
const supabaseUrl = 'https://rmiptuqbkeeejrjspujb.supabase.co';
const supabaseAnonKey = 'sb_publishable_KTnJkzOfCd9LKpq-NqESWQ_DevqLpc_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);