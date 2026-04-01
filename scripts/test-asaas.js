const fs = require('fs');

async function testAsaas() {
    console.log("Iniciando teste da API do Asaas...");
    
    // Read env manually since dotenv is not installed in the workspace root
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            env[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });

    const ASAAS_API_URL = env.ASAAS_API_URL || "https://api.asaas.com/v3";
    const ASAAS_TOKEN = env.ASAAS_TOKEN || "";
    
    console.log("URL:", ASAAS_API_URL);
    console.log("Token length:", ASAAS_TOKEN.length);
    console.log("Token start:", ASAAS_TOKEN.substring(0, 10));

    const cleanCpf = "12345678909"; // Mock CPF

    try {
        console.log("\n=== TESTE 1: BUSCAR CLIENTE ===");
        const searchCustomerRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpf}`, {
            headers: {
                "access_token": ASAAS_TOKEN,
                "Accept": "application/json"
            }
        });
        console.log("Status:", searchCustomerRes.status);
        const searchCustomerText = await searchCustomerRes.text();
        console.log("Body:", searchCustomerText.substring(0, 1000));
        
        let customerId = "cus_000006323145";
        
        if (searchCustomerRes.status === 200) {
            const data = JSON.parse(searchCustomerText);
            if (data.data && data.data.length > 0) {
                customerId = data.data[0].id;
                console.log("Cliente já existe, usando ID:", customerId);
            } else {
                console.log("\n=== TESTE 1.5: CRIAR CLIENTE ===");
                const createCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                    method: "POST",
                    headers: {
                        "access_token": ASAAS_TOKEN,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        name: "Teste Cliente API",
                        cpfCnpj: cleanCpf,
                        email: "cliente@teste.com"
                    })
                });
                console.log("Status:", createCustomerRes.status);
                const createCustomerText = await createCustomerRes.text();
                console.log("Body:", createCustomerText.substring(0, 1000));
                
                if (createCustomerRes.status === 200) {
                    const createData = JSON.parse(createCustomerText);
                    customerId = createData.id;
                    console.log("Novo cliente criado com ID:", customerId);
                }
            }
        }

        console.log("\n=== TESTE 2: CRIAR COBRANÇA PIX ===");
        const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
            method: "POST",
            headers: {
                "access_token": ASAAS_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                customer: customerId, // Usa o cliente criado
                billingType: "PIX",
                value: 5.00,
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                description: `Agendamento: Teste`,
                externalReference: `agendamento_${Date.now()}`
            })
        });
        
        console.log("Status:", paymentRes.status);
        const paymentText = await paymentRes.text();
        console.log("Body:", paymentText.substring(0, 1000));

    } catch (e) {
        console.error("Error:", e);
    }
}

testAsaas();