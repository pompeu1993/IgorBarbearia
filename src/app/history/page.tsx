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

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            setLoading(true);
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

        const { error } = await supabase
            .from("appointments")
            .update({ status: "CANCELLED" })
            .eq("id", id);

        if (!error) {
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: "CANCELLED" } : app));
        } else {
            alert("Erro ao cancelar o agendamento.");
        }
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

    const isFuture = (isoStr: string, status: string) => {
        return new Date(isoStr).getTime() > new Date().getTime() && (status === "PENDING" || status === "CONFIRMED");
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

            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar relative z-10 px-6 py-6 border-t border-transparent">
                {!isAuthenticated ? (
                    <div className="text-center py-20 text-slate-500 text-sm">Faça login para ver seu histórico.</div>
                ) : loading ? (
                    <div className="flex justify-center p-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">Você ainda não possui agendamentos.</div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((item) => {
                            const statusInfo = getStatusText(item.status);
                            const canCancel = isFuture(item.date, item.status);

                            return (
                                <div key={item.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between opacity-90 transition-opacity">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                                            {formatDate(item.date)}
                                        </span>
                                        <h3 className="text-slate-300 font-bold text-base tracking-tight">{item.service?.name}</h3>
                                        <p className={`text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 mt-1 ${statusInfo.color}`}>
                                            <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                                            {statusInfo.text}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-400 font-bold text-sm tracking-tight">{item.service?.price ? formatPrice(item.service.price) : ''}</span>
                                        {canCancel ? (
                                            <button onClick={() => handleCancel(item.id)} className="mt-2 text-[10px] text-red-500 font-bold uppercase hover:underline block ml-auto">
                                                Cancelar
                                            </button>
                                        ) : (
                                            <Link href="/appointments/new" className="mt-2 text-[10px] text-primary font-bold uppercase hover:underline block ml-auto">
                                                Novo Agendamento
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}
