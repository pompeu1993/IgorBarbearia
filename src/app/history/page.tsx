"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { HistoryResponse } from "@/lib/history/types";
import { HistoryCard } from "@/app/history/components/HistoryCard";
import { HistoryFilters } from "@/app/history/components/HistoryFilters";

type FiltersState = { from: string; to: string };

const defaultFilters: FiltersState = { from: "", to: "" };

export default function HistoryPage() {
    const { user, isAuthenticated } = useAuth();
    const [history, setHistory] = useState<HistoryResponse | null>(null);
    const [filters, setFilters] = useState<FiltersState>(defaultFilters);
    const [draftFilters, setDraftFilters] = useState<FiltersState>(defaultFilters);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cancelingId, setCancelingId] = useState<string | null>(null);

    const fetchHistory = useCallback(async (page: number, nextFilters: FiltersState) => {
        setErrorMessage(null);
        const { data } = await supabase.auth.getSession();
        const params = new URLSearchParams({ page: String(page), pageSize: "10" });
        if (nextFilters.from) params.set("from", nextFilters.from);
        if (nextFilters.to) params.set("to", nextFilters.to);

        const response = await fetch(`/api/history?${params.toString()}`, {
            headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {},
            cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
            setHistory(null);
            setErrorMessage(result.error ?? "Não foi possível carregar seu histórico.");
            setLoading(false);
            return;
        }

        setHistory(result);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void fetchHistory(1, filters);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [fetchHistory, user, filters]);

    async function handleCancel(id: string) {
        if (!confirm("Deseja realmente cancelar este agendamento?")) return;
        setCancelingId(id);
        setLoading(true);
        const { error } = await supabase.from("appointments").update({ status: "CANCELLED" }).eq("id", id);
        if (error) alert("Erro ao cancelar o agendamento.");
        await fetchHistory(history?.pagination.page ?? 1, filters);
        setCancelingId(null);
    }

    return (
        <>
            <header className="flex items-center justify-between p-4 pt-6 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </Link>
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white uppercase">Histórico</h1>
                <div className="w-10"></div>
            </header>
            <main className="flex-1 overflow-y-auto pb-[130px] hide-scrollbar relative z-10 px-6 py-6 space-y-6">
                {!isAuthenticated ? (
                    <div className="text-center py-20 text-white text-sm">
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight mb-3">Nenhum histórico encontrado.</h2>
                        <p className="text-sm text-slate-400 mb-6">Faça um agendamento para começar a registrar seu histórico neste dispositivo.</p>
                        <Link href="/" className="px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-xl inline-block mt-4">NOVO AGENDAMENTO</Link>
                    </div>
                ) : (
                    <>
                        <HistoryFilters
                            from={draftFilters.from}
                            to={draftFilters.to}
                            onFromChange={(value) => setDraftFilters((current) => ({ ...current, from: value }))}
                            onToChange={(value) => setDraftFilters((current) => ({ ...current, to: value }))}
                            onApply={() => {
                                setLoading(true);
                                setFilters(draftFilters);
                            }}
                            onClear={() => {
                                setLoading(true);
                                setDraftFilters(defaultFilters);
                                setFilters(defaultFilters);
                            }}
                        />
                        {loading ? (
                            <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                        ) : errorMessage ? (
                            <div className="text-center py-20 text-white text-sm">{errorMessage}</div>
                        ) : history && history.items.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {history.items.map((appointment) => (
                                        <HistoryCard key={appointment.id} appointment={appointment} cancelingId={cancelingId} onCancel={handleCancel} />
                                    ))}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <button disabled={history.pagination.page === 1} onClick={() => {
                                        setLoading(true);
                                        void fetchHistory(history.pagination.page - 1, filters);
                                    }} className="flex-1 h-11 bg-white/5 border border-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40">Anterior</button>
                                    <span className="text-xs text-white/60 font-bold uppercase tracking-widest">{history.pagination.page} / {history.pagination.totalPages}</span>
                                    <button disabled={history.pagination.page >= history.pagination.totalPages} onClick={() => {
                                        setLoading(true);
                                        void fetchHistory(history.pagination.page + 1, filters);
                                    }} className="flex-1 h-11 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-40">Próxima</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 text-white text-sm">Nenhum agendamento encontrado para os filtros aplicados.</div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
