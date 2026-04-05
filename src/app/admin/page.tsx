"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AdminAppointment {
    id: string;
    date: string;
    status: string;
    profiles: {
        name: string;
        phone: string;
    };
    services: {
        name: string;
    };
}

type AdminAppointmentRow = {
    id: string;
    date: string;
    status: string;
    profiles: AdminAppointment["profiles"] | AdminAppointment["profiles"][];
    services: AdminAppointment["services"] | AdminAppointment["services"][];
};

export default function AdminHome() {
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTodayAppointments = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data } = await supabase
                .from("appointments")
                .select(`
                    id,
                    date,
                    status,
                    user_id,
                    profiles(name, phone),
                    services(name)
                `)
                .gte("date", today.toISOString())
                .lt("date", tomorrow.toISOString())
                .in("status", ["CONFIRMED", "COMPLETED", "PENDING"])
                .order("date", { ascending: true });

            if (error) {
                console.error("Erro ao buscar appointments:", error);
                setLoading(false);
                return;
            }

            if (data) {
                const formatted: AdminAppointment[] = (data as AdminAppointmentRow[]).map((d) => ({
                    id: d.id,
                    date: d.date,
                    status: d.status,
                    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles,
                    services: Array.isArray(d.services) ? d.services[0] : d.services,
                }));
                setAppointments(formatted);
            }
            setLoading(false);
        };

        fetchTodayAppointments();
    }, []);

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    return (
        <main className="flex-1 w-full relative">
            <header className="px-6 py-8 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest">Resumo de Hoje</h1>
                    <p className="text-primary text-xs font-bold tracking-widest mt-1">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                </div>
                <Link href="/" className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                </Link>
            </header>

            <div className="px-6 pt-6 pb-20">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-white/5">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">event_busy</span>
                        <p className="text-slate-400 text-sm font-medium">Nenhum agendamento para hoje.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex items-start gap-4 shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#dca715] to-[#8a680b]"></div>
                                
                                <div className="shrink-0 flex flex-col items-center justify-center bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                                    <span className="text-white font-black text-lg">{formatTime(apt.date)}</span>
                                </div>
                                
                                <div className="flex-1 relative z-10">
                                    <h3 className="text-white font-extrabold text-base tracking-tight mb-0.5">{apt.profiles?.name || 'Cliente'}</h3>
                                    <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">{apt.services?.name}</p>
                                    <div className="flex items-center gap-3">
                                        {apt.profiles?.phone && (
                                            <a href={`https://wa.me/55${apt.profiles.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-green-400 transition-colors uppercase tracking-widest font-bold">
                                                <span className="material-symbols-outlined text-[14px]">chat</span>
                                                WhatsApp
                                            </a>
                                        )}
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${apt.status === 'COMPLETED' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-500'}`}>
                                            {apt.status === 'COMPLETED' ? 'Realizado' : 'Confirmado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
