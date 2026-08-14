import React, { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { CurrentUser } from '../types';
import { supabaseService } from '../services/supabaseService';

interface Props { currentUser: CurrentUser; onSaved: (name: string, roleLabel: string) => void; onToast: (message: string, type?: 'success' | 'error') => void; }

export const AccountSettingsView: React.FC<Props> = ({ currentUser, onSaved, onToast }) => {
  const [displayName, setDisplayName] = useState(currentUser.nama);
  const [roleLabel, setRoleLabel] = useState(currentUser.role === 'ADMIN_KETUA_RT' ? 'Ketua RT' : 'Sekretaris RT');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim() || !roleLabel.trim()) return onToast('Nama dan label role wajib diisi.', 'error');
    setSaving(true);
    try {
      await supabaseService.updateProfile(currentUser.id || '', displayName, roleLabel);
      if (password) {
        if (password.length < 8) throw new Error('Password baru minimal 8 karakter.');
        if (password !== confirm) throw new Error('Konfirmasi password belum sama.');
        await supabaseService.updatePassword(password);
      }
      onSaved(displayName.trim(), roleLabel.trim());
      setPassword(''); setConfirm('');
      onToast('Pengaturan akun berhasil disimpan.');
    } catch (error: any) { onToast(error.message || 'Pengaturan gagal disimpan.', 'error'); }
    finally { setSaving(false); }
  };

  return <section className="max-w-4xl mx-auto flex flex-col gap-6">
    <div className="flex flex-col gap-2"><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Pengaturan akun</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Profil & keamanan</h1><p className="text-sm leading-6 text-slate-500">Kelola identitas yang tampil di dashboard dan amankan akses akun Anda.</p></div>
    <form onSubmit={saveProfile} className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5"><div className="flex items-center gap-3"><div className="size-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><UserRound className="size-5" /></div><div><h2 className="font-bold text-slate-900">Identitas pengguna</h2><p className="text-xs text-slate-500">Disimpan ke akun internal SIP3 di Supabase.</p></div></div><label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Nama tampilan<input value={displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label><label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Label role<input value={roleLabel} onChange={e => setRoleLabel(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label><div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">Username login: <span className="font-semibold text-slate-700">{currentUser.username || currentUser.email || 'Akun SIP3'}</span></div></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5"><div className="flex items-center gap-3"><div className="size-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><KeyRound className="size-5" /></div><div><h2 className="font-bold text-slate-900">Ganti password</h2><p className="text-xs text-slate-500">Kosongkan bila tidak ingin mengganti.</p></div></div><label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Password baru<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></label><label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Konfirmasi password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></label><div className="mt-auto flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="size-4 shrink-0 text-emerald-600" />Password di-hash server dan tidak pernah disimpan plaintext di browser.</div></div>
      <div className="lg:col-span-2 flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Menyimpan...' : <><CheckCircle2 className="size-4" />Simpan perubahan</>}</button></div>
    </form>
  </section>;
};
