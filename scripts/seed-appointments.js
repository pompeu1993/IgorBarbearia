/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler as variáveis do .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s][^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove aspas simples ou duplas
        value = value.replace(/^['"]|['"]$/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis do Supabase no .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAppointments() {
    console.log("Iniciando a criação de agendamentos de teste...");

    // 1. Pegar um usuário válido (o primeiro que achar ou o admin)
    const { data: users, error: userError } = await supabase.from('profiles').select('id, name').limit(1);
    
    if (userError || !users || users.length === 0) {
        console.error("Nenhum usuário encontrado na tabela profiles. Crie uma conta no app primeiro.");
        return;
    }
    const userId = users[0].id;
    console.log(`Usuário selecionado: ${users[0].name} (${userId})`);

    // 2. Pegar serviços válidos
    const { data: services, error: serviceError } = await supabase.from('services').select('id, name').limit(2);
    
    if (serviceError || !services || services.length === 0) {
        console.error("Nenhum serviço encontrado na tabela services.");
        return;
    }

    const service1 = services[0].id;
    const service2 = services.length > 1 ? services[1].id : services[0].id;

    // 3. Criar 20 agendamentos para datas futuras (CONFIRMADOS e PAGOS)
    const appointments = [];
    const today = new Date();
    
    // Array com horários comerciais comuns
    const possibleHours = [9, 10, 11, 13, 14, 15, 16, 17, 18];

    for (let i = 1; i <= 20; i++) {
        const aptDate = new Date(today);
        
        // Espalha os agendamentos entre hoje (se for cedo) e os próximos 14 dias
        const daysToAdd = Math.floor(Math.random() * 14); 
        aptDate.setDate(aptDate.getDate() + daysToAdd);
        
        // Sorteia uma hora aleatória
        const randomHour = possibleHours[Math.floor(Math.random() * possibleHours.length)];
        aptDate.setHours(randomHour, 0, 0, 0);

        // Se por acaso cair num domingo (0), joga pra segunda (1)
        if (aptDate.getDay() === 0) {
            aptDate.setDate(aptDate.getDate() + 1);
        }

        // Alterna entre os dois serviços
        const selectedService = i % 2 === 0 ? service2 : service1;

        appointments.push({
            user_id: userId,
            service_id: selectedService,
            date: aptDate.toISOString(),
            status: 'CONFIRMED',
            payment_status: 'PAID',
            payment_id: `mock_pay_future_${i}_${Date.now()}`
        });
    }

    const { error: insertError } = await supabase.from('appointments').insert(appointments);

    if (insertError) {
        console.error("Erro ao inserir agendamentos:", insertError);
    } else {
        console.log("✅ 20 Agendamentos CONFIRMADOS criados com sucesso!");
        console.log("Eles foram espalhados pelos próximos 14 dias em horários aleatórios.");
        console.log("\nAcesse /admin para visualizá-los no Dashboard e no Calendário.");
    }
}

seedAppointments();
