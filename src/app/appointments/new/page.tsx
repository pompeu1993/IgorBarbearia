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
            const { data } = await supabase.from("services").select("*").order("price", { ascending: true });
            if (data) {
                // Filter to show only "Corte Tradicional"
                const filteredData = data.filter((service) => 
                    service.name.toLowerCase().includes("corte tradicional")
                );
                setServices(filteredData);
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

            <main className="flex-1 w-full px-5 pt-6 pb-[130px] overflow-y-auto">
                <div className="mb-8">
                    <h3 className="text-white text-xl font-bold mb-1">Serviços Disponíveis</h3>
                    <p className="text-white text-sm">Selecione o que deseja fazer hoje</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-primary text-sm font-bold tracking-widest uppercase">Carregando serviços...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {services.length === 0 ? (
                            <p className="text-white text-center py-10">Nenhum serviço encontrado.</p>
                        ) : (
                            services.map((service) => (
                                <Link 
                                    href={`/appointments/new/datetime?serviceId=${service.id}`} 
                                    key={service.id} 
                                    className="block bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 hover:border-primary/50 transition-colors shadow-lg group relative overflow-hidden"
                                >
                                    {/* Gradient Blur Effect on hover */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                                    
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="size-14 rounded-2xl bg-gradient-to-br from-[#dca715] to-[#8a680b] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] text-black">
                                            <span className="material-symbols-outlined text-3xl">content_cut</span>
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-white font-extrabold text-lg leading-tight">
                                                    {service.name}
                                                </h4>
                                                {service.name.toLowerCase().includes("corte tradicional") && (
                                                    <span className="ml-2 text-[10px] bg-primary text-black px-2 py-1 rounded font-bold uppercase tracking-widest shrink-0 shadow-sm">
                                                        Padrão
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm text-white/90 mb-3 leading-relaxed">
                                                {service.description}
                                            </p>
                                            
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                    <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                                                    <span className="text-[11px] text-white font-bold uppercase tracking-wider">
                                                        {service.duration} min
                                                    </span>
                                                </div>
                                                <span className="text-primary font-black text-lg tracking-tight">
                                                    {formatPrice(service.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </main>
        </>
    );
}
