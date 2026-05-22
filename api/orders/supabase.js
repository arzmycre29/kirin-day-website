// Cwd: d:/ProjectApp/Kirin Day Web/api/orders/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Supabase credentials are missing. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file."
  );
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

module.exports = { supabase };
