import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://rdoztiueddswgwxbylhv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkb3p0aXVlZGRzd2d3eGJ5bGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjcwNDUsImV4cCI6MjA2NzAwMzA0NX0.hd24iqPPHnS85T31zuczfR48h2myR9fEXvsVBz5zV7E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
