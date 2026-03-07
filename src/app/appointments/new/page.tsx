"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
};

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase.from("services").select("*").order("price", { ascending: true });
            if (data) {
                setServices(data);
            }
            setLoading(false);
        };
        fetchServices();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <>
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/5 p-4">
                <div className="flex items-center justify-between mx-auto">
                    <Link href="/" className="text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </Link>
                    <h2 className="text-white text-lg font-bold tracking-tight">Escolha o Serviço</h2>
                    <div className="size-10"></div>
                </div>
            </div>

            <main className="flex-1 w-full px-5 pt-6 pb-24">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando serviços...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {services.map((service) => (
                            <Link href={`/appointments/new/datetime?serviceId=${service.id}`} key={service.id} className="block p-5 rounded-2xl bg-[#141414] border border-white/10 hover:border-primary/50 transition-colors shadow-xl group">
                                <div className="flex items-start gap-4">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-[#bfa040] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.4)] text-black">
                                        <span className="material-symbols-outlined text-3xl">content_cut</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-extrabold text-lg leading-tight group-hover:text-primary transition-colors">{service.name}</h4>
                                        <p className="text-sm text-slate-200 mt-1 mb-2 leading-relaxed">{service.description}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                {service.duration} min
                                            </span>
                                            <span className="text-primary font-bold text-base tracking-tight">{formatPrice(service.price)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
