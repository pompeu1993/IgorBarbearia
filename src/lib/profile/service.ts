/* eslint-disable */
import { SupabaseClient } from "@supabase/supabase-js";

export type UpdateProfileData = {
    name: string;
    phone: string;
    cpf: string | null;
};

export async function updateUserProfile(
    supabase: SupabaseClient,
    userId: string,
    data: UpdateProfileData,
    maxRetries = 3,
    baseDelayMs = 1000
) {
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount < maxRetries) {
        const { data: updatedData, error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", userId)
            .select();

        if (error) {
            lastError = error;
            
            console.error(`[Profile Service] Erro do Supabase ao atualizar (Tentativa ${retryCount + 1} de ${maxRetries}):`, {
                message: error.message || error,
                code: error.code || "UNKNOWN",
                details: error.details || "N/A",
                hint: error.hint || "N/A"
            });

            // Erros de cliente ou validação (ex: 23505 Unique Violation, 42501 Insufficient Privilege) não devem ser retentados
            const isClientError = error.code && (String(error.code).startsWith('2') || String(error.code).startsWith('4'));
            if (isClientError) {
                break;
            }

            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`[Profile Service] Falha temporária. Aguardando ${baseDelayMs * retryCount}ms antes da próxima tentativa...`);
                await new Promise(res => setTimeout(res, baseDelayMs * retryCount));
                continue;
            }
        } else if (!updatedData || updatedData.length === 0) {
            // Se a query de update rodou sem erros mas não retornou dados, 
            // a linha não existe ou o usuário não tem permissão RLS para atualizá-la.
            lastError = { 
                message: "Nenhum dado foi retornado após a atualização. Verifique as permissões (RLS) ou se o usuário existe.", 
                code: "NO_DATA",
                details: "Supabase returned empty array on .update().eq('id').select()"
            };
            break;
        } else {
            // Sucesso
            return { success: true, data: updatedData[0], error: null };
        }
    }

    return { success: false, data: null, error: lastError };
}
