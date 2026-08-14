import React, { useState } from 'react';
import { Printer, ShieldCheck, Copy, Check, CreditCard as Edit3, RotateCcw, FileText, CircleCheck as CheckCircle2, Type, Sparkles } from 'lucide-react';
import { SuratPengantar, RTConfig } from '../types';

interface SuratPrintTemplateProps {
  surat: SuratPengantar;
  config: RTConfig;
  onClose?: () => void;
  onUpdateSurat?: (updated: SuratPengantar) => void;
}

export const SuratPrintTemplate: React.FC<SuratPrintTemplateProps> = ({ 
  surat, 
  config, 
  onClose,
  onUpdateSurat
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fontFamily, setFontFamily] = useState<'arial' | 'times' | 'calibri'>('arial');

  // Editable fields to allow instantaneous direct tweaks
  const [nomorSurat, setNomorSurat] = useState(surat.nomorSurat || '184 / RT 004 RW 007 / SP / 2026');
  const [namaPemohon, setNamaPemohon] = useState(surat.namaPemohon || '');
  const [tempatTglLahir, setTempatTglLahir] = useState(surat.tempatTglLahirPemohon || '');
  const [jenisKelamin, setJenisKelamin] = useState(
    surat.jenisKelaminPemohon === 'P' || surat.jenisKelaminPemohon === ('Perempuan' as any) ? 'Perempuan' : 'Laki-Laki'
  );
  const [statusKawin, setStatusKawin] = useState(surat.statusKawinPemohon || 'Cerai Mati');
  const [agama, setAgama] = useState(surat.agamaPemohon || 'Islam');
  const [nikPemohon, setNikPemohon] = useState(surat.nikPemohon || '');
  const [pekerjaan, setPekerjaan] = useState(surat.pekerjaanPemohon || 'Mengurus Rumah Tangga');
  const [telepon, setTelepon] = useState(surat.teleponPemohon || '-');

  // Alamat 2 Baris
  const defaultAlamatBaris1 = surat.alamatBaris1 || 'Kp Jati RT 004 RW 007 Kelurahan Jatimulya';
  const defaultAlamatBaris2 = surat.alamatBaris2 || 'Kec. Tambun Selatan Kab. Bekasi';
  const [alamatBaris1, setAlamatBaris1] = useState(defaultAlamatBaris1);
  const [alamatBaris2, setAlamatBaris2] = useState(defaultAlamatBaris2);

  // Keperluan 2 Baris
  const defaultKeperluan1 = surat.keperluanBaris1 || surat.keperluan || 'Membuat Akte Kematian HERI PURNOMO';
  const defaultKeperluan2 = surat.keperluanBaris2 || surat.keteranganLain || '04 Nopember 2017';
  const [keperluan1, setKeperluan1] = useState(defaultKeperluan1);
  const [keperluan2, setKeperluan2] = useState(defaultKeperluan2);

  // Signatures: Ketua RT 004 & Ketua RW 007
  const [namaKetuaRT, setNamaKetuaRT] = useState(surat.namaKetuaRT || config.namaKetuaRT || 'Yanto');
  const [namaKetuaRW, setNamaKetuaRW] = useState(surat.namaKetuaRW || config.namaKetuaRW || 'Ketua RW 007');

  // Date format DD-MM-YYYY (e.g. 11-08-2026)
  const getTodayDmy = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const [tanggalSurat, setTanggalSurat] = useState(getTodayDmy());

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdits = () => {
    if (onUpdateSurat) {
      onUpdateSurat({
        ...surat,
        nomorSurat,
        namaPemohon,
        tempatTglLahirPemohon: tempatTglLahir,
        jenisKelaminPemohon: jenisKelamin === 'Perempuan' ? 'P' : 'L',
        statusKawinPemohon: statusKawin,
        agamaPemohon: agama,
        nikPemohon,
        pekerjaanPemohon: pekerjaan,
        teleponPemohon: telepon,
        alamatBaris1,
        alamatBaris2,
        alamatPemohon: `${alamatBaris1}, ${alamatBaris2}`,
        keperluan: keperluan1,
        keperluanBaris1: keperluan1,
        keperluanBaris2: keperluan2,
        keteranganLain: keperluan2,
        namaKetuaRT,
        namaKetuaRW
      });
    }
    setIsEditing(false);
  };

  const handleCopyText = () => {
    const text = `RT 004   RW 007
KELURAHAN JATIMULYA
KECAMATAN TAMBUN SELATAN
Sekretariat : jl jampang no 111 jatimulya tlp 0896-7720-3444
-----------------------------------------------------------------
SURAT PENGANTAR
NO : ${nomorSurat}

Yang Bertanda Tangan Dibawah Ini Ketua Rt 004 Rw 007 Kelurahan Jatimulya.
Menerangkan Bahwa :

Nama              : ${namaPemohon}
Tempat Tgl Lahir  : ${tempatTglLahir}
Jenis Kelamin     : ${jenisKelamin}
Status Perkawinan : ${statusKawin}
Agama             : ${agama}
No Ktp / No Nik   : ${nikPemohon}
Pekerjaan         : ${pekerjaan}
Telepon / Hp      : ${telepon}
Alamat Lengkap    : ${alamatBaris1}
                  : ${alamatBaris2}
Keperluan         : ${keperluan1}
                  : ${keperluan2}

Benar Bahwa Yang Bersangkutan Adalah Warga Kami , Demikian Surat-
Pengantar Ini Dibuat untuk dapat dipergunakan sebagaimana mestinya.

Jatimulya ${tanggalSurat}                        Mengetahui
Ketua Rt 004 Rw 007                                Ketua Rw 007



${namaKetuaRT}                                     ${namaKetuaRW}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const selectedFontFamily = 
    fontFamily === 'times' ? '"Times New Roman", Times, serif' :
    fontFamily === 'calibri' ? 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif' :
    'Arial, "Helvetica Neue", Helvetica, sans-serif';

  return (
    <div className="space-y-4">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20 w-9 h-9 flex items-center justify-center">
            {config.kopLogoDataUrl ? (
              <img src={config.kopLogoDataUrl} alt="Logo Kop" className="max-w-full max-h-full object-contain" />
            ) : (
              <FileText className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>Format Resmi Surat Pengantar RT 004 RW 007</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-400/30">
                Standar A4
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Ketua RT: <strong className="text-slate-200">{namaKetuaRT}</strong> &bull; Ketua RW: <strong className="text-slate-200">{namaKetuaRW}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Font switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setFontFamily('arial')}
              className={`px-2 py-1 rounded transition font-sans text-xs ${fontFamily === 'arial' ? 'bg-slate-950 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Arial
            </button>
            <button
              onClick={() => setFontFamily('times')}
              className={`px-2 py-1 rounded transition font-serif text-xs ${fontFamily === 'times' ? 'bg-slate-950 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Times
            </button>
            <button
              onClick={() => setFontFamily('calibri')}
              className={`px-2 py-1 rounded transition text-xs ${fontFamily === 'calibri' ? 'bg-slate-950 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Calibri
            </button>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
              isEditing 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Selesai Edit' : 'Edit Isi'}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen (A4)</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Edit Panel Drawer (If isEditing is Active) */}
      {isEditing && (
        <div className="no-print bg-amber-50/90 border border-amber-300 p-4 rounded-xl text-xs space-y-3.5 shadow-2xs">
          <div className="font-bold text-amber-900 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-700" />
              Sesuaikan Isian Dokumen Surat Pengantar Langsung:
            </span>
            <button 
              onClick={handleSaveEdits}
              className="px-3.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
            >
              Simpan Perubahan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nomor Surat:</label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nama Pemohon:</label>
              <input
                type="text"
                value={namaPemohon}
                onChange={(e) => setNamaPemohon(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tempat Tgl Lahir (Solo, 04-05-1962):</label>
              <input
                type="text"
                value={tempatTglLahir}
                onChange={(e) => setTempatTglLahir(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Jenis Kelamin:</label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Perempuan">Perempuan</option>
                <option value="Laki-Laki">Laki-Laki</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status Perkawinan:</label>
              <input
                type="text"
                value={statusKawin}
                onChange={(e) => setStatusKawin(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Agama:</label>
              <input
                type="text"
                value={agama}
                onChange={(e) => setAgama(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">No KTP / No NIK:</label>
              <input
                type="text"
                value={nikPemohon}
                onChange={(e) => setNikPemohon(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Pekerjaan:</label>
              <input
                type="text"
                value={pekerjaan}
                onChange={(e) => setPekerjaan(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Telepon / HP:</label>
              <input
                type="text"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-amber-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alamat Lengkap (Baris 1):</label>
                <input
                  type="text"
                  value={alamatBaris1}
                  onChange={(e) => setAlamatBaris1(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Alamat Lengkap (Baris 2):</label>
                <input
                  type="text"
                  value={alamatBaris2}
                  onChange={(e) => setAlamatBaris2(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                />
              </div>
            </div>
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-amber-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Keperluan (Baris 1):</label>
                <input
                  type="text"
                  value={keperluan1}
                  onChange={(e) => setKeperluan1(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Keperluan (Baris 2 / Tanggal):</label>
                <input
                  type="text"
                  value={keperluan2}
                  onChange={(e) => setKeperluan2(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tanggal Surat (DD-MM-YYYY):</label>
              <input
                type="text"
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nama Ketua RT (Kiri):</label>
              <input
                type="text"
                value={namaKetuaRT}
                onChange={(e) => setNamaKetuaRT(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nama Ketua RW (Kanan):</label>
              <input
                type="text"
                value={namaKetuaRW}
                onChange={(e) => setNamaKetuaRW(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EXACT OFFICIAL PRINTABLE SHEET (WORD / A4 DIMENSIONS)    */}
      {/* ======================================================== */}
      <div className="bg-slate-200/80 p-2 sm:p-6 rounded-3xl flex justify-center overflow-x-auto shadow-inner">
        <div 
          id="official-letter-sheet"
          className="print-container bg-white text-black p-[2.2cm] sm:p-[2.54cm] max-w-[21cm] w-full min-h-[29.7cm] mx-auto shadow-2xl border border-slate-300 leading-normal print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:m-0"
          style={{
            fontFamily: selectedFontFamily,
            color: '#000000',
            backgroundColor: '#ffffff'
          }}
        >
          {/* KOP SURAT RESMI */}
          <div className="flex items-start justify-between gap-4 pb-2 border-b-2 border-black mb-5">
            {/* Logo — uploaded by admin, used as-is with preserved aspect ratio */}
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: `${config.kopLogoWidthMm || 22}mm`,
                height: config.kopLogoHeightMm && config.kopLogoHeightMm > 0
                  ? `${config.kopLogoHeightMm}mm`
                  : `${(config.kopLogoWidthMm || 22) * 1.15}mm`,
                marginLeft: `${config.kopLogoOffsetXMm || 0}mm`,
                marginTop: `${config.kopLogoOffsetYMm || 0}mm`
              }}
            >
              {config.kopLogoDataUrl ? (
                <img
                  src={config.kopLogoDataUrl}
                  alt="Logo Kop Surat"
                  className="max-w-full max-h-full object-contain"
                  style={{ display: 'block' }}
                />
              ) : (
                <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                  <span className="text-[10px] text-center px-1">Upload logo via Pengaturan Kop Surat</span>
                </div>
              )}
            </div>

            {/* Header Text Center — typography hierarchy per template */}
            <div className="flex-1 text-center pr-12">
              <h1 className="font-bold text-[17px] tracking-wide text-black leading-tight uppercase">
                RT {config.namaRT || '004'} &nbsp; RW {config.namaRW || '007'}
              </h1>
              <h2 className="font-bold text-[15px] tracking-wide text-black leading-tight uppercase">
                KELURAHAN {config.kelurahan || 'JATIMULYA'}
              </h2>
              <h2 className="font-bold text-[15px] tracking-wide text-black leading-tight uppercase">
                KECAMATAN {config.kecamatan || 'TAMBUN SELATAN'}
              </h2>
              <p className="text-[11px] text-black mt-1 font-normal leading-tight">
                Sekretariat : {config.alamatSekretariat || 'jl jampang no 111 jatimulya tlp 0896-7720-3444'}
              </p>
            </div>
          </div>

          {/* JUDUL DAN NOMOR SURAT */}
          <div className="text-center mb-6">
            <h3 className="font-bold text-[15px] underline uppercase tracking-wide text-black leading-tight">
              SURAT PENGANTAR
            </h3>
            <p className="font-bold text-[12px] text-black mt-0.5 tracking-wider">
              NO : {nomorSurat}
            </p>
          </div>

          {/* KALIMAT PEMBUKA */}
          <div className="text-black text-[13px] leading-relaxed mb-4">
            <p>Yang Bertanda Tangan Dibawah Ini Ketua Rt 004 Rw 007 Kelurahan Jatimulya.</p>
            <p>Menerangkan Bahwa :</p>
          </div>

          {/* TABEL DATA PEMOHON (ALIGNED COLONS) */}
          <div className="text-black text-[13px] leading-relaxed mb-6 space-y-1">
            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Nama</span>
              <span className="text-center">:</span>
              <span className="font-semibold text-black">{namaPemohon}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Tempat Tgl Lahir</span>
              <span className="text-center">:</span>
              <span>{tempatTglLahir}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Jenis Kelamin</span>
              <span className="text-center">:</span>
              <span>{jenisKelamin}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Status Perkawinan</span>
              <span className="text-center">:</span>
              <span>{statusKawin}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Agama</span>
              <span className="text-center">:</span>
              <span>{agama}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>No Ktp / No Nik</span>
              <span className="text-center">:</span>
              <span className="tracking-wide">{nikPemohon}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Pekerjaan</span>
              <span className="text-center">:</span>
              <span>{pekerjaan}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Telepon / Hp</span>
              <span className="text-center">:</span>
              <span>{telepon || '-'}</span>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Alamat Lengkap</span>
              <span className="text-center">:</span>
              <div>
                <div>{alamatBaris1}</div>
                {alamatBaris2 && (
                  <div className="grid grid-cols-[16px_1fr] items-start -ml-4 mt-0.5">
                    <span className="text-center">:</span>
                    <span>{alamatBaris2}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[170px_16px_1fr] items-start">
              <span>Keperluan</span>
              <span className="text-center">:</span>
              <div>
                <div>{keperluan1}</div>
                {keperluan2 && (
                  <div className="grid grid-cols-[16px_1fr] items-start -ml-4 mt-0.5">
                    <span className="text-center">:</span>
                    <span>{keperluan2}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KALIMAT PENUTUP */}
          <div className="text-black text-[13px] leading-relaxed mb-8">
            <p>Benar Bahwa Yang Bersangkutan Adalah Warga Kami , Demikian Surat-</p>
            <p>Pengantar Ini Dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
          </div>

          {/* TANDA TANGAN (2 KOLOM: KETUA RT & MENGETAHUI KETUA RW) */}
          <div className="grid grid-cols-2 text-[13px] text-black pt-4">
            {/* Kolom Kiri: Ketua RT */}
            <div className="text-left pl-2 sm:pl-4">
              <div>Jatimulya {tanggalSurat}</div>
              <div>Ketua Rt 004 Rw 007</div>
              <div className="h-24 sm:h-28"></div>
              <div className="font-bold text-black">{namaKetuaRT}</div>
            </div>

            {/* Kolom Kanan: Mengetahui Ketua RW */}
            <div className="text-left pl-10 sm:pl-16">
              <div>Mengetahui</div>
              <div>Ketua Rw 007</div>
              <div className="h-24 sm:h-28"></div>
              <div className="font-bold text-black">{namaKetuaRW}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
