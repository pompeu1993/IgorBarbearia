/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        env[key.trim().replace(/^\uFEFF/, '')] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
});

console.log(env);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    const data = await response.json();
    console.log(Object.keys(data.paths).filter(p => p.startsWith('/rpc/')));
}

check();