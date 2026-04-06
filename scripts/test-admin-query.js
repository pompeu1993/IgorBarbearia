const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
});

// AQUI VAMOS USAR A ANON KEY, simulando exatamente o que o browser faz
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
    console.log("--- TESTANDO LOGIN E QUERY DO ADMIN ---");

    // 1. Fazer Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'rafaelmiguelalonso@gmail.com',
        password: 'rafael123778', // Senha fornecida pelo usuário
    });

    if (authError) {
        console.error("Erro ao fazer login:", authError.message);
        return;
    }
    console.log(`Login com sucesso! Usuário: ${authData.user.email}`);

    // 2. Tentar rodar a exata mesma query do /admin/agenda
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 30); // Testar um range de 30 dias para pegar tudo

    const { data, error } = await supabase
        .from("appointments")
        .select(`
            id,
            date,
            status,
            user_id,
            profiles!appointments_user_id_fkey(name, phone),
            services(name, duration)
        `)
        .gte("date", startOfDay.toISOString())
        .lt("date", endOfDay.toISOString())
        .in("status", ["CONFIRMED", "COMPLETED", "PENDING"])
        .order("date", { ascending: true });

    if (error) {
        console.error("ERRO AO BUSCAR AGENDAMENTOS:", error);
    } else {
        console.log(`Sucesso! Foram encontrados ${data.length} agendamentos na janela de 30 dias.`);
        if (data.length > 0) {
            console.log("Exemplo do primeiro agendamento retornado:");
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log("AVISO: Zero resultados. Isso significa que o RLS filtrou tudo ou não há agendamentos para essa data.");
        }
    }
}

runTest();
