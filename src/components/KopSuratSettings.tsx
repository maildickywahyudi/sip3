import React, { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Eye, Image as ImageIcon, Save, RotateCcw, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Maximize2, MoveHorizontal, MoveVertical, FileType, Sparkles, ShieldCheck } from 'lucide-react';
import { RTConfig } from '../types';

interface KopSuratSettingsProps {
  config: RTConfig;
  onSaveConfig: (config: RTConfig) => void;
}

const DEFAULT_LOGO_WIDTH_MM = 22;

export const KopSuratSettings: React.FC<KopSuratSettingsProps> = ({ config, onSaveConfig }) => {
  const [logoDataUrl, setLogoDataUrl] = useState<string>(config.kopLogoDataUrl || '');
  const [logoName, setLogoName] = useState<string>(config.kopLogoName || '');
  const [logoWidthMm, setLogoWidthMm] = useState<number>(config.kopLogoWidthMm || DEFAULT_LOGO_WIDTH_MM);
  const [logoHeightMm, setLogoHeightMm] = useState<number>(config.kopLogoHeightMm || 0);
  const [offsetX, setOffsetX] = useState<number>(config.kopLogoOffsetXMm || 0);
  const [offsetY, setOffsetY] = useState<number>(config.kopLogoOffsetYMm || 0);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

  const processFile = useCallback((file: File) => {
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Format file tidak didukung. Hanya PNG, JPG, JPEG, atau SVG.');
      setIsProcessing(false);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file terlalu besar (maksimal 2 MB).');
      setIsProcessing(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setError('Gagal membaca file.');
        setIsProcessing(false);
        return;
      }

      setLogoDataUrl(dataUrl);
      setLogoName(file.name);

      // For SVG we can't easily measure pixel dims; default aspect ratio 1
      if (file.type === 'image/svg+xml') {
        setAspectRatio(1);
        setLogoHeightMm(0);
        setIsProcessing(false);
        setSuccess('Logo SVG berhasil dimuat. Sesuaikan ukuran melalui slider.');
        return;
      }

      // Measure natural dimensions for raster images
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        setAspectRatio(ratio || 1);
        setLogoHeightMm(0); // 0 = auto from aspect ratio
        setIsProcessing(false);
        setSuccess(`Logo "${file.name}" berhasil dimuat.`);
      };
      img.onerror = () => {
        setAspectRatio(1);
        setIsProcessing(false);
        setError('File gambar tidak valid atau rusak.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('Gagal membaca file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDeleteLogo = () => {
    setLogoDataUrl('');
    setLogoName('');
    setLogoWidthMm(DEFAULT_LOGO_WIDTH_MM);
    setLogoHeightMm(0);
    setOffsetX(0);
    setOffsetY(0);
    setAspectRatio(1);
    setSuccess('Logo dihapus. Kop surat akan tampil tanpa logo.');
  };

  const handleSave = () => {
    const updated: RTConfig = {
      ...config,
      kopLogoDataUrl: logoDataUrl,
      kopLogoName: logoName,
      kopLogoWidthMm: logoWidthMm,
      kopLogoHeightMm: logoHeightMm,
      kopLogoOffsetXMm: offsetX,
      kopLogoOffsetYMm: offsetY
    };
    onSaveConfig(updated);
    setSuccess('Pengaturan kop surat berhasil disimpan!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleReset = () => {
    setLogoWidthMm(DEFAULT_LOGO_WIDTH_MM);
    setLogoHeightMm(0);
    setOffsetX(0);
    setOffsetY(0);
    setSuccess('Ukuran & posisi logo dikembalikan ke nilai default.');
  };

  // Compute rendered height preserving aspect ratio
  const computedHeightMm = logoHeightMm > 0 ? logoHeightMm : (logoWidthMm / aspectRatio);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Pengaturan Kop Surat &amp; Logo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah logo resmi RT/Kelurahan. Logo akan tampil apa adanya pada kop surat dengan rasio aspek yang terjaga.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Posisi
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload & Controls */}
        <div className="space-y-5">
          {/* Upload Dropzone */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Unggah Logo Kop Surat
            </h3>

            {!logoDataUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <FileType className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">
                    {isProcessing ? 'Memproses berkas...' : 'Klik atau Tarik Logo ke Sini'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format: PNG, JPG, JPEG, SVG &bull; Maksimal 2 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Logo Preview Thumbnail */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={logoDataUrl}
                      alt="Logo Kop Surat"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{logoName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Lebar: {logoWidthMm} mm &bull; Tinggi: {computedHeightMm.toFixed(1)} mm (otomatis)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Rasio aspek: {aspectRatio.toFixed(2)}:1
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ganti Logo
                  </button>
                  <button
                    onClick={handleDeleteLogo}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Logo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Size & Position Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-blue-600" />
              Ukuran &amp; Posisi Logo
            </h3>

            {/* Width slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MoveHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  Lebar Logo
                </label>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {logoWidthMm} mm
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={1}
                value={logoWidthMm}
                onChange={(e) => setLogoWidthMm(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>10 mm</span>
                <span>60 mm</span>
              </div>
            </div>

            {/* Offset X */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MoveHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  Posisi Horizontal (Geser Kiri/Kanan)
                </label>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {offsetX > 0 ? `+${offsetX}` : offsetX} mm
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={1}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-full accent-slate-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-30 mm (kiri)</span>
                <span>+30 mm (kanan)</span>
              </div>
            </div>

            {/* Offset Y */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MoveVertical className="w-3.5 h-3.5 text-slate-400" />
                  Posisi Vertikal (Geser Atas/Bawah)
                </label>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {offsetY > 0 ? `+${offsetY}` : offsetY} mm
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full accent-slate-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-20 mm (atas)</span>
                <span>+20 mm (bawah)</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-start gap-2.5 text-[11px] text-blue-950">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Catatan:</p>
                <p className="text-slate-600 text-[10px] mt-0.5">
                  Tinggi logo dihitung otomatis dari rasio aspek gambar agar tidak gepeng. Nilai default mengikuti ukuran kop surat standar RT 004.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview of Kop Surat */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Preview Kop Surat (A4)
            </h3>

            {/* A4 Preview Canvas */}
            <div className="bg-slate-200/80 p-4 rounded-xl flex justify-center overflow-x-auto">
              <div
                className="bg-white shadow-xl border border-slate-300 relative"
                style={{
                  width: '210mm',
                  minHeight: '70mm',
                  maxWidth: '100%',
                  transformOrigin: 'top left'
                }}
              >
                {/* Kop Surat Layout — replicating original template structure */}
                <div className="flex items-start gap-4 px-[2.2cm] pt-[1.2cm] pb-2 border-b-2 border-black">
                  {/* Logo */}
                  <div
                    style={{
                      width: `${logoWidthMm}mm`,
                      height: logoDataUrl ? `${computedHeightMm}mm` : `${logoWidthMm}mm`,
                      marginLeft: `${offsetX}mm`,
                      marginTop: `${offsetY}mm`,
                      flexShrink: 0
                    }}
                    className="flex items-center justify-center"
                  >
                    {logoDataUrl ? (
                      <img
                        src={logoDataUrl}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Header Text — hierarchy per template */}
                  <div className="flex-1 text-center pr-12">
                    <h1 className="font-bold text-[15px] tracking-wide text-black leading-tight uppercase">
                      RT 004 &nbsp; RW 007
                    </h1>
                    <h2 className="font-bold text-[14px] tracking-wide text-black leading-tight uppercase">
                      KELURAHAN {config.kelurahan}
                    </h2>
                    <h2 className="font-bold text-[14px] tracking-wide text-black leading-tight uppercase">
                      KECAMATAN {config.kecamatan}
                    </h2>
                    <p className="text-[11px] text-black mt-1 font-normal leading-tight">
                      Sekretariat : {config.alamatSekretariat}
                    </p>
                  </div>
                </div>

                {/* Surat body placeholder preview */}
                <div className="px-[2.2cm] pt-6 text-center">
                  <h3 className="font-bold text-[14px] underline uppercase tracking-wide text-black">
                    SURAT PENGANTAR
                  </h3>
                  <p className="font-bold text-[12px] text-black mt-1">
                    NO : 184 / RT 004 RW 007 / SP / 2026
                  </p>
                  <p className="text-[11px] text-slate-400 mt-8 italic">[ Isi surat &amp; tanda tangan akan tampil pada pratinjau cetak ]</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex items-start gap-2.5 text-[11px] text-emerald-950">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Logo digunakan apa adanya.</p>
                <p className="text-slate-600 text-[10px] mt-0.5">
                  Bentuk, warna, proporsi, dan desain logo Anda tidak diubah. Rasio aspek tetap terjaga pada hasil cetak (A4) dan PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
