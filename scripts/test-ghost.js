const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

async function testGhost() {
    const ghostUuid = crypto.randomUUID();
    const ghostEmail = `ghost_${ghostUuid}@barbeariaigor.com`;
    const ghostPassword = ghostUuid;

    console.log("Creating user:", ghostEmail);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ghostEmail,
        password: ghostPassword,
        email_confirm: true,
        user_metadata: {
            name: "Test Ghost"
        }
    });

    console.log("Auth Error:", authError);
    console.log("Auth Data:", authData?.user?.id);

    if (authData?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([{
            id: authData.user.id,
            name: "Test Ghost",
            cpf: null
        }]);
        console.log("Profile Error:", profileError);
    }
}

testGhost();