"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAgenda() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay);
            endOfDay.setDate(endOfDay.getDate() + 1);

            const { data } = await supabase
                .from("appointments")
                .select(`
                    id,
                    date,
                    status,
                    profiles(name, phone),
                    services(name, duration)
                `)
                .gte("date", startOfDay.toISOString())
                .lt("date", endOfDay.toISOString())
                .in("status", ["CONFIRMED", "COMPLETED"])
                .order("date", { ascending: true });

            if (data) {
                const formatted = data.map((d: any) => ({
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

    return (
        <main className="flex-1 w-full relative flex flex-col h-screen">
            <header className="px-6 py-6 bg-black/90 backdrop-blur-md sticky top-0 z-30 border-b border-white/10 shrink-0">
                <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Agenda</h1>
                
                {/* Horizontal Date Picker */}
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
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
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${apt.status === 'COMPLETED' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-500'}`}>
                                            {apt.status === 'COMPLETED' ? 'Realizado' : 'Confirmado'}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-white font-extrabold text-base tracking-tight mb-0.5">{apt.profiles?.name || 'Cliente'}</h3>
                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{apt.services?.name}</p>
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
