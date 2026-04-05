import 'server-only';

// O Next.js com dotenv-expand tem um bug onde tenta expandir chaves começando com $.
// O ideal é colocar aspas simples no .env.local (ex: ASAAS_TOKEN='$aact...').
// Caso a variável ambiente não carregue, disparamos um erro claro.

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variável de ambiente obrigatória não encontrada: ${name}`);
    }
    return value;
}

export const asaasConfig = {
    // Fallback para a URL de produção se não for fornecida no .env
    API_URL: process.env.ASAAS_API_URL || "https://api.asaas.com/v3",
    
    // O token agora é lido do .env, NUNCA exposto no código-fonte
    get TOKEN() {
        return getRequiredEnv('ASAAS_TOKEN');
    }
};

export function getAsaasHeaders() {
    return {
        "access_token": asaasConfig.TOKEN,
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
}
