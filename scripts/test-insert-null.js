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

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    console.log("Testing insert with valid user_id...");
    const { data, error } = await supabase.from('appointments').insert([{
        user_id: 'efe9ed5f-3da6-4647-853b-153089f23350', // The ghost user ID created just now
        service_id: 'd0484bc8-2632-44c1-8d6e-aeeb3f6f4bea', // using the one from the user's prompt
        date: new Date().toISOString(),
        status: 'PENDING',
        payment_status: 'PENDING'
    }]);

    console.log("Error:", error);
    console.log("Data:", data);
}

testInsert();