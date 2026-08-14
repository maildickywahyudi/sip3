import React, { useState } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Settings, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  HardDrive, 
  FileUp, 
  FileDown, 
  Save, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { RTConfig, KartuKeluarga, Warga, SuratPengantar, MutasiPenduduk } from '../types';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storage';

interface IntegrasiViewProps {
  config: RTConfig;
  wargaList: Warga[];
  kkList: KartuKeluarga[];
  suratList: SuratPengantar[];
  mutasiList: MutasiPenduduk[];
  onUpdateConfig: (newConfig: RTConfig) => void;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
  onResetData: () => void;
}

export const IntegrasiView: React.FC<IntegrasiViewProps> = ({
  config,
  wargaList,
  kkList,
  suratList,
  mutasiList,
  onUpdateConfig,
  onExportExcel,
  onImportExcel,
  onResetData
}) => {
  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseService.getSupabaseConfig().url);
  const [supabaseKey, setSupabaseKey] = useState(supabaseService.getSupabaseConfig().anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasCopiedSQL, setHasCopiedSQL] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const [sqlTab, setSqlTab] = useState<'schema' | 'data'>('data');

  // Derived Supabase project details
  const parsedConn = supabaseService.parseInput(supabaseUrl);
  const currentProjectRef = parsedConn.projectRef || 'nginmiqjfzycvbbufbev';
  const apiSettingsUrl = `https://supabase.com/dashboard/project/${currentProjectRef}/settings/api`;
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${currentProjectRef}/sql/new`;

  // RT Config State
  const [rtConfigData, setRtConfigData] = useState<RTConfig>({ ...config });
  const [isSavedConfig, setIsSavedConfig] = useState(false);

  // File import ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUrlChange = (val: string) => {
    const parsed = supabaseService.parseInput(val);
    if (parsed.projectUrl && parsed.projectUrl !== val && parsed.isPostgresUri) {
      setSupabaseUrl(parsed.projectUrl);
      supabaseService.saveSupabaseConfig(parsed.projectUrl, supabaseKey);
    } else {
      setSupabaseUrl(val);
    }
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    supabaseService.saveSupabaseConfig(supabaseUrl, supabaseKey);
    const res = await supabaseService.testConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    const res = await supabaseService.pushAllToSupabase({
      kk: kkList,
      warga: wargaList,
      surat: suratList,
      mutasi: mutasiList,
      config: rtConfigData
    });

    if (res.success) {
      setSyncMessage('Berhasil menyinkronkan seluruh data warga ke database Supabase Cloud!');
    } else {
      setSyncMessage(`Gagal sinkronisasi: ${res.error}`);
    }
    setIsSyncing(false);
  };

  const handleCopySQL = () => {
    const sql = sqlTab === 'data' 
      ? supabaseService.generateDataInsertSQL(wargaList, kkList)
      : supabaseService.generateSQLSchema();
    navigator.clipboard.writeText(sql);
    setHasCopiedSQL(true);
    setTimeout(() => setHasCopiedSQL(false), 3000);
  };

  const handleDownloadWargaCSV = () => {
    const headers = [
      'id', 'nik', 'nomor_kk', 'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
      'agama', 'pendidikan', 'pekerjaan', 'status_perkawinan', 'status_hubungan_kk',
      'kewarganegaraan', 'golongan_darah', 'nomor_hp', 'status_tinggal', 'status_bansos',
      'is_lansia', 'is_balita', 'is_yatim', 'is_disabilitas', 'catatan'
    ];
    const rows = wargaList.map(w => [
      `"${w.id}"`, `"${w.nik}"`, `"${w.nomorKK}"`, `"${w.nama.replace(/"/g, '""')}"`,
      `"${w.jenisKelamin}"`, `"${w.tempatLahir}"`, `"${w.tanggalLahir}"`, `"${w.agama}"`,
      `"${w.pendidikan}"`, `"${w.pekerjaan}"`, `"${w.statusPerkawinan}"`, `"${w.statusHubunganKK}"`,
      `"${w.kewarganegaraan}"`, `"${w.golonganDarah}"`, `"${w.nomorHp || '-'}"`, `"${w.statusTinggal}"`,
      `"${w.statusBansos || 'TIDAK_ADA'}"`, w.isLansia ? 'TRUE' : 'FALSE', w.isBalita ? 'TRUE' : 'FALSE',
      w.isYatim ? 'TRUE' : 'FALSE', w.isDisabilitas ? 'TRUE' : 'FALSE', `"${(w.catatan || '').replace(/"/g, '""')}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warga_rt004_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadKKCSV = () => {
    const headers = [
      'id', 'nomor_kk', 'kepala_keluarga_nama', 'kepala_keluarga_nik', 'alamat',
      'rt', 'rw', 'kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi', 'kode_pos',
      'status_domisili', 'blok_rumah'
    ];
    const rows = kkList.map(k => [
      `"${k.id}"`, `"${k.nomorKK}"`, `"${k.kepalaKeluargaNama.replace(/"/g, '""')}"`,
      `"${k.kepalaKeluargaNik}"`, `"${k.alamat.replace(/"/g, '""')}"`, `"${k.rt || '004'}"`,
      `"${k.rw || '007'}"`, `"${k.kelurahan || 'Jatimulya'}"`, `"${k.kecamatan || 'Tambun Selatan'}"`,
      `"${k.kabupatenKota || 'Kabupaten Bekasi'}"`, `"${k.provinsi || 'Jawa Barat'}"`,
      `"${k.kodePos || '17510'}"`, `"${k.statusDomisili || 'TETAP'}"`, `"${k.blokRumah || ''}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kartu_keluarga_rt004_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(rtConfigData);
    setIsSavedConfig(true);
    setTimeout(() => setIsSavedConfig(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportExcel(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          Pusat Integrasi Supabase Cloud, Spreadsheet & Konfigurasi RT
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sinkronisasi cloud database real-time, backup spreadsheet multi-sheet, dan pengaturan data resmi RT 004 RW 007
        </p>
      </div>

      {/* Grid 2 Column for Supabase & Spreadsheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Supabase Cloud Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Supabase Database Cloud</h3>
                <p className="text-[11px] text-slate-500">Penyimpanan kependudukan real-time & backup cloud</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200">
              Active Ready
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Project Indicator Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Supabase Project Ref:</div>
                <div className="font-mono font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {currentProjectRef}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={apiSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 text-[11px] shadow-2xs transition"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                  Ambil Anon API Key
                </a>
                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 text-[11px] shadow-2xs transition"
                >
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                  Buka SQL Editor
                </a>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Project URL atau Connection String
              </label>
              <input
                type="text"
                placeholder="https://nginmiqjfzycvbbufbev.supabase.co atau postgresql://..."
                value={supabaseUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                *Dapat berupa URL HTTPS (contoh: <code>https://{currentProjectRef}.supabase.co</code>) atau URI PostgreSQL pooler.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Supabase Anon Public API Key</label>
                <a
                  href={apiSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold underline flex items-center gap-0.5"
                >
                  Cari di Project Settings &gt; API
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => {
                  setSupabaseKey(e.target.value);
                  supabaseService.saveSupabaseConfig(supabaseUrl, e.target.value);
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTesting}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Menguji...' : 'Uji Koneksi'}
              </button>

              <button
                type="button"
                onClick={handlePushToSupabase}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                {isSyncing ? 'Menyinkronkan...' : 'Unggah Data ke Supabase'}
              </button>

              <button
                type="button"
                onClick={() => setShowSQL(!showSQL)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                {showSQL ? 'Sembunyikan SQL' : 'Buka Generator SQL & CSV'}
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                <div>{testResult.message}</div>
              </div>
            )}

            {syncMessage && (
              <div className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}

            {/* SQL & CSV Drawer */}
            {showSQL && (
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSqlTab('data')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        sqlTab === 'data' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Script INSERT Data Warga ({wargaList.length} Jiwa)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlTab('schema')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        sqlTab === 'schema' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Skema Tabel (DDL)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySQL}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow"
                    >
                      {hasCopiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {hasCopiedSQL ? 'Tersalin!' : 'Salin SQL'}
                    </button>
                  </div>
                </div>

                <pre className="text-[10px] font-mono overflow-x-auto max-h-56 p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 whitespace-pre">
                  {sqlTab === 'data' 
                    ? supabaseService.generateDataInsertSQL(wargaList, kkList)
                    : supabaseService.generateSQLSchema()
                  }
                </pre>

                {/* Direct CSV Importers for Supabase Table Editor */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300">
                    Opsi Impor Langsung via CSV (Drag & Drop di Supabase Table Editor):
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadWargaCSV}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unduh CSV Warga (warga_rt004.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadKKCSV}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                      <span>Unduh CSV KK (kartu_keluarga_rt004.csv)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    *Tarik dan lepas (drag &amp; drop) berkas CSV di atas ke menu <strong>Table Editor &gt; warga_rt004</strong> di Supabase Anda untuk memasukkan data secara instan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Spreadsheet & Google Drive Sync */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Spreadsheet & Drive Backup</h3>
                <p className="text-[11px] text-slate-500">Ekspor/impor Excel multi-sheet (.xlsx) dan Google Drive</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 bg-teal-50 text-teal-700 font-bold rounded-full border border-teal-200">
              Excel / Sheets Ready
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <p className="text-slate-600 text-xs">
              Sistem telah dilengkapi parser file spreadsheet untuk menghasilkan dokumen Excel (.xlsx) dengan 5 lembar kerja terstruktur (Data Warga, KK, Surat Pengantar, Mutasi, dan Bansos).
            </p>

            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3">
              <div className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-teal-700" />
                Ekspor Master Data ke Spreadsheet:
              </div>
              <p className="text-[11px] text-teal-800">
                Unduh seluruh data kependudukan RT 004 RW 007 dalam 1 berkas Excel lengkap untuk arsip kelurahan atau dibuka di Google Sheets / Google Drive.
              </p>
              <button
                onClick={onExportExcel}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Unduh Berkas Excel Lengkap (.xlsx)
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-slate-600" />
                Impor Data dari Spreadsheet:
              </div>
              <p className="text-[11px] text-slate-500">
                Unggah file Excel hasil sensus atau formulir warga untuk memasukkan data secara massal ke dalam sistem.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                Pilih File Excel / CSV dari Komputer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Konfigurasi Instansi RT 004 RW 007 Jatimulya */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Pengaturan Instansi & Kop Surat Resmi RT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ini akan otomatis muncul pada kop surat pengantar dan keterangan resmi RT
            </p>
          </div>

          {isSavedConfig && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
              ✓ Pengaturan Berhasil Disimpan
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor RT</label>
              <input
                type="text"
                value={rtConfigData.namaRT}
                onChange={(e) => setRtConfigData({ ...rtConfigData, namaRT: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor RW</label>
              <input
                type="text"
                value={rtConfigData.namaRW}
                onChange={(e) => setRtConfigData({ ...rtConfigData, namaRW: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kelurahan</label>
              <input
                type="text"
                value={rtConfigData.kelurahan}
                onChange={(e) => setRtConfigData({ ...rtConfigData, kelurahan: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={rtConfigData.kecamatan}
                onChange={(e) => setRtConfigData({ ...rtConfigData, kecamatan: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={rtConfigData.kabupatenKota}
                onChange={(e) => setRtConfigData({ ...rtConfigData, kabupatenKota: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Pos</label>
              <input
                type="text"
                value={rtConfigData.kodePos}
                onChange={(e) => setRtConfigData({ ...rtConfigData, kodePos: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Ketua RT (Penandatangan Surat)</label>
              <input
                type="text"
                value={rtConfigData.namaKetuaRT}
                onChange={(e) => setRtConfigData({ ...rtConfigData, namaKetuaRT: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Sekretaris RT</label>
              <input
                type="text"
                value={rtConfigData.namaSekretaris}
                onChange={(e) => setRtConfigData({ ...rtConfigData, namaSekretaris: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Kontak / WhatsApp Pengurus RT</label>
              <input
                type="text"
                value={rtConfigData.kontakSekretariat}
                onChange={(e) => setRtConfigData({ ...rtConfigData, kontakSekretariat: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Alamat Balai Warga / Sekretariat RT</label>
            <input
              type="text"
              value={rtConfigData.alamatSekretariat}
              onChange={(e) => setRtConfigData({ ...rtConfigData, alamatSekretariat: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('Kembalikan data kependudukan ke contoh awal RT 004 RW 007 Jatimulya?')) {
                  onResetData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data Contoh (Default)
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan RT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
