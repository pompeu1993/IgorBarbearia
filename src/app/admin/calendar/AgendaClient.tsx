/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type AgendaAppointment = {
    id: string;
    date: string;
    status: string;
    created_at: string;
    profiles: {
        name: string;
        phone: string;
        cpf: string;
    } | null;
    services: {
        name: string;
        duration: number;
        price: number;
    } | null;
};

type AgendaAppointmentRow = {
    id: string;
    date: string;
    status: string;
    created_at: string;
    profiles: AgendaAppointment["profiles"] | AgendaAppointment["profiles"][];
    services: AgendaAppointment["services"] | AgendaAppointment["services"][];
};

export default function AgendaClient() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);

            const { data, error } = await supabase
                .from("appointments")
                .select(`
                    id,
                    date,
                    status,
                    user_id,
                    created_at,
                    profiles(name, phone, cpf),
                    services(name, duration, price)
                `)
                .gte("date", startOfDay.toISOString())
                .lt("date", endOfDay.toISOString())
                .eq("status", "CONFIRMED")
                .order("date", { ascending: true });

            if (error) {
                console.error("Erro ao buscar appointments:", error);
                setLoading(false);
                return;
            }

            if (data) {
                const formatted: AgendaAppointment[] = (data as AgendaAppointmentRow[]).map((d) => ({
                    ...d,
                    profiles: Array.isArray(d.profiles) ? d.profiles[0] : d.profiles,
                    services: Array.isArray(d.services) ? d.services[0] : d.services,
                }));
                setAppointments(formatted);
            }
            setLoading(false);
        };

        fetchAppointments();
    }, [selectedDate]);

    // Generate next 14 days for calendar slider
    const days = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleLogout = async () => {
        // Obter os dados do ghost user local antes de deslogar o admin
        const ghostEmail = localStorage.getItem("ghostEmail");
        const ghostPassword = localStorage.getItem("ghostPassword");
        const guestName = localStorage.getItem("guestName");
        
        await supabase.auth.signOut();
        
        // Se houver dados de um ghost user salvos, logar de volta silenciosamente
        if (ghostEmail && ghostPassword) {
            try {
                await supabase.auth.signInWithPassword({
                    email: ghostEmail,
                    password: ghostPassword
                });
                if (guestName) {
                    sessionStorage.setItem("cachedProfileName", guestName);
                }
            } catch (err) {
                console.error("Falha ao restaurar sessão ghost:", err);
            }
        }
        
        window.location.href = "/";
    };

    return (
        <main className="flex-1 w-full relative flex flex-col h-screen">
            <header className="px-6 py-6 bg-black/90 backdrop-blur-md sticky top-0 z-30 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest">Agenda</h1>
                    <button onClick={handleLogout} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
                
                {/* Horizontal Date Picker */}
                <div 
                    className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 cursor-grab active:cursor-grabbing touch-pan-x"
                    onMouseDown={(e) => {
                        const ele = e.currentTarget;
                        const startX = e.pageX - ele.offsetLeft;
                        const scrollLeft = ele.scrollLeft;
                        
                        const handleMouseMove = (e: MouseEvent) => {
                            e.preventDefault();
                            const x = e.pageX - ele.offsetLeft;
                            const walk = (x - startX) * 2;
                            ele.scrollLeft = scrollLeft - walk;
                        };
                        
                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    {days.map((d, i) => {
                        const isSelected = d.toDateString() === selectedDate.toDateString();
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(d)}
                                className={`flex flex-col items-center justify-center min-w-[60px] p-3 rounded-2xl border transition-all ${
                                    isSelected 
                                        ? 'bg-primary border-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-black/70' : ''}`}>
                                    {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                </span>
                                <span className="text-lg font-black">{d.getDate().toString().padStart(2, '0')}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 relative">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-white/5">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">event_available</span>
                        <p className="text-slate-400 text-sm font-medium">Nenhum agendamento para este dia.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-white/10 ml-4 pl-6 space-y-8 pb-20">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[31px] top-4 size-4 rounded-full bg-black border-2 border-primary flex items-center justify-center z-10 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                                    <div className="size-1.5 bg-primary rounded-full"></div>
                                </div>
                                
                                <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <span className="text-primary font-black text-xl tracking-tight">{formatTime(apt.date)}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                            apt.status === 'COMPLETED' ? 'bg-primary/20 text-primary' : 
                                            apt.status === 'PENDING' ? 'bg-red-500/20 text-red-500' :
                                            'bg-green-500/20 text-green-500'
                                        }`}>
                                            {apt.status === 'COMPLETED' ? 'Realizado' : apt.status === 'PENDING' ? 'Aguardando Pagamento' : 'Confirmado'}
                                        </span>
                                    </div>
                                    <div className="relative z-10 mb-4">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className="text-white font-extrabold text-base tracking-tight">{apt.profiles?.name || 'Cliente'}</h3>
                                            <span className="text-primary font-black text-sm tracking-tight">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.services?.price || 0)}
                                            </span>
                                        </div>
                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{apt.services?.name}</p>
                                        <p className="text-slate-500 text-[10px] font-medium mb-3">
                                            Feito em: {new Date(apt.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                            {apt.profiles?.cpf && ` • CPF: ${apt.profiles.cpf}`}
                                        </p>
                                        
                                        {apt.profiles?.phone && (
                                            <a href={`https://wa.me/55${apt.profiles.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-green-400 transition-colors uppercase tracking-widest font-bold inline-flex">
                                                <span className="material-symbols-outlined text-[14px]">chat</span>
                                                WhatsApp
                                            </a>
                                        )}
                                    </div>
                                    
                                    <div className="relative z-10 pt-3 border-t border-white/5 flex justify-end">
                                        <Link
                                            href={`/appointments/reschedule?appointmentId=${apt.id}`}
                                            className="text-[10px] font-bold text-black uppercase tracking-widest transition-colors bg-primary hover:bg-[#cfaa33] px-4 py-2 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                                        >
                                            Reagendar
                                        </Link>
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
