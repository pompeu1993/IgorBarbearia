/* eslint-disable */
import http from 'http';

async function testLocalCheckout() {
    console.log("Iniciando simulação de checkout local...");
    
    // Configurações mockadas baseadas no payload real
    const payload = {
        serviceId: "test_service_id_123",
        date: new Date().toISOString(),
        price: 5.00,
        serviceName: "Corte Tradicional Teste Local"
    };

    try {
        console.log("Enviando POST para http://localhost:3000/api/checkout");
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/checkout',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Para simular o usuário deslogado e ver se bate na nossa API
                'Authorization': 'Bearer fake_token_for_testing' 
            }
        };

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log("Resposta bruta:");
                console.log(data);
                try {
                    const json = JSON.parse(data);
                    console.log("\nJSON Formatado:\n", JSON.stringify(json, null, 2));
                } catch(e) {
                    console.log("Não é JSON");
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problema com a requisição: ${e.message}`);
        });

        req.write(JSON.stringify(payload));
        req.end();

    } catch (e) {
        console.error("Erro na requisição local:", e.message);
    }
}

testLocalCheckout();