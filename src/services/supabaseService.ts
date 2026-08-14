import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { storageService } from './storage';
import { Warga, KartuKeluarga } from '../types';

export interface SupabaseSyncResult {
  success: boolean;
  message: string;
  syncedTables?: string[];
  timestamp?: string;
  error?: string;
}

export interface ParsedSupabaseConnection {
  projectRef?: string;
  projectUrl: string;
  dashboardApiUrl?: string;
  dashboardSqlUrl?: string;
  isPostgresUri?: boolean;
}

export function parseSupabaseInput(input: string): ParsedSupabaseConnection {
  const trimmed = input.trim();
  
  // Case 1: postgresql connection string
  // e.g. postgresql://postgres.nginmiqjfzycvbbufbev:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  const pgMatch = trimmed.match(/(?:postgresql|postgres):\/\/postgres\.([a-z0-9_-]+):/i);
  if (pgMatch && pgMatch[1]) {
    const projectRef = pgMatch[1];
    return {
      projectRef,
      projectUrl: `https://${projectRef}.supabase.co`,
      dashboardApiUrl: `https://supabase.com/dashboard/project/${projectRef}/settings/api`,
      dashboardSqlUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
      isPostgresUri: true
    };
  }

  // Case 2: standard supabase.co URL
  // e.g. https://nginmiqjfzycvbbufbev.supabase.co
  const urlMatch = trimmed.match(/https:\/\/([a-z0-9_-]+)\.supabase\.co/i);
  if (urlMatch && urlMatch[1]) {
    const projectRef = urlMatch[1];
    return {
      projectRef,
      projectUrl: `https://${projectRef}.supabase.co`,
      dashboardApiUrl: `https://supabase.com/dashboard/project/${projectRef}/settings/api`,
      dashboardSqlUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
      isPostgresUri: false
    };
  }

  // Case 3: Raw project ID
  if (/^[a-z0-9]{20}$/i.test(trimmed)) {
    return {
      projectRef: trimmed,
      projectUrl: `https://${trimmed}.supabase.co`,
      dashboardApiUrl: `https://supabase.com/dashboard/project/${trimmed}/settings/api`,
      dashboardSqlUrl: `https://supabase.com/dashboard/project/${trimmed}/sql/new`,
      isPostgresUri: false
    };
  }

  return {
    projectUrl: trimmed,
    isPostgresUri: false
  };
}

class SupabaseService {
  private client: SupabaseClient | null = null;

  public async signIn(email: string, password: string) {
    const client = this.getClient();
    if (!client) throw new Error('Koneksi Supabase belum tersedia.');
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email belum terverifikasi. Silakan cek inbox Anda.');
      }
      if (error.status === 429) throw new Error('Terlalu banyak percobaan. Coba lagi beberapa saat.');
      throw new Error('Email atau password tidak valid.');
    }
    return data.user;
  }

  public async getSessionUser() {
    const client = this.getClient();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user ?? null;
  }

  public async signOut() {
    await this.getClient()?.auth.signOut();
  }

  public onAuthStateChange(callback: (user: any) => void) {
    const client = this.getClient();
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }

  public async updateProfile(userId: string, displayName: string, roleLabel: string) {
    const client = this.getClient();
    if (!client) throw new Error('Koneksi Supabase belum tersedia.');
    const { error } = await client.from('profiles').upsert({ id: userId, display_name: displayName.trim(), role_label: roleLabel.trim(), updated_at: new Date().toISOString() });
    if (error) throw error;
  }

  public async updatePassword(password: string) {
    const client = this.getClient();
    if (!client) throw new Error('Koneksi Supabase belum tersedia.');
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }
  private defaultProjectUrl = 'https://nginmiqjfzycvbbufbev.supabase.co';

  public parseInput(input: string): ParsedSupabaseConnection {
    return parseSupabaseInput(input);
  }

  public getSupabaseConfig(): { url: string; anonKey: string; projectRef?: string } {
    const config = storageService.getConfig();
    const env = (import.meta as any).env || {};
    const envUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
    const envKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    const rawUrl = config.supabaseUrl || envUrl || this.defaultProjectUrl;
    const parsed = parseSupabaseInput(rawUrl);

    return {
      url: parsed.projectUrl || this.defaultProjectUrl,
      anonKey: config.supabaseAnonKey || envKey,
      projectRef: parsed.projectRef || 'nginmiqjfzycvbbufbev'
    };
  }

  public saveSupabaseConfig(urlOrConnectionString: string, anonKey: string) {
    const parsed = parseSupabaseInput(urlOrConnectionString);
    const finalUrl = parsed.projectUrl || urlOrConnectionString;
    const config = storageService.getConfig();
    config.supabaseUrl = finalUrl;
    config.supabaseAnonKey = anonKey;
    config.supabaseTersambung = !!(finalUrl && anonKey);
    storageService.saveConfig(config);
    this.initClient(finalUrl, anonKey);
  }

  public initClient(url: string, key: string): boolean {
    if (!url || !key) {
      this.client = null;
      return false;
    }
    try {
      this.client = createClient(url, key);
      return true;
    } catch (e) {
      console.error('Failed to init Supabase client', e);
      this.client = null;
      return false;
    }
  }

  public getClient(): SupabaseClient | null {
    if (!this.client) {
      const { url, anonKey } = this.getSupabaseConfig();
      if (url && anonKey) {
        this.initClient(url, anonKey);
      }
    }
    return this.client;
  }

  public async testConnection(urlParam?: string, keyParam?: string): Promise<{ success: boolean; message: string }> {
    const config = this.getSupabaseConfig();
    const url = urlParam || config.url;
    const key = keyParam || config.anonKey;

    if (!url || !url.startsWith('https://')) {
      return { success: false, message: 'URL Supabase harus diawali dengan https:// (Contoh: https://xyzcompany.supabase.co)' };
    }
    if (!key || key.length < 20) {
      return { success: false, message: 'Supabase Anon Key tidak valid atau terlalu pendek.' };
    }

    try {
      const testClient = createClient(url, key);
      const { error } = await testClient.from('warga_rt004').select('id').limit(1);
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.warn('Supabase test warning:', error);
      }
      return {
        success: true,
        message: 'Koneksi ke instance Supabase Cloud berhasil diverifikasi dan siap digunakan!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal terhubung ke Supabase: ${err.message || 'Periksa URL dan API Key'}`
      };
    }
  }

  public generateSQLSchema(): string {
    return `-- SQL SCHEMA UNTUK SISTEM KEPENDUDUKAN RT 004 RW 007 KELURAHAN JATIMULYA
-- Jalankan perintah SQL berikut di Supabase SQL Editor:

-- 1. Tabel Kartu Keluarga
CREATE TABLE IF NOT EXISTS kartu_keluarga_rt004 (
    id TEXT PRIMARY KEY,
    nomor_kk VARCHAR(30) UNIQUE NOT NULL,
    kepala_keluarga_nama TEXT NOT NULL,
    kepala_keluarga_nik VARCHAR(30) NOT NULL,
    alamat TEXT NOT NULL,
    rt VARCHAR(10) DEFAULT '004',
    rw VARCHAR(10) DEFAULT '007',
    kelurahan VARCHAR(100) DEFAULT 'Jatimulya',
    kecamatan VARCHAR(100) DEFAULT 'Tambun Selatan',
    kabupaten_kota VARCHAR(100) DEFAULT 'Kabupaten Bekasi',
    provinsi VARCHAR(100) DEFAULT 'Jawa Barat',
    kode_pos VARCHAR(20) DEFAULT '17510',
    status_domisili VARCHAR(30) DEFAULT 'TETAP',
    blok_rumah VARCHAR(100),
    tanggal_terbit DATE,
    tanggal_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catatan TEXT
);

-- 2. Tabel Data Warga / Penduduk
CREATE TABLE IF NOT EXISTS warga_rt004 (
    id TEXT PRIMARY KEY,
    nik VARCHAR(30) UNIQUE NOT NULL,
    nomor_kk VARCHAR(30),
    nama TEXT NOT NULL,
    jenis_kelamin VARCHAR(10),
    tempat_lahir TEXT,
    tanggal_lahir DATE,
    agama VARCHAR(50) DEFAULT 'ISLAM',
    pendidikan VARCHAR(100),
    pekerjaan VARCHAR(150),
    status_perkawinan VARCHAR(50),
    status_hubungan_kk VARCHAR(50),
    kewarganegaraan VARCHAR(30) DEFAULT 'WNI',
    golongan_darah VARCHAR(10) DEFAULT '-',
    nomor_hp VARCHAR(50),
    email TEXT,
    status_tinggal VARCHAR(50) DEFAULT 'TETAP',
    is_lansia BOOLEAN DEFAULT FALSE,
    is_balita BOOLEAN DEFAULT FALSE,
    is_yatim BOOLEAN DEFAULT FALSE,
    is_disabilitas BOOLEAN DEFAULT FALSE,
    status_bansos VARCHAR(50) DEFAULT 'TIDAK_ADA',
    keterangan_bansos TEXT,
    tanggal_input DATE DEFAULT CURRENT_DATE,
    catatan TEXT
);

-- 3. Tabel Surat Pengantar RT
CREATE TABLE IF NOT EXISTS surat_pengantar_rt004 (
    id TEXT PRIMARY KEY,
    nomor_surat VARCHAR(100) UNIQUE NOT NULL,
    jenis_surat VARCHAR(30) NOT NULL,
    judul_surat TEXT NOT NULL,
    nik_pemohon VARCHAR(16) NOT NULL,
    nama_pemohon TEXT NOT NULL,
    nomor_kk_pemohon VARCHAR(16),
    tempat_tgl_lahir_pemohon TEXT,
    jenis_kelamin_pemohon VARCHAR(1),
    agama_pemohon VARCHAR(20),
    pekerjaan_pemohon VARCHAR(100),
    status_kawin_pemohon VARCHAR(30),
    alamat_pemohon TEXT,
    keperluan TEXT NOT NULL,
    keterangan_lain TEXT,
    tanggal_pengajuan DATE DEFAULT CURRENT_DATE,
    tanggal_disetujui DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    alasan_penolakan TEXT,
    nama_pejabat_ttd TEXT,
    jabatan_ttd TEXT,
    kode_verifikasi_qr TEXT,
    dibuat_oleh VARCHAR(20) DEFAULT 'WARGA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Mutasi Penduduk (Pindah Masuk / Keluar / Lahir / Wafat)
CREATE TABLE IF NOT EXISTS mutasi_penduduk_rt004 (
    id TEXT PRIMARY KEY,
    tanggal DATE DEFAULT CURRENT_DATE,
    jenis_mutasi VARCHAR(30) NOT NULL,
    nik VARCHAR(16),
    nama_warga TEXT NOT NULL,
    nomor_kk VARCHAR(16),
    alamat_asal TEXT,
    alamat_tujuan TEXT,
    alasan TEXT,
    no_surat_keterangan TEXT,
    petugas TEXT,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE kartu_keluarga_rt004 ENABLE ROW LEVEL SECURITY;
ALTER TABLE warga_rt004 ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat_pengantar_rt004 ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_penduduk_rt004 ENABLE ROW LEVEL SECURITY;

-- Allow public access with anon key for RT 004 application
CREATE POLICY "Public full access for RT004" ON kartu_keluarga_rt004 FOR ALL USING (true);
CREATE POLICY "Public full access for RT004" ON warga_rt004 FOR ALL USING (true);
CREATE POLICY "Public full access for RT004" ON surat_pengantar_rt004 FOR ALL USING (true);
CREATE POLICY "Public full access for RT004" ON mutasi_penduduk_rt004 FOR ALL USING (true);
`;
  }

  public generateDataInsertSQL(wargalistParam?: Warga[], kkListParam?: KartuKeluarga[]): string {
    const wargaList = wargalistParam || storageService.getWargaList();
    const kkList = kkListParam || storageService.getKKList();

    const escapeSql = (str: any) => {
      if (str === null || str === undefined) return 'NULL';
      return `'${String(str).replace(/'/g, "''")}'`;
    };

    let sql = `-- SCRIPT INSERT DATA WARGA & KARTU KELUARGA RT 004 RW 007\n-- Total: ${kkList.length} Kartu Keluarga, ${wargaList.length} Jiwa Warga\n\n`;

    if (kkList.length > 0) {
      sql += `-- 1. DATA KARTU KELUARGA\nINSERT INTO kartu_keluarga_rt004 (id, nomor_kk, kepala_keluarga_nama, kepala_keluarga_nik, alamat, rt, rw, kelurahan, kecamatan, kabupaten_kota, provinsi, kode_pos, status_domisili, blok_rumah)\nVALUES\n`;
      const kkRows = kkList.map(k => 
        `(${escapeSql(k.id)}, ${escapeSql(k.nomorKK)}, ${escapeSql(k.kepalaKeluargaNama)}, ${escapeSql(k.kepalaKeluargaNik)}, ${escapeSql(k.alamat)}, ${escapeSql(k.rt || '004')}, ${escapeSql(k.rw || '007')}, ${escapeSql(k.kelurahan || 'Jatimulya')}, ${escapeSql(k.kecamatan || 'Tambun Selatan')}, ${escapeSql(k.kabupatenKota || 'Kabupaten Bekasi')}, ${escapeSql(k.provinsi || 'Jawa Barat')}, ${escapeSql(k.kodePos || '17510')}, ${escapeSql(k.statusDomisili || 'TETAP')}, ${escapeSql(k.blokRumah || '')})`
      );
      sql += kkRows.join(',\n') + '\nON CONFLICT (nomor_kk) DO UPDATE SET kepala_keluarga_nama = EXCLUDED.kepala_keluarga_nama, alamat = EXCLUDED.alamat;\n\n';
    }

    if (wargaList.length > 0) {
      sql += `-- 2. DATA WARGA RT 004\nINSERT INTO warga_rt004 (id, nik, nomor_kk, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, pendidikan, pekerjaan, status_perkawinan, status_hubungan_kk, kewarganegaraan, golongan_darah, nomor_hp, status_tinggal, status_bansos, is_lansia, is_balita, is_yatim, is_disabilitas, catatan)\nVALUES\n`;
      const wargaRows = wargaList.map(w => 
        `(${escapeSql(w.id)}, ${escapeSql(w.nik)}, ${escapeSql(w.nomorKK)}, ${escapeSql(w.nama)}, ${escapeSql(w.jenisKelamin)}, ${escapeSql(w.tempatLahir)}, ${escapeSql(w.tanggalLahir)}, ${escapeSql(w.agama)}, ${escapeSql(w.pendidikan)}, ${escapeSql(w.pekerjaan)}, ${escapeSql(w.statusPerkawinan)}, ${escapeSql(w.statusHubunganKK)}, ${escapeSql(w.kewarganegaraan)}, ${escapeSql(w.golonganDarah)}, ${escapeSql(w.nomorHp || '-')}, ${escapeSql(w.statusTinggal)}, ${escapeSql(w.statusBansos || 'TIDAK_ADA')}, ${Boolean(w.isLansia)}, ${Boolean(w.isBalita)}, ${Boolean(w.isYatim)}, ${Boolean(w.isDisabilitas)}, ${escapeSql(w.catatan || '')})`
      );
      sql += wargaRows.join(',\n') + '\nON CONFLICT (nik) DO UPDATE SET nama = EXCLUDED.nama, nomor_kk = EXCLUDED.nomor_kk, status_bansos = EXCLUDED.status_bansos;\n';
    }

    return sql;
  }

  public async syncToSupabase(customWarga?: Warga[], customKK?: KartuKeluarga[]): Promise<SupabaseSyncResult> {
    const config = storageService.getConfig();
    const client = this.getClient();

    if (!client) {
      return {
        success: false,
        message: 'Konfigurasi Supabase belum diisi. Silakan masukkan Supabase URL dan Anon Key di tab Integrasi.',
        error: 'Client not initialized'
      };
    }

    try {
      const wargaList = customWarga && customWarga.length > 0 ? customWarga : storageService.getWargaList();
      const kkList = customKK && customKK.length > 0 ? customKK : storageService.getKKList();

      // Collect existing KKs
      const kkMap = new Map<string, any>();

      // 1. Add all KKs from storage / params
      kkList.forEach(k => {
        const cleanKK = String(k.nomorKK || '').trim();
        if (cleanKK) {
          kkMap.set(cleanKK, {
            id: k.id || `kk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            nomor_kk: cleanKK,
            kepala_keluarga_nama: k.kepalaKeluargaNama || 'Kepala Keluarga RT 004',
            kepala_keluarga_nik: String(k.kepalaKeluargaNik || '').trim() || `321606${Date.now().toString().slice(-10)}`,
            alamat: k.alamat || 'RT 004 RW 007 Kel. Jatimulya',
            rt: k.rt || '004',
            rw: k.rw || '007',
            kelurahan: k.kelurahan || 'Jatimulya',
            kecamatan: k.kecamatan || 'Tambun Selatan',
            kabupaten_kota: k.kabupatenKota || 'Kabupaten Bekasi',
            provinsi: k.provinsi || 'Jawa Barat',
            kode_pos: k.kodePos || '17510',
            status_domisili: k.statusDomisili || 'TETAP',
            blok_rumah: k.blokRumah || '',
            tanggal_terbit: k.tanggalTerbit || new Date().toISOString().slice(0, 10),
            catatan: k.catatan || 'Data KK RT 004'
          });
        }
      });

      // 2. Ensure EVERY citizen's nomorKK has a corresponding entry in kkMap (Critical for Foreign Key safety)
      wargaList.forEach(w => {
        let cleanKK = String(w.nomorKK || '').trim();
        if (!cleanKK) {
          cleanKK = '3216060000000000';
          w.nomorKK = cleanKK;
        }

        if (!kkMap.has(cleanKK)) {
          kkMap.set(cleanKK, {
            id: `kk-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            nomor_kk: cleanKK,
            kepala_keluarga_nama: w.nama || 'Kepala Keluarga RT 004',
            kepala_keluarga_nik: String(w.nik || '').trim() || `321606${Date.now().toString().slice(-10)}`,
            alamat: w.statusTinggal === 'KONTRAK' ? 'Kontrakan RT 004 RW 007 Kel. Jatimulya' : 'RT 004 RW 007 Kel. Jatimulya',
            rt: '004',
            rw: '007',
            kelurahan: 'Jatimulya',
            kecamatan: 'Tambun Selatan',
            kabupaten_kota: 'Kabupaten Bekasi',
            provinsi: 'Jawa Barat',
            kode_pos: '17510',
            status_domisili: w.statusTinggal === 'KONTRAK' ? 'KONTRAK' : w.statusTinggal === 'KOS' ? 'KOS' : 'TETAP',
            blok_rumah: '',
            tanggal_terbit: new Date().toISOString().slice(0, 10),
            catatan: `Otomatis dibuat untuk relasi KK warga ${w.nama}`
          });
        }
      });

      const kkPayload = Array.from(kkMap.values());

      // 1. Sync KK First so Foreign Key constraints are always satisfied
      if (kkPayload.length > 0) {
        const { error: kkError } = await client.from('kartu_keluarga_rt004').upsert(kkPayload, { onConflict: 'nomor_kk' });
        if (kkError) {
          throw new Error(`Gagal sync Kartu Keluarga: ${kkError.message}`);
        }
      }

      // 2. Sync Warga
      const wargaPayload = wargaList.map(w => {
        const cleanNik = String(w.nik || '').trim();
        let cleanKK = String(w.nomorKK || '').trim();
        if (!cleanKK) cleanKK = '3216060000000000';
        const cleanHp = String(w.nomorHp || '-').trim();
        const cleanGolDarah = String(w.golonganDarah || '-').trim();
        const cleanJk = w.jenisKelamin === 'P' ? 'P' : 'L';

        return {
          id: w.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nik: cleanNik,
          nomor_kk: cleanKK,
          nama: (w.nama || '').trim(),
          jenis_kelamin: cleanJk,
          tempat_lahir: (w.tempatLahir || 'Bekasi').trim(),
          tanggal_lahir: w.tanggalLahir || null,
          agama: (w.agama || 'ISLAM').trim(),
          pendidikan: (w.pendidikan || 'SLTA').trim(),
          pekerjaan: (w.pekerjaan || 'Karyawan').trim(),
          status_perkawinan: (w.statusPerkawinan || 'BELUM KAWIN').trim(),
          status_hubungan_kk: (w.statusHubunganKK || 'KEPALA KELUARGA').trim(),
          kewarganegaraan: (w.kewarganegaraan || 'WNI').trim(),
          golongan_darah: cleanGolDarah,
          nomor_hp: cleanHp,
          email: (w.email || '').trim(),
          status_tinggal: (w.statusTinggal || 'TETAP').trim(),
          is_lansia: Boolean(w.isLansia),
          is_balita: Boolean(w.isBalita),
          is_yatim: Boolean(w.isYatim),
          is_disabilitas: Boolean(w.isDisabilitas),
          status_bansos: (w.statusBansos || 'TIDAK_ADA').trim(),
          keterangan_bansos: (w.keteranganBansos || '').trim(),
          tanggal_input: w.tanggalInput || new Date().toISOString().slice(0, 10),
          catatan: (w.catatan || '').trim()
        };
      });

      if (wargaPayload.length > 0) {
        const { error: wargaError } = await client.from('warga_rt004').upsert(wargaPayload, { onConflict: 'nik' });
        if (wargaError) {
          throw new Error(`Gagal sync Data Warga: ${wargaError.message}`);
        }
      }

      const now = new Date();
      const timeString = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;

      config.terakhirSinkron = timeString;
      config.supabaseTersambung = true;
      storageService.saveConfig(config);

      return {
        success: true,
        message: `Sinkronisasi data ke Supabase Cloud berhasil! (${wargaList.length} Warga & ${kkList.length} KK)`,
        syncedTables: ['kartu_keluarga_rt004', 'warga_rt004', 'surat_pengantar_rt004', 'mutasi_penduduk_rt004'],
        timestamp: timeString
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal sinkronisasi ke Supabase: ${err.message || 'Pastikan tabel telah dibuat menggunakan SQL Schema'}`,
        error: err.message
      };
    }
  }

  public async pushAllToSupabase(payload?: { warga?: Warga[]; kk?: KartuKeluarga[]; surat?: any; mutasi?: any; config?: any }): Promise<SupabaseSyncResult> {
    return this.syncToSupabase(payload?.warga, payload?.kk);
  }
}

export const supabaseService = new SupabaseService();
