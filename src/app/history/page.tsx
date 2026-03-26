"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Appointment = {
    id: string;
    date: string;
    status: string;
    service: {
        name: string;
        price: number;
    };
};

export default function HistoryPage() {
    const { user, isAuthenticated } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelingId, setCancelingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            setLoading(true);
            
            // Auto-complete past confirmed appointments before fetching
            const nowIso = new Date().toISOString();
            await supabase
                .from("appointments")
                .update({ status: "COMPLETED" })
                .eq("user_id", user.id)
                .eq("status", "CONFIRMED")
                .lt("date", nowIso);

            const { data, error } = await supabase
                .from("appointments")
                .select(`
                    id, 
                    date, 
                    status,
                    service:services (name, price)
                `)
                .eq("user_id", user.id)
                .order("date", { ascending: false });

            if (data) {
                // Ensure data matches the expected type
                const formattedData: Appointment[] = data.map((item: any) => ({
                    id: item.id,
                    date: item.date,
                    status: item.status,
                    service: Array.isArray(item.service) ? item.service[0] : item.service
                }));
                setAppointments(formattedData);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    const handleCancel = async (id: string) => {
        if (!confirm("Deseja realmente cancelar este agendamento?")) return;

        setCancelingId(id);
        const { error } = await supabase
            .from("appointments")
            .update({ status: "CANCELLED" })
            .eq("id", id);

        if (!error) {
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: "CANCELLED" } : app));
        } else {
            alert("Erro ao cancelar o agendamento.");
        }
        setCancelingId(null);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const formatDate = (isoStr: string) => {
        const d = new Date(isoStr);
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        return `${d.getDate()} de ${monthNames[d.getMonth()]}, ${d.getFullYear()} as ${time}`;
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "PENDING": return { text: "Pendente", color: "text-yellow-500", icon: "schedule" };
            case "CONFIRMED": return { text: "Confirmado", color: "text-green-500", icon: "check_circle" };
            case "CANCELLED": return { text: "Cancelado", color: "text-red-500", icon: "cancel" };
            case "COMPLETED": return { text: "Realizado", color: "text-primary", icon: "verified" };
            default: return { text: status, color: "text-slate-500", icon: "info" };
        }
    };

    const isFutureAndPending = (isoStr: string, status: string) => {
        return new Date(isoStr).getTime() > new Date().getTime() && status === "PENDING";
    };

    const canReschedule = (isoStr: string, status: string) => {
        // Pode reagendar se for CONFIRMADO e estiver no futuro
        if (status !== "CONFIRMED") return false;
        
        const apptDate = new Date(isoStr).getTime();
        const now = new Date().getTime();
        
        return apptDate > now;
    };

    return (
        <>
            <header className="flex items-center justify-between p-4 pt-6 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </Link>
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white uppercase">Histórico</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto pb-[130px] hide-scrollbar relative z-10 px-6 py-6 border-t border-transparent">
                {!isAuthenticated ? (
                    <div className="text-center py-20 text-white text-sm">Faça login para ver seu histórico.</div>
                ) : loading ? (
                    <div className="flex justify-center p-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 text-white text-sm">Você ainda não possui agendamentos.</div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((item) => {
                            const statusInfo = getStatusText(item.status);
                            const canCancel = isFutureAndPending(item.date, item.status);
                            const allowReschedule = canReschedule(item.date, item.status);

                            return (
                                <div key={item.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex flex-col opacity-90 transition-opacity shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                        <div>
                                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest block mb-1">
                                                {formatDate(item.date)}
                                            </span>
                                            <h3 className="text-white font-extrabold text-lg tracking-tight mb-1">{item.service?.name}</h3>
                                            <p className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusInfo.color}`}>
                                                <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                                                {statusInfo.text}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="text-primary font-black text-lg tracking-tight block mb-1">{item.service?.price ? formatPrice(item.service.price) : ''}</span>
                                            {canCancel ? (
                                                <button
                                                    onClick={() => handleCancel(item.id)}
                                                    disabled={cancelingId === item.id}
                                                    className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest disabled:opacity-50 transition-colors bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20"
                                                >
                                                    {cancelingId === item.id ? 'Cancelando...' : 'Cancelar'}
                                                </button>
                                            ) : item.status === 'COMPLETED' ? (
                                                <button className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-widest transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                                    Agendar Novamente
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                    
                                    {allowReschedule && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-1.5 max-w-[65%]">
                                                <span className="material-symbols-outlined text-slate-400 text-[14px]">info</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-tight">Reagendamentos permitidos com até 24h de antecedência</span>
                                            </div>
                                            <Link
                                                href={`/appointments/reschedule?appointmentId=${item.id}`}
                                                className="text-[10px] font-bold text-black uppercase tracking-widest transition-colors bg-primary hover:bg-[#cfaa33] px-4 py-2 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                            >
                                                Reagendar
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}
