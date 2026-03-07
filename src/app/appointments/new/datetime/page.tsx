"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
};

function DateTimeSelection() {
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId");
    const { isAuthenticated } = useAuth();

    const [service, setService] = useState<Service | null>(null);
    const [loadingService, setLoadingService] = useState(true);

    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d;
    });

    // Select today by default if it's the current month, else null
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (!serviceId) return;
        const fetchService = async () => {
            const { data } = await supabase.from("services").select("*").eq("id", serviceId).single();
            if (data) setService(data);
            setLoadingService(false);
        };
        fetchService();
    }, [serviceId]);

    // Fetch appointments for the selected date
    useEffect(() => {
        if (!selectedDate) {
            setBookedSlots([]);
            return;
        }

        const fetchAppointments = async () => {
            setLoadingSlots(true);
            const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
            const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

            const { data } = await supabase
                .from("appointments")
                .select("date")
                .gte("date", start.toISOString())
                .lte("date", end.toISOString())
                .in("status", ["PENDING", "CONFIRMED"]);

            if (data) {
                // Extracts "HH:mm" from local time
                const slots = data.map(app => {
                    const d = new Date(app.date);
                    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                });
                setBookedSlots(slots);
            } else {
                setBookedSlots([]);
            }
            setLoadingSlots(false);
            // Reset selected time when date changes
            setSelectedTime(null);
        };

        fetchAppointments();
    }, [selectedDate]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const nextMonth = () => {
        const m = new Date(currentMonth);
        m.setMonth(m.getMonth() + 1);
        setCurrentMonth(m);
    };

    const prevMonth = () => {
        const m = new Date(currentMonth);
        m.setMonth(m.getMonth() - 1);
        setCurrentMonth(m);
    };

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    };

    const isPastDay = (d: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
    };

    // Combine Date and Time
    const finalDateTimeStr = (() => {
        if (!selectedDate || !selectedTime) return null;
        const [hours, minutes] = selectedTime.split(":").map(Number);
        const dt = new Date(selectedDate);
        dt.setHours(hours, minutes, 0, 0);
        return dt.toISOString();
    })();

    // Generate timeslots (simple 30 minute jumps)
    const morningSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
    const afternoonSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];

    const renderTimeBtn = (time: string) => {
        const isBooked = bookedSlots.includes(time);
        const isSelected = selectedTime === time;

        const isPastTime = (() => {
            if (!selectedDate) return false;
            const today = new Date();
            if (!isSameDay(selectedDate, today)) return false;
            const [h, m] = time.split(":").map(Number);
            return (today.getHours() * 60 + today.getMinutes()) >= (h * 60 + m);
        })();

        const disabled = isBooked || isPastTime;

        if (disabled) {
            return (
                <button key={time} disabled className="py-3 rounded-xl border border-white/5 bg-[#111] text-sm font-medium text-slate-500 cursor-not-allowed line-through opacity-60">
                    {time}
                </button>
            );
        }

        if (isSelected) {
            return (
                <button key={time} onClick={() => setSelectedTime(time)} className="py-3 rounded-xl bg-primary text-black text-sm font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] relative overflow-hidden transition-all duration-300">
                    {time}
                    <div className="absolute top-0 right-0 p-1">
                        <span className="material-symbols-outlined text-[12px] font-black">check_circle</span>
                    </div>
                </button>
            );
        }

        return (
            <button key={time} onClick={() => setSelectedTime(time)} className="py-3 rounded-xl border border-white/20 bg-[#1A1A1A] text-sm font-bold text-white hover:bg-white/5 hover:border-primary/50 transition-colors">
                {time}
            </button>
        );
    };

    if (loadingService || !service) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando...</p>
            </div>
        );
    }

    return (
        <>
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 p-4">
                <div className="flex items-center justify-between mx-auto">
                    <Link href="/appointments/new" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold tracking-tight">Agendar Horário</h2>
                    <div className="size-10"></div>
                </div>
            </div>

            <main className="flex-1 w-full px-5 pb-40">
                <div className="mt-6 p-4 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4 shadow-2xl">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                        <span className="material-symbols-outlined text-black text-2xl">content_cut</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{service.name}</h3>
                        <p className="text-slate-300 text-sm font-medium">{service.duration} min • {formatPrice(service.price)}</p>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-bold capitalize">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button onClick={nextMonth} className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-zinc-900 rounded-2xl p-4 border border-white/5 shadow-xl">
                        <div className="grid grid-cols-7 mb-4">
                            {weekDays.map(w => (
                                <div key={w} className="text-primary/50 text-[10px] font-black uppercase text-center">{w}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendar().map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} className="h-12"></div>;

                                const isPast = isPastDay(day);
                                const isSelected = selectedDate && isSameDay(selectedDate, day);

                                if (isPast) {
                                    return (
                                        <div key={day.toISOString()} className="h-12 flex items-center justify-center opacity-20">
                                            <span className="text-sm">{day.getDate()}</span>
                                        </div>
                                    );
                                }

                                if (isSelected) {
                                    return (
                                        <button key={day.toISOString()} className="h-12 flex flex-col items-center justify-center rounded-xl bg-primary text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] ring-2 ring-primary ring-offset-4 ring-offset-zinc-900">
                                            <span className="text-sm font-black">{day.getDate()}</span>
                                            <div className="w-1 h-1 bg-black rounded-full mt-0.5"></div>
                                        </button>
                                    );
                                }

                                return (
                                    <button onClick={() => setSelectedDate(day)} key={day.toISOString()} className="h-12 flex flex-col items-center justify-center rounded-xl hover:bg-white/5 transition-all">
                                        <span className="text-sm font-bold text-white">{day.getDate()}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-8">
                    {loadingSlots ? (
                        <div className="text-center text-primary/70 text-sm py-10 animate-pulse">Buscando horários disponíveis...</div>
                    ) : selectedDate ? (
                        <>
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary text-lg">light_mode</span>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Manhã</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {morningSlots.map(time => renderTimeBtn(time))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary text-lg">wb_twilight</span>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tarde / Noite</h4>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {afternoonSlots.map(time => renderTimeBtn(time))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-slate-500 text-sm py-10">Selecione uma data para ver os horários.</div>
                    )}
                </div>
            </main>

            <div className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-white/5 p-5 pb-safe z-40 max-w-md mx-auto mb-[72px] transition-transform duration-500 ${selectedDate && selectedTime ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Resumo</span>
                            <span className="text-white text-sm font-bold">
                                {selectedDate && weekDays[selectedDate.getDay()]}, {selectedDate?.getDate()} {selectedDate && monthNames[selectedDate.getMonth()].slice(0, 3)} • {selectedTime}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-primary text-lg font-black tracking-tight">{formatPrice(service.price)}</span>
                        </div>
                    </div>
                    {isAuthenticated ? (
                        <Link href={`/appointments/new/summary?serviceId=${serviceId}&datetime=${finalDateTimeStr}`} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
                            <span>Confirmar Horário</span>
                            <span className="material-symbols-outlined font-black">calendar_check</span>
                        </Link>
                    ) : (
                        <Link href={`/login?redirect=/appointments/new/summary?serviceId=${serviceId}&datetime=${finalDateTimeStr}`} className="w-full h-16 bg-gradient-to-r from-[#dca715] via-primary to-[#dca715] text-black rounded-2xl font-black text-lg shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
                            <span>Fazer Login para Confirmar</span>
                            <span className="material-symbols-outlined font-black">lock</span>
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}

export default function DateTimePage() {
    return (
        <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando horários...</p>
        </div>}>
            <DateTimeSelection />
        </Suspense>
    );
}
