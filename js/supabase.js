// Supabase client - replace with your project credentials
const SUPABASE_URL = 'https://ywgexbkyrmwoaijifrnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Z2V4Ymt5cm13b2Fpamlmcm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTAyMTMsImV4cCI6MjA5NjY4NjIxM30.FcphAvh4kcazlri4BYlCpTFRr7HTEZb0T5U1zbYTfNc';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}
