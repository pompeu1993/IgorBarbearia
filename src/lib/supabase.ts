import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kcctiqttwhofxmytjwrb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjY3RpcXR0d2hvZnhteXRqd3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjQ3MjQsImV4cCI6MjA5MDA0MDcyNH0.duhvuCSiU-7njoLfeFs1V7oXUlTSyrjqpzwlbgLf_II';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options) => {
      // Force no-store to prevent Next.js and Browser from caching Supabase requests
      return fetch(url, { ...options, cache: 'no-store' });
    }
  }
});
