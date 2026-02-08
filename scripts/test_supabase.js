
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log('Testing Supabase Connection...');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('Error: Missing environment variables.');
        return;
    }

    // console.log('URL:', url); 
    // console.log('Key:', key.substring(0, 10) + '...');

    const supabase = createClient(url, key);

    try {
        // Try to fetch something simple, or just check health
        // Since we don't know tables, let's try to list tables using a query or just a dummy select
        // If the key works, we should get a response, even if empty or 404 for a table

        // This query requires permissions usually, so it might fail with 401/403 if RLS is on and no table exists
        // But "Auth" should work.
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Auth Check Failed:', error.message);
        } else {
            console.log('Auth Check Successful. Session:', data.session ? 'Active' : 'None');
        }

        // Try to select from a non-existent table to see if we get a DB connection error or just "relation does not exist"
        const { error: dbError } = await supabase.from('groups').select('*').limit(1);
        if (dbError) {
            console.log('DB Check Result:', dbError.message);
            if (dbError.message.includes('relation "public.groups" does not exist')) {
                console.log('-> Connection SUCCESS, but tables are missing (as expected).');
            } else {
                console.error('-> Connection Issue or Permission Error.');
            }
        } else {
            console.log('-> Connection SUCCESS. "groups" table exists!');
        }

    } catch (e) {
        console.error('Unexpected Error:', e);
    }
}

testConnection();
