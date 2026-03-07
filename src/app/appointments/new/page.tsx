import Link from "next/link";

export default function ServicesPage() {
    const services = [
        { id: "1", name: "Corte Moderno", duration: "30 min", price: "R$ 45,00", description: "Corte clássico ou moderno com acabamento impecável." },
        { id: "2", name: "Corte + Barba Therapy", duration: "45 min", price: "R$ 85,00", description: "O combo completo com toalha quente e massagem facial." },
        { id: "3", name: "Degradê Americano", duration: "30 min", price: "R$ 55,00", description: "Fade perfeito com finalização na navalha." },
    ];

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
                <div className="space-y-4">
                    {services.map((service) => (
                        <Link href={`/appointments/new/datetime?serviceId=${service.id}`} key={service.id} className="block p-5 rounded-2xl bg-zinc-900 border border-primary/20 hover:border-primary/50 transition-colors shadow-xl group">
                            <div className="flex items-start gap-4">
                                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-[#bfa040] flex items-center justify-center shrink-0 shadow-lg text-black">
                                    <span className="material-symbols-outlined text-3xl">content_cut</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-extrabold text-lg leading-tight group-hover:text-primary transition-colors">{service.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1 mb-2 leading-relaxed">{service.description}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            {service.duration}
                                        </span>
                                        <span className="text-primary font-bold text-sm tracking-tight">{service.price}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </>
    );
}
