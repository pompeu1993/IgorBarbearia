"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {/* Header */}
      <header className="grid grid-cols-3 items-center px-4 py-5 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-primary/20">
        <div className="flex items-center"></div>
        <div className="flex justify-center">
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase border border-primary/30 px-3 py-1.5 rounded bg-primary/10">
            IGOR BARBEARIA
          </div>
        </div>
        <div className="flex justify-end">
          <button className="relative p-2 rounded-full hover:bg-zinc-800 text-slate-100 transition-colors">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-black"></span>
          </button>
        </div>
      </header>

      {/* User Greeting */}
      <div className="flex flex-col items-center px-6 py-8 text-center relative z-10">
        {isAuthenticated && (
          <div className="relative mb-5 group cursor-pointer">
            <div className="w-32 h-32 rounded-full p-1.5 border-2 border-primary shadow-[0_0_25px_rgba(212,175,55,0.2)] bg-black relative">
              <img
                alt="Carlos Profile"
                className="w-full h-full object-cover rounded-full filter grayscale contrast-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrb0_aTnKRkAfGDLmDgrA5s1tNhII27yVQ2jZL2a5ALb3Rk8DXKW_pYAsN-oFEa52YpkFXMEqAxWaitoFQH-v--VHgL0a08TLfbpnOoKRGtP8PvwKNo02B4YDUJoP_UscU5Fszvd-bnpIEvHEzm1HL510MSDqKqxl5vf00rFAyKWPyOSSNOMz7VW26bQTHd-7b5iQ2e3SQMnC0iJtoyhbk4WhCbti16c_S4lXrrxukhJdGlvmcsG-iP1jHXDejCoNcrENRZ99huQA"
              />
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-black rounded-full p-2 shadow-lg border-4 border-black flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight uppercase font-display">
          {isAuthenticated ? "Olá, CARLOS" : "OLÁ, CLIENTE"}
        </h1>
        <p className="text-primary/80 text-sm font-medium tracking-wide uppercase">
          O Corte Impecável Espera por Você
        </p>
      </div>

      {/* Main Action */}
      <div className="px-6 pb-10 relative z-10">
        <Link
          href={isAuthenticated ? "/appointments/new" : "/login"}
          className="w-full h-16 bg-gradient-to-r from-primary to-[#bfa040] hover:from-[#cfaa33] hover:to-[#dcb650] text-black rounded-sm shadow-[0_4px_25px_-5px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 font-extrabold text-lg uppercase tracking-wider transition-all active:scale-[0.98] border border-white/10"
        >
          <span className="material-symbols-outlined text-[28px]">content_cut</span>
          Agendar Corte
        </Link>
      </div>

      {/* Next Appointment Section */}
      {isAuthenticated && (
        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar relative z-10">
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-4 border-l-4 border-primary pl-3">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">Próximo Horário</h2>
              <Link
                href="/appointments"
                className="text-xs font-bold text-primary hover:text-white transition-colors uppercase tracking-widest"
              >
                Ver Todos
              </Link>
            </div>

            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-sm p-0 border border-white/5 shadow-xl flex items-center overflow-hidden group">
              <div className="bg-gradient-to-b from-zinc-800 to-black text-primary w-20 self-stretch flex flex-col items-center justify-center flex-shrink-0 border-r border-white/5 group-hover:border-primary/50 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Out</span>
                <span className="text-2xl font-bold text-white">24</span>
              </div>
              <div className="flex-1 min-w-0 py-4 px-4">
                <h3 className="font-bold text-white truncate text-lg uppercase tracking-tight">
                  Degradê Americano
                </h3>
                <p className="text-xs font-medium text-slate-400 mt-1 truncate uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                  Barbeiro Mike • 10:00 AM
                </p>
              </div>
              <button className="w-12 h-full flex items-center justify-center text-slate-500 hover:text-primary transition-all hover:bg-white/5">
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
