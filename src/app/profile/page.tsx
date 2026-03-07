import Link from "next/link";

export default function ProfilePage() {
    return (
        <>
            <header className="flex items-center justify-between p-4 pt-6 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white uppercase ml-2">Meu Perfil</h1>
                <button className="relative p-2 rounded-full hover:bg-zinc-800 text-slate-100 transition-colors">
                    <span className="material-symbols-outlined text-[24px]">settings</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar relative z-10 px-6 py-6">
                <div className="flex flex-col items-center justify-center pt-6 pb-8">
                    <div className="relative mb-5 group">
                        <div className="w-28 h-28 rounded-full p-1 border-2 border-primary bg-black relative shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                            <img
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full filter grayscale contrast-110"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrb0_aTnKRkAfGDLmDgrA5s1tNhII27yVQ2jZL2a5ALb3Rk8DXKW_pYAsN-oFEa52YpkFXMEqAxWaitoFQH-v--VHgL0a08TLfbpnOoKRGtP8PvwKNo02B4YDUJoP_UscU5Fszvd-bnpIEvHEzm1HL510MSDqKqxl5vf00rFAyKWPyOSSNOMz7VW26bQTHd-7b5iQ2e3SQMnC0iJtoyhbk4WhCbti16c_S4lXrrxukhJdGlvmcsG-iP1jHXDejCoNcrENRZ99huQA"
                            />
                        </div>
                        <button className="absolute bottom-0 right-0 bg-primary text-black rounded-full p-2 shadow-lg border-2 border-black flex items-center justify-center hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1 tracking-tight uppercase">Carlos Silva</h2>
                    <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Membro Premium</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">person</span>
                            </div>
                            <div>
                                <span className="text-white font-bold block">Dados Pessoais</span>
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Nome, E-mail, Telefone</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">notifications</span>
                            </div>
                            <div>
                                <span className="text-white font-bold block">Notificações</span>
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Avisos e Lembretes</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">help</span>
                            </div>
                            <div>
                                <span className="text-white font-bold block">Ajuda e Suporte</span>
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Fale com a Barbearia</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                    </div>

                    <button className="w-full mt-8 bg-black border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-extrabold py-4 rounded-xl uppercase tracking-widest transition-all">
                        SAIR DA CONTA
                    </button>
                </div>
            </main>
        </>
    );
}
