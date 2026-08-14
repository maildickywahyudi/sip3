import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Sparkles,
  BadgeCheck
} from 'lucide-react';
import { CurrentUser, UserRole, RTConfig } from '../types';
import { BekasiLogo } from './BekasiLogo';

interface LoginPortalProps {
  currentUser: CurrentUser;
  config: RTConfig;
  onLogin: (user: CurrentUser) => void;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  currentUser,
  config,
  onLogin,
  onClose,
  isFullPage = false
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || 'ADMIN_KETUA_RT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Strictly 2 Roles: RT and Sekretaris
  const rolesInfo = [
    {
      id: 'ADMIN_KETUA_RT' as UserRole,
      title: `Ketua RT 004 (${config.namaKetuaRT || 'Bpk. Yanto'})`,
      subtitle: 'Administrator Utama & Penandatangan Resmi',
      description: 'Hak akses penuh: persetujuan surat pengantar resmi, pengesahan mutasi, otorisasi data kependudukan, dan pengaturan stempel.',
      defaultName: `${config.namaKetuaRT || 'Yanto'} (Ketua RT 004)`,
      defaultUsername: 'ketua_rt004',
      badge: 'Ketua RT 004',
      badgeColor: 'bg-emerald-600 text-white',
      borderActive: 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50',
      icon: Shield
    },
    {
      id: 'ADMIN_SEKRETARIS' as UserRole,
      title: `Sekretaris RT 004 (${config.namaSekretaris || 'Ahmad Fauzi, S.Kom.'})`,
      subtitle: 'Sekretariat & Pelayanan Kependudukan',
      description: 'Pengelolaan data KK, pendaftaran warga baru, pembuatan draf surat pengantar, pencatatan mutasi, dan pembukuan arsip.',
      defaultName: `${config.namaSekretaris || 'Ahmad Fauzi, S.Kom.'} (Sekretaris RT 004)`,
      defaultUsername: 'sekretaris_rt004',
      badge: 'Sekretaris RT',
      badgeColor: 'bg-blue-600 text-white',
      borderActive: 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50',
      icon: FileText
    }
  ];

  const handleQuickLogin = (role: UserRole, customName: string) => {
    setErrorMessage('');
    setIsLoading(true);
    setSuccessMessage(`Mengautentikasi ${customName}...`);
    
    setTimeout(() => {
      onLogin({
        role,
        nama: customName,
        isAuthenticated: true,
        isLoggedIn: true
      });
      setIsLoading(false);
      if (onClose) onClose();
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const validPasswords = ['1234', 'rt004', 'sekretaris', 'admin123', 'jatimulya', '0047', '2026'];
    
    // Check password if entered
    if (password && !validPasswords.includes(password.trim().toLowerCase())) {
      setErrorMessage('Password / PIN Admin salah. (Gunakan PIN default: 1234 atau klik tombol Masuk Cepat)');
      setIsLoading(false);
      return;
    }

    const currentRoleObj = rolesInfo.find(r => r.id === selectedRole);
    const finalName = username.trim() || (currentRoleObj ? currentRoleObj.defaultName : 'Admin RT 004');

    setSuccessMessage(`Login berhasil sebagai ${finalName}`);
    setTimeout(() => {
      onLogin({
        role: selectedRole,
        nama: finalName,
        isAuthenticated: true,
        isLoggedIn: true
      });
      setIsLoading(false);
      if (onClose) onClose();
    }, 400);
  };

  const activeRoleObj = rolesInfo.find(r => r.id === selectedRole) || rolesInfo[0];
  const isStandalone = isFullPage || !onClose;

  const cardContent = (
    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row my-auto animate-in zoom-in-95 duration-200">
      {/* Left Side: Official Identity Branding */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 sm:p-8 md:w-5/12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          {/* Logo Lambang Kabupaten Bekasi */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="bg-white/10 p-2.5 rounded-2xl border border-white/15 shadow-inner backdrop-blur-xs">
              <BekasiLogo className="w-12 h-14" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">Pemerintah Kabupaten Bekasi</div>
              <h1 className="text-base font-bold text-white tracking-tight">Kecamatan Tambun Selatan</h1>
              <p className="text-xs text-slate-300 font-medium">Kelurahan Jatimulya</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2 mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portal Resmi Pengurus RT</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight leading-snug">
              Sistem Kependudukan RT 004 RW 007 Kelurahan Jatimulya
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Layanan administrasi kependudukan terpadu, persuratan pengantar resmi berkop &amp; QR, manajemen KK, mutasi penduduk, dan sinkronisasi data warga.
            </p>
          </div>

          {/* Officer Names Box (RT & Sekretaris Only) */}
          <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Ketua RT 004 :</span>
              <span className="font-bold text-emerald-300">{config.namaKetuaRT || 'Yanto'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2">
              <span className="text-slate-400 font-medium">Sekretaris RT :</span>
              <span className="font-bold text-blue-300">{config.namaSekretaris || 'Ahmad Fauzi, S.Kom.'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-2">
              <span className="text-slate-400 font-medium">Sekretariat :</span>
              <span className="font-medium text-slate-200 truncate max-w-[170px]" title={config.alamatSekretariat}>
                {config.alamatSekretariat || 'jl jampang no 111 jatimulya'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer security note */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Akses Khusus Pengurus RT
          </span>
          <span className="font-mono text-emerald-400/80">E-RT 2026</span>
        </div>
      </div>

      {/* Right Side: Role Selector & Login Form */}
      <div className="p-6 sm:p-8 md:w-7/12 flex flex-col justify-between bg-white overflow-y-auto max-h-[85vh] md:max-h-none">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Portal Login Pengurus</h3>
              <p className="text-xs text-slate-500 mt-0.5">Silakan pilih peran dan masukkan kredensial untuk masuk ke dashboard</p>
            </div>
            {onClose && !isStandalone && (
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
              >
                <span>✕ Tutup</span>
              </button>
            )}
          </div>

          {/* Role Selection Tabs (Only 2 Roles: RT & Sekretaris) */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {rolesInfo.map((r) => {
              const isSelected = selectedRole === r.id;
              const IconComp = r.icon;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r.id);
                    setUsername(r.defaultUsername);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected 
                      ? r.borderActive 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs ${
                      isSelected ? r.badgeColor : 'bg-slate-100 text-slate-600'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? r.badgeColor : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-xs text-slate-900">{r.title}</div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{r.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick 1-Click Access Pill */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-slate-600 truncate">
                Masuk cepat sebagai <span className="font-bold text-slate-900">{activeRoleObj.defaultName}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin(activeRoleObj.id, activeRoleObj.defaultName)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-emerald-600 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Masuk 1-Klik</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form Login with Password */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / ID Pengurus:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={`Contoh: ${activeRoleObj.defaultUsername}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password / PIN Keamanan Admin:
                </label>
                <span className="text-[10px] text-slate-400">Default PIN: <strong className="text-slate-600 font-mono">1234</strong></span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan PIN / Password (Default: 1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Ingat sesi di perangkat ini</span>
              </label>
              <button
                type="button"
                onClick={() => setPassword('1234')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold text-[11px] underline cursor-pointer"
              >
                Gunakan PIN Default 1234
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-semibold animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <BadgeCheck className="w-4 h-4" />
                <span>Masuk Sebagai {activeRoleObj.badge}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Sistem Kependudukan RT 004 RW 007</span>
          <span>Kelurahan Jatimulya</span>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>
        <div className="relative z-10 w-full flex flex-col items-center">
          {cardContent}
          <p className="text-center text-slate-500 text-xs mt-6">
            &copy; {new Date().getFullYear()} Pemerintah Kelurahan Jatimulya &bull; Rukun Tetangga 004 Rukun Warga 007
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/70 fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto backdrop-blur-md">
      {cardContent}
    </div>
  );
};
