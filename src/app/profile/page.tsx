"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { updateUserProfile } from "@/lib/profile/service";

const remoteImageLoader = ({ src }: { src: string }) => src;

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return "Erro ao conectar com o servidor.";
}

export default function ProfilePage() {
    const { user, logout, isAuthenticated } = useAuth();

    const [profile, setProfile] = useState<{ name: string, phone: string, cpf?: string, avatar_url?: string } | null>(null);
    const [totalAppointments, setTotalAppointments] = useState(0);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editCpf, setEditCpf] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);

            // Fetch Profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (profileData) {
                setProfile(profileData);
                setEditName(profileData.name || "");
                setEditPhone(profileData.phone || "");
                
                // Formatar CPF ao carregar
                let cpfFormatado = profileData.cpf || "";
                if (cpfFormatado && cpfFormatado.length === 11) {
                    cpfFormatado = cpfFormatado.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                }
                setEditCpf(cpfFormatado);
            } else {
                setEditName(user.email?.split('@')[0] || "");
            }

            // Fetch Appts count (only CONFIRMED or COMPLETED)
            const { count } = await supabase
                .from("appointments")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .in("status", ["CONFIRMED", "COMPLETED"]);

            if (count !== null) {
                setTotalAppointments(count);
            }

            setLoading(false);
        };

        fetchData();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        
        setSaveError(null);
        setSaveSuccess(false);
        setSaving(true);

        try {
            // Validações de campos obrigatórios
            const trimmedName = editName.trim() || profile?.name?.trim() || "";
            if (!trimmedName) {
                setSaveError("O campo Nome é obrigatório.");
                setSaving(false);
                return;
            }

            const unmaskedPhone = editPhone.replace(/\D/g, "") || profile?.phone?.replace(/\D/g, "") || "";
            if (!unmaskedPhone || unmaskedPhone.length < 10) {
                setSaveError("O campo Telefone é obrigatório e deve ter um formato válido.");
                setSaving(false);
                return;
            }

            // Validação de CPF (Opcional, mas se preenchido deve ser válido)
            const unmaskedCpf = editCpf.replace(/\D/g, "");
            if (unmaskedCpf && unmaskedCpf.length !== 11) {
                setSaveError("O CPF informado é inválido. Digite 11 números ou deixe em branco.");
                setSaving(false);
                return;
            }

            const updateData = {
                name: trimmedName,
                phone: unmaskedPhone,
                cpf: unmaskedCpf || null
            };

            const { success, data, error } = await updateUserProfile(supabase, user.id, updateData);

            if (!success) {
                // O serviço já logou o detalhamento, apenas lançamos para o catch do frontend
                throw error;
            }
            
            // Sucesso
            setProfile(prev => prev ? { 
                ...prev, 
                name: trimmedName, 
                phone: unmaskedPhone, 
                cpf: unmaskedCpf || undefined 
            } : { 
                name: trimmedName, 
                phone: unmaskedPhone, 
                cpf: unmaskedCpf || undefined 
            });
            
            setSaveSuccess(true);
            setTimeout(() => {
                setIsEditing(false);
                setSaveSuccess(false);
            }, 1500);

        } catch (error: any) {
            console.error("[Profile] Catch bloqueou um erro detalhado na atualização:", {
                message: error?.message || "Erro desconhecido",
                code: error?.code || "N/A",
                details: error?.details || "N/A"
            });
            
            // Tratamento específico de erros para feedback visual do usuário
            if (error?.code === '23505' && error?.message?.includes('profiles_cpf_key')) {
                setSaveError("Este CPF já está cadastrado em outra conta.");
            } else if (error?.code === '42501' || error?.code === 'NO_DATA') {
                setSaveError("Erro de sincronização. Perfil não encontrado ou sem permissão (RLS).");
            } else if (error?.message === 'Failed to fetch' || error?.message?.includes('fetch')) {
                setSaveError("Erro de conexão. Verifique sua internet e tente novamente.");
            } else {
                setSaveError(`Erro interno ao atualizar o perfil: ${error?.message || 'Tente novamente.'}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        const confirmDelete = window.confirm("Tem certeza absoluta de que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita e deletará seus agendamentos.");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const { error } = await supabase.rpc("delete_user");
            if (error) {
                console.error(error);
                alert("Erro ao deletar conta: " + error.message);
            } else {
                alert("Sua conta foi deletada com sucesso.");
                logout();
            }
        } catch (error: unknown) {
            alert(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setLoading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("Selecione uma imagem para fazer upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

            // Upload image
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            // Update user profile
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", user?.id);

            if (updateError) throw updateError;

            // Update state
            setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

        } catch (error: unknown) {
            alert(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black px-6">
                <p className="text-slate-400 mb-6">Você precisa estar logado para acessar seu perfil.</p>
                <Link href="/login" className="px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest text-xs rounded-xl">Fazer Login</Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            </div>
        );
    }

    return (
        <>
            <header className="flex items-center justify-between p-4 pt-6 bg-black/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
                    <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </Link>
                <h1 className="text-sm font-extrabold tracking-[0.2em] text-white uppercase ml-2">Meu Perfil</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto pb-[130px] hide-scrollbar relative z-10 px-6 py-6">
                <div className="flex flex-col items-center justify-center pt-6 pb-8">
                    <div className="relative mb-5 group">
                        <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                            <div className="w-28 h-28 rounded-full p-1 border-2 border-primary bg-black relative shadow-[0_0_20px_rgba(212,175,55,0.15)] overflow-hidden flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <Image src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" width={112} height={112} unoptimized loader={remoteImageLoader} />
                                ) : (
                                    <span className="material-symbols-outlined text-6xl text-primary">person</span>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-primary text-black rounded-full p-2 shadow-lg border-2 border-black flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                            </div>
                        </label>
                        <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={loading}
                            className="hidden"
                        />
                    </div>
                    {isEditing ? (
                        <div className="w-full space-y-3 mb-4">
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none text-center placeholder:text-white/20"
                                placeholder={profile?.name || user?.email?.split('@')[0] || "Seu Nome"}
                            />
                            <input
                                type="text"
                                value={editPhone}
                                onChange={e => {
                                    let val = e.target.value.replace(/\D/g, "");
                                    if (val.length <= 11) {
                                        val = val.replace(/^(\d{2})(\d)/g, "($1) $2");
                                        val = val.replace(/(\d)(\d{4})$/, "$1-$2");
                                        setEditPhone(val);
                                    }
                                }}
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none text-center placeholder:text-white/20"
                                placeholder={profile?.phone || "Seu Telefone"}
                            />
                            <input
                                type="text"
                                value={editCpf}
                                onChange={e => {
                                    let val = e.target.value.replace(/\D/g, "");
                                    if (val.length <= 11) {
                                        val = val.replace(/(\d{3})(\d)/, "$1.$2");
                                        val = val.replace(/(\d{3})(\d)/, "$1.$2");
                                        val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                                        setEditCpf(val);
                                    }
                                }}
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none text-center placeholder:text-white/20"
                                placeholder={profile?.cpf ? profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "Seu CPF (opcional)"}
                            />
                            {saveError && (
                                <p className="text-red-500 text-xs text-center font-bold">{saveError}</p>
                            )}
                            {saveSuccess && (
                                <p className="text-green-500 text-xs text-center font-bold">Perfil salvo com sucesso!</p>
                            )}
                            <div className="flex gap-2 justify-center">
                                <button onClick={() => {
                                    setIsEditing(false);
                                    setSaveError(null);
                                    setSaveSuccess(false);
                                }} className="text-xs uppercase text-slate-400 p-2 hover:text-white transition-colors">Cancelar</button>
                                <button onClick={handleSave} disabled={saving} className="text-xs uppercase text-primary font-bold p-2 flex items-center gap-2 hover:text-white transition-colors disabled:opacity-50">
                                    {saving && <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>}
                                    {saving ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight uppercase flex items-center gap-2">
                                {profile?.name || user?.email?.split('@')[0]}
                                <button onClick={() => setIsEditing(true)} className="text-primary hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                            </h2>
                            <p className="text-slate-400 text-xs font-medium tracking-widest uppercase mb-1 flex justify-center gap-3">
                                <span>{profile?.phone || "S/ Telefone"}</span>
                                {profile?.cpf && <span>• {profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</span>}
                            </p>
                            <p className="text-primary/70 text-[10px] font-bold tracking-widest uppercase mt-2">{totalAppointments} Agendamentos</p>
                        </>
                    )}
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                    <a href="https://wa.me/5512996397448" target="_blank" rel="noopener noreferrer" className="block bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/0 group-hover:bg-primary/10 blur-[40px] rounded-full -mr-16 -mt-16 transition-colors duration-500 pointer-events-none"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="size-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">help</span>
                            </div>
                            <div>
                                <span className="text-white font-extrabold block text-base mb-0.5">Ajuda e Suporte</span>
                                <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Fale com a Barbearia</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-white/50 group-hover:text-primary transition-colors relative z-10">chevron_right</span>
                    </a>

                    <div className="flex flex-col gap-3 mt-8">
                        <button onClick={logout} className="w-full bg-[#0a0a0a] border border-white/10 text-white hover:bg-[#1a1a1a] font-extrabold py-4 rounded-xl uppercase tracking-widest transition-all">
                            SAIR DA CONTA
                        </button>
                        <button onClick={handleDeleteAccount} className="w-full bg-[#0a0a0a] border border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-extrabold py-4 rounded-xl uppercase tracking-widest transition-all">
                            DELETAR CONTA PERMANENTEMENTE
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
}
