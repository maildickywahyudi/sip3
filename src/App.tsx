import React, { useState, useEffect } from 'react';
import { 
  storageService 
} from './services/storage';
import { 
  Warga, 
  KartuKeluarga, 
  SuratPengantar, 
  MutasiPenduduk, 
  RTConfig, 
  CurrentUser, 
  AppNotification 
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DataWargaView } from './components/DataWargaView';
import { DataKKView } from './components/DataKKView';
import { SuratPengantarView } from './components/SuratPengantarView';
import { MutasiPendudukView } from './components/MutasiPendudukView';
import { BansosPrioritasView } from './components/BansosPrioritasView';
import { TemplateSuratView } from './components/TemplateSuratView';
import { AuditLogView } from './components/AuditLogView';
import { IntegrasiView } from './components/IntegrasiView';
import { KopSuratSettings } from './components/KopSuratSettings';
import { SearchModal } from './components/SearchModal';
import { NotificationModal } from './components/NotificationModal';
import { LoginPortal } from './components/LoginPortal';
import { AccountSettingsView } from './components/AccountSettingsView';
import { supabaseService } from './services/supabaseService';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data States
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [kkList, setKkList] = useState<KartuKeluarga[]>([]);
  const [suratList, setSuratList] = useState<SuratPengantar[]>([]);
  const [mutasiList, setMutasiList] = useState<MutasiPenduduk[]>([]);
  const [rtConfig, setRtConfig] = useState<RTConfig>(storageService.getRTConfig());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(storageService.getCurrentUser());

  // Modal Visibility States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Selected entities for deep-linking across views
  const [selectedWargaId, setSelectedWargaId] = useState<string | null>(null);
  const [selectedKKId, setSelectedKKId] = useState<string | null>(null);
  const [selectedSuratId, setSelectedSuratId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state from storage service
  const refreshAllData = async () => {
    setRtConfig(storageService.getRTConfig());
    setNotifications(storageService.getNotifications());
    setCurrentUser(storageService.getCurrentUser());
    try {
      const cloud = await supabaseService.loadCloudData();
      setWargaList(cloud.warga);
      setKkList(cloud.kk);
      setSuratList(cloud.surat);
      setMutasiList(cloud.mutasi);
      storageService.saveWargaList(cloud.warga);
      storageService.saveKKList(cloud.kk);
      storageService.saveSurat(cloud.surat);
      storageService.saveMutasi(cloud.mutasi);
    } catch (error) {
      setWargaList([]); setKkList([]); setSuratList([]); setMutasiList([]);
      showToast('Data cloud belum dapat dimuat. Silakan login dan periksa koneksi Supabase.', 'info');
    }
  };

  useEffect(() => {
    // Initial load
    refreshAllData();
    const unsubscribeAuth = supabaseService.onAuthStateChange((user) => {
      if (user) {
        const role = user.user_metadata?.role === 'ADMIN_SEKRETARIS' ? 'ADMIN_SEKRETARIS' : 'ADMIN_KETUA_RT';
        const sessionUser: CurrentUser = { id: user.id, role, nama: user.user_metadata?.display_name || user.email || 'Pengurus RT', username: user.email, email: user.email, isAuthenticated: true, isLoggedIn: true };
        storageService.setCurrentUser(sessionUser);
        setCurrentUser(sessionUser);
      } else {
        storageService.logout();
        setCurrentUser(storageService.getCurrentUser());
      }
    });

    // Subscribe to storage changes
    const unsubscribe = storageService.subscribe(() => {
      refreshAllData();
    });

    // Keyboard shortcut for Search (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Warga Handlers
  const handleSaveWarga = async (warga: Warga) => {
    try { await supabaseService.upsertCloud('warga_rt004', warga); await refreshAllData(); showToast(`Data warga ${warga.nama} berhasil disimpan!`); } catch { showToast('Data warga gagal disimpan ke Supabase.', 'error'); }
  };

  const handleDeleteWarga = async (id: string) => {
    try { await supabaseService.deleteCloud('warga_rt004', id); await refreshAllData(); showToast('Data warga berhasil dihapus.', 'info'); } catch { showToast('Data warga gagal dihapus.', 'error'); }
  };

  // KK Handlers
  const handleSaveKK = async (kk: KartuKeluarga) => {
    try { await supabaseService.upsertCloud('kartu_keluarga_rt004', kk); await refreshAllData(); showToast(`Kartu Keluarga ${kk.nomorKK} berhasil disimpan!`); } catch { showToast('Kartu Keluarga gagal disimpan ke Supabase.', 'error'); }
  };

  const handleDeleteKK = async (id: string) => {
    try { await supabaseService.deleteCloud('kartu_keluarga_rt004', id); await refreshAllData(); showToast('Data Kartu Keluarga berhasil dihapus.', 'info'); } catch { showToast('Data Kartu Keluarga gagal dihapus.', 'error'); }
  };

  // Surat Pengantar Handlers
  const handleAddSurat = async (suratData: any) => {
    try { const created = { ...suratData, id: suratData.id || `surat-${Date.now()}` }; await supabaseService.upsertCloud('surat_pengantar_rt004', created); await refreshAllData(); showToast(`Surat pengantar ${created.nomorSurat} berhasil dibuat!`); setSelectedSuratId(created.id); setActiveTab('surat'); } catch { showToast('Surat gagal disimpan ke Supabase.', 'error'); }
  };

  const handleUpdateSuratStatus = async (id: string, status: 'DISETUJUI' | 'DITOLAK', alasan?: string) => {
    try { await supabaseService.upsertCloud('surat_pengantar_rt004', { id, status, alasanPenolakan: alasan, tanggalDisetujui: status === 'DISETUJUI' ? new Date().toISOString().slice(0, 10) : null }); await refreshAllData(); showToast(status === 'DISETUJUI' ? 'Surat pengantar telah disetujui & siap dicetak!' : 'Surat permohonan telah ditolak.'); } catch { showToast('Status surat gagal diperbarui.', 'error'); }
  };

  const handleDeleteSurat = async (id: string) => {
    try { await supabaseService.deleteCloud('surat_pengantar_rt004', id); await refreshAllData(); showToast('Arsip surat berhasil dihapus.', 'info'); } catch { showToast('Arsip surat gagal dihapus.', 'error'); }
  };

  // Mutasi Handlers
  const handleAddMutasi = async (mutasi: MutasiPenduduk) => {
    try { await supabaseService.upsertCloud('mutasi_penduduk_rt004', { ...mutasi, id: mutasi.id || `mutasi-${Date.now()}` }); await refreshAllData(); showToast(`Mutasi penduduk ${mutasi.namaWarga} berhasil dicatat.`); } catch { showToast('Mutasi gagal disimpan ke Supabase.', 'error'); }
  };

  const handleDeleteMutasi = async (id: string) => {
    try { await supabaseService.deleteCloud('mutasi_penduduk_rt004', id); await refreshAllData(); showToast('Catatan mutasi dihapus.', 'info'); } catch { showToast('Catatan mutasi gagal dihapus.', 'error'); }
  };

  // Bansos update
  const handleUpdateBansos = (wargaId: string, statusBansos: any, keterangan?: string) => {
    const target = wargaList.find(w => w.id === wargaId);
    if (target) {
      const updated: Warga = {
        ...target,
        statusBansos,
        keteranganBansos: keterangan || target.keteranganBansos
      };
      storageService.saveWarga(updated);
      showToast(`Status bansos ${target.nama} diperbarui ke ${statusBansos}.`);
    }
  };

  // Config Update
  const handleUpdateConfig = (newConfig: RTConfig) => {
    storageService.saveRTConfig(newConfig);
    showToast('Pengaturan instansi RT 004 RW 007 berhasil diperbarui.');
  };

  // Excel Handlers
  const handleExportExcel = () => {
    storageService.exportToExcel();
    showToast('Berkas Excel kependudukan RT 004 berhasil diunduh!');
  };

  const handleImportExcel = async (file: File) => {
    try {
      const res = await storageService.importFromExcel(file);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(`Impor gagal: ${res.message}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error impor: ${err.message}`, 'error');
    }
  };

  // Reset Data
  const handleResetData = () => {
    storageService.resetToInitial();
    showToast('Data kependudukan berhasil direset ke pengaturan bawaan.', 'info');
  };

  // Navigation Deep Links
  const handleSelectFromSearch = (type: 'WARGA' | 'KK' | 'SURAT', id: string) => {
    if (type === 'WARGA') {
      setSelectedWargaId(id);
      setActiveTab('warga');
    } else if (type === 'KK') {
      setSelectedKKId(id);
      setActiveTab('kk');
    } else if (type === 'SURAT') {
      setSelectedSuratId(id);
      setActiveTab('surat');
    }
  };

  const handleCreateSuratForWarga = (warga: Warga) => {
    setSelectedWargaId(warga.id);
    setActiveTab('surat');
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    storageService.logout();
    setCurrentUser(storageService.getCurrentUser());
    showToast('Sesi administrasi telah ditutup. Silakan login kembali.', 'info');
  };

  // Gateway check: Show Login Portal first before entering dashboard
  if (!currentUser?.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans selection:bg-emerald-500 selection:text-white">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`px-4 py-3 rounded-full shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-slate-900 text-white border-slate-800' :
              toastMessage.type === 'info' ? 'bg-blue-900 text-blue-100 border-blue-800' :
              'bg-rose-900 text-rose-100 border-rose-800'
            }`}>
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        <LoginPortal
          isFullPage={true}
          currentUser={currentUser}
          config={rtConfig}
          onLogin={(user) => {
            storageService.setCurrentUser(user);
            setCurrentUser(user);
            showToast(`Selamat Datang, ${user.nama}! Berhasil masuk ke dashboard.`);
            setActiveTab('dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 flex font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-full shadow-lg border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success' ? 'bg-slate-900 text-white border-slate-800' :
            toastMessage.type === 'info' ? 'bg-blue-900 text-blue-100 border-blue-800' :
            'bg-rose-900 text-rose-100 border-rose-800'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
      <div className="no-print">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedWargaId(null);
            setSelectedKKId(null);
            setSelectedSuratId(null);
            setActiveTab(tab);
          }}
          config={rtConfig}
          currentUser={currentUser}
          pendingSuratCount={suratList.filter(s => s.status === 'PENDING').length}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onExportExcel={handleExportExcel}
        />
      </div>

      {/* Right Column: Top Bar + Main Content Area + Footer */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedWargaId(null);
            setSelectedKKId(null);
            setSelectedSuratId(null);
            setActiveTab(tab);
          }}
          config={rtConfig}
          currentUser={currentUser}
          notifications={notifications}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          pendingSuratCount={suratList.filter(s => s.status === 'PENDING').length}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-9 no-print">
        {activeTab === 'dashboard' && (
          <DashboardView
            wargaList={wargaList}
            kkList={kkList}
            suratList={suratList}
            mutasiList={mutasiList}
            config={rtConfig}
            currentUser={currentUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onQuickAddKK={() => setActiveTab('kk')}
            onQuickAddWarga={() => setActiveTab('warga')}
            onQuickAddSurat={() => setActiveTab('surat')}
            onExportExcel={handleExportExcel}
            onApproveSurat={(id) => handleUpdateSuratStatus(id, 'DISETUJUI')}
          />
        )}

        {activeTab === 'warga' && (
          <DataWargaView
            wargaList={wargaList}
            kkList={kkList}
            config={rtConfig}
            onSaveWarga={handleSaveWarga}
            onDeleteWarga={handleDeleteWarga}
            onCreateSurat={handleCreateSuratForWarga}
            selectedWargaId={selectedWargaId}
          />
        )}

        {activeTab === 'kk' && (
          <DataKKView
            kkList={kkList}
            wargaList={wargaList}
            config={rtConfig}
            onSaveKK={handleSaveKK}
            onDeleteKK={handleDeleteKK}
            onCreateSuratForWarga={handleCreateSuratForWarga}
            selectedKKId={selectedKKId}
          />
        )}

        {activeTab === 'surat' && (
          <SuratPengantarView
            suratList={suratList}
            wargaList={wargaList}
            config={rtConfig}
            onAddSurat={handleAddSurat}
            onUpdateStatus={handleUpdateSuratStatus}
            onDeleteSurat={handleDeleteSurat}
            selectedSuratId={selectedSuratId}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateSuratView
            config={rtConfig}
            wargaList={wargaList}
            onSelectTemplateForSurat={(tpl) => {
              setActiveTab('surat');
            }}
          />
        )}

        {activeTab === 'mutasi' && (
          <MutasiPendudukView
            mutasiList={mutasiList}
            wargaList={wargaList}
            config={rtConfig}
            onAddMutasi={handleAddMutasi}
            onDeleteMutasi={handleDeleteMutasi}
          />
        )}

        {activeTab === 'bansos' && (
          <BansosPrioritasView
            wargaList={wargaList}
            config={rtConfig}
            onUpdateBansosStatus={handleUpdateBansos}
            onExportExcel={handleExportExcel}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'akun' && (
          <AccountSettingsView
            currentUser={currentUser}
            onSaved={(name, roleLabel) => {
              const updated = { ...currentUser, nama: name };
              storageService.setCurrentUser(updated);
              setCurrentUser(updated);
            }}
            onToast={(message, type) => showToast(message, type === 'error' ? 'error' : 'success')}
          />
        )}

        {activeTab === 'integrasi' && (
          <IntegrasiView
            config={rtConfig}
            wargaList={wargaList}
            kkList={kkList}
            suratList={suratList}
            mutasiList={mutasiList}
            onUpdateConfig={handleUpdateConfig}
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'kop' && (
          <KopSuratSettings
            config={rtConfig}
            onSaveConfig={handleUpdateConfig}
          />
        )}

        {activeTab === 'portal' && (
          <div className="py-2">
            <LoginPortal
              currentUser={currentUser}
              config={rtConfig}
              onLogin={(user) => {
                storageService.setCurrentUser(user);
                showToast(`Selamat Datang, ${user.nama}! Login berhasil.`);
                setActiveTab('dashboard');
              }}
            />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        wargaList={wargaList}
        kkList={kkList}
        suratList={suratList}
        onSelectResult={handleSelectFromSearch}
      />

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => storageService.markNotificationAsRead(id)}
        onClearAll={() => storageService.clearNotifications()}
        onActionClick={(notif) => {
          setIsNotificationOpen(false);
          if (notif.suratId) {
            setSelectedSuratId(notif.suratId);
            setActiveTab('surat');
          }
        }}
      />

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4" role="dialog" aria-modal="true" aria-label="Informasi akun">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Akun aktif</p><h2 className="mt-1 text-xl font-bold text-slate-950">{currentUser.nama}</h2><p className="mt-1 text-sm text-slate-500">Perubahan role akses hanya dapat dilakukan oleh administrator melalui Supabase.</p></div>
              <button type="button" onClick={() => setIsAuthModalOpen(false)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">×</button>
            </div>
            <button type="button" onClick={() => { setIsAuthModalOpen(false); setActiveTab('akun'); }} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">Buka Profil & Keamanan</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} <strong>RT {rtConfig.namaRT} RW {rtConfig.namaRW}</strong> Kelurahan {rtConfig.kelurahan}, Kecamatan {rtConfig.kecamatan}.
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Supabase Cloud Ready</span>
            <span>&bull;</span>
            <span>Excel / Spreadsheet Export</span>
            <span>&bull;</span>
            <span>E-Surat QR Verified</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
