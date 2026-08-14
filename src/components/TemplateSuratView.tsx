import React, { useState } from 'react';
import { FileText, Plus, CreditCard as Edit3, Trash2, CircleCheck as CheckCircle2, RotateCcw, Copy, Eye, Save, Sparkles, Info, Layers, ArrowRight, Code, Upload } from 'lucide-react';
import { SuratTemplate, RTConfig, Warga } from '../types';
import { storageService } from '../services/storage';
import { DocUploadModal, getSavedDocTemplate, DocTemplateStructure } from './DocUploadModal';

interface TemplateSuratViewProps {
  config: RTConfig;
  wargaList: Warga[];
  onSelectTemplateForSurat?: (template: SuratTemplate) => void;
}

const AVAILABLE_PLACEHOLDERS = [
  { tag: '{{NAMA}}', desc: 'Nama Lengkap Pemohon' },
  { tag: '{{NIK}}', desc: '16 Digit NIK' },
  { tag: '{{NO_KK}}', desc: '16 Digit Nomor KK' },
  { tag: '{{TEMPAT_LAHIR}}', desc: 'Kota / Tempat Kelahiran' },
  { tag: '{{TANGGAL_LAHIR}}', desc: 'Tanggal Lahir Pemohon' },
  { tag: '{{JENIS_KELAMIN}}', desc: 'Laki-Laki / Perempuan' },
  { tag: '{{AGAMA}}', desc: 'Agama Pemohon' },
  { tag: '{{PEKERJAAN}}', desc: 'Pekerjaan / Profesi' },
  { tag: '{{STATUS_KAWIN}}', desc: 'Status Pernikahan' },
  { tag: '{{ALAMAT}}', desc: 'Alamat Domisili Warga' },
  { tag: '{{RT}}', desc: 'Nomor RT (004)' },
  { tag: '{{RW}}', desc: 'Nomor RW (007)' },
  { tag: '{{KELURAHAN}}', desc: 'Nama Kelurahan (Jatimulya)' },
  { tag: '{{KECAMATAN}}', desc: 'Nama Kecamatan (Tambun Selatan)' },
  { tag: '{{KOTA}}', desc: 'Nama Kota / Kabupaten' },
  { tag: '{{KEPERLUAN}}', desc: 'Tujuan / Keperluan Surat' },
  { tag: '{{TANGGAL_SURAT}}', desc: 'Tanggal Pembuatan Surat' },
  { tag: '{{NOMOR_SURAT}}', desc: 'Nomor Registrasi Surat RT' },
];

export const TemplateSuratView: React.FC<TemplateSuratViewProps> = ({
  config,
  wargaList,
  onSelectTemplateForSurat
}) => {
  const [templates, setTemplates] = useState<SuratTemplate[]>(storageService.getTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState<SuratTemplate>(templates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<SuratTemplate>(templates[0] || null);
  const [previewWargaId, setPreviewWargaId] = useState<string>(wargaList[0]?.id || '');
  const [toast, setToast] = useState<string | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const sampleWarga = wargaList.find(w => w.id === previewWargaId) || wargaList[0] || {
    nama: 'H. Bambang Sukamto',
    nik: '3216061205750001',
    nomorKK: '3216060101150001',
    tempatLahir: 'Bekasi',
    tanggalLahir: '1975-05-12',
    jenisKelamin: 'L',
    agama: 'ISLAM',
    pekerjaan: 'Wiraswasta',
    statusPerkawinan: 'KAWIN',
    statusTinggal: 'TETAP'
  };

  const showFeedback = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelect = (t: SuratTemplate) => {
    setSelectedTemplate(t);
    setEditForm(t);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newTpl: SuratTemplate = {
      id: `tpl-${Date.now()}`,
      kode: 'CUSTOM',
      nama: 'Template Surat Kustom Baru',
      judulSurat: 'SURAT KETERANGAN RT 004 RW 007',
      keperluanDefault: 'Keperluan administrasi warga',
      isiTemplate: `Yang bertanda tangan di bawah ini Ketua RT {{RT}} RW {{RW}} Kelurahan {{KELURAHAN}}, menerangkan bahwa:

Nama Lengkap : {{NAMA}}
NIK          : {{NIK}}
Nomor KK     : {{NO_KK}}
Alamat       : {{ALAMAT}}

Menerangkan bahwa yang bersangkutan adalah warga RT {{RT}} RW {{RW}} Kelurahan {{KELURAHAN}} dan surat ini dibuat untuk keperluan:
"{{KEPERLUAN}}"

Demikian surat ini dibuat agar dapat dipergunakan sebagaimana mestinya.`,
      isActive: true,
      keterangan: 'Template kustom pengurus RT',
      tanggalDibuat: new Date().toISOString().split('T')[0]
    };

    setEditForm(newTpl);
    setSelectedTemplate(newTpl);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveTemplate(editForm);
    const updated = storageService.getTemplates();
    setTemplates(updated);
    setSelectedTemplate(editForm);
    setIsEditing(false);
    showFeedback(`Template "${editForm.nama}" berhasil disimpan!`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus template surat ini?')) {
      storageService.deleteTemplate(id);
      const updated = storageService.getTemplates();
      setTemplates(updated);
      if (updated.length > 0) {
        setSelectedTemplate(updated[0]);
        setEditForm(updated[0]);
      }
      showFeedback('Template surat dihapus.');
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan semua template ke template standar resmi RT 004 RW 007?')) {
      storageService.resetTemplates();
      const updated = storageService.getTemplates();
      setTemplates(updated);
      setSelectedTemplate(updated[0]);
      setEditForm(updated[0]);
      showFeedback('Template berhasil direset ke standar bawaan.');
    }
  };

  const insertPlaceholder = (tag: string) => {
    if (!isEditing) return;
    setEditForm(prev => ({
      ...prev,
      isiTemplate: prev.isiTemplate + ` ${tag} `
    }));
  };

  // Compile Live Preview
  const generatePreviewText = (template: SuratTemplate) => {
    if (!template) return '';
    let text = template.isiTemplate;
    const replacements: Record<string, string> = {
      '{{NAMA}}': sampleWarga.nama || 'Bambang Sukamto',
      '{{NIK}}': sampleWarga.nik || '3216061205750001',
      '{{NO_KK}}': sampleWarga.nomorKK || '3216060101150001',
      '{{TEMPAT_LAHIR}}': sampleWarga.tempatLahir || 'Bekasi',
      '{{TANGGAL_LAHIR}}': sampleWarga.tanggalLahir || '12 Mei 1975',
      '{{JENIS_KELAMIN}}': sampleWarga.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
      '{{AGAMA}}': sampleWarga.agama || 'ISLAM',
      '{{PEKERJAAN}}': sampleWarga.pekerjaan || 'Wiraswasta',
      '{{STATUS_KAWIN}}': sampleWarga.statusPerkawinan || 'KAWIN',
      '{{ALAMAT}}': `Kp Jati RT ${config.namaRT || '004'} RW ${config.namaRW || '007'} Kelurahan ${config.kelurahan || 'Jatimulya'}`,
      '{{ALAMAT_BARIS_1}}': `Kp Jati RT ${config.namaRT || '004'} RW ${config.namaRW || '007'} Kelurahan ${config.kelurahan || 'Jatimulya'}`,
      '{{ALAMAT_BARIS_2}}': `Kec. ${config.kecamatan || 'Tambun Selatan'} Kab. ${config.kabupatenKota?.replace('Kabupaten ', '') || 'Bekasi'}`,
      '{{TELEPON}}': sampleWarga.telepon || '-',
      '{{RT}}': config.namaRT || '004',
      '{{RW}}': config.namaRW || '007',
      '{{KELURAHAN}}': config.kelurahan || 'Jatimulya',
      '{{KECAMATAN}}': config.kecamatan || 'Tambun Selatan',
      '{{KOTA}}': config.kabupatenKota || 'Kabupaten Bekasi',
      '{{KEPERLUAN}}': template.keperluanDefault || 'Membuat Akte Kematian HERI PURNOMO',
      '{{TANGGAL_SURAT}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      '{{NOMOR_SURAT}}': `184 / RT ${config.namaRT || '004'} RW ${config.namaRW || '007'} / SP / 2026`
    };

    Object.entries(replacements).forEach(([key, val]) => {
      text = text.replaceAll(key, val);
    });

    return text;
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-slate-900 text-white rounded-full text-xs font-semibold shadow-lg animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Manajemen Template Surat Pengantar RT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola draft template surat, placeholder dinamis, dan kustomisasi format resmi RT 004 RW 007 Jatimulya
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full border border-blue-200 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            Unggah Acuan DOC (.docx)
          </button>
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Template Baru
          </button>
        </div>
      </div>

      {/* Main Grid: Left List, Right Editor & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Template Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 px-1 flex items-center justify-between">
            <span>Daftar Template Aktif ({templates.length})</span>
            <span className="text-[10px] text-slate-400 font-normal">Klik untuk memilih</span>
          </div>

          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelect(tpl)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">{tpl.nama}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">
                      {tpl.kode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                    {tpl.keterangan || tpl.keperluanDefault}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{tpl.tanggalDibuat}</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      Lihat Template <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Editor & Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTemplate && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedTemplate.nama}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedTemplate.judulSurat}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Template
                      </button>
                      <button
                        onClick={() => handleDelete(selectedTemplate.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer"
                        title="Hapus template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              {/* Form / Edit Mode */}
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Template</label>
                      <input
                        type="text"
                        value={editForm.nama}
                        onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Judul Resmi pada Kop Surat</label>
                      <input
                        type="text"
                        value={editForm.judulSurat}
                        onChange={(e) => setEditForm({ ...editForm, judulSurat: e.target.value })}
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl uppercase font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Keperluan Default</label>
                    <input
                      type="text"
                      value={editForm.keperluanDefault}
                      onChange={(e) => setEditForm({ ...editForm, keperluanDefault: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Placeholder Chips Selector */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Sisipkan Placeholder Dinamis:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Klik chip untuk menyisipkan ke isi surat</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                      {AVAILABLE_PLACEHOLDERS.map(p => (
                        <button
                          key={p.tag}
                          type="button"
                          onClick={() => insertPlaceholder(p.tag)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:border-blue-400 border border-slate-200 text-slate-800 rounded-lg text-[10px] font-mono font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title={p.desc}
                        >
                          <Code className="w-3 h-3 text-blue-600" />
                          <span>{p.tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea for Template Body */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Isi / Batang Tubuh Surat:
                    </label>
                    <textarea
                      rows={10}
                      value={editForm.isiTemplate}
                      onChange={(e) => setEditForm({ ...editForm, isiTemplate: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 bg-slate-50/50 leading-relaxed focus:bg-white"
                      placeholder="Ketik teks surat dengan placeholder..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-sm transition flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Simpan Template Surat
                    </button>
                  </div>
                </form>
              ) : (
                /* View & Live Simulation Preview */
                <div className="space-y-4">
                  {/* Simulation Selector Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-950">Simulasi Live Preview dengan Data Warga:</span>
                    </div>
                    <select
                      value={previewWargaId}
                      onChange={(e) => setPreviewWargaId(e.target.value)}
                      className="bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-blue-500"
                    >
                      {wargaList.slice(0, 15).map(w => (
                        <option key={w.id} value={w.id}>
                          {w.nama} (NIK: {w.nik}) - {w.statusTinggal}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Preview Box */}
                  <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 font-serif text-slate-900">
                    {/* Header Kop Preview */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-slate-900">
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{
                          width: `${config.kopLogoWidthMm || 22}mm`,
                          height: `${(config.kopLogoWidthMm || 22) * 1.15}mm`,
                          maxWidth: '60px',
                          maxHeight: '70px'
                        }}
                      >
                        {config.kopLogoDataUrl ? (
                          <img src={config.kopLogoDataUrl} alt="Logo Kop" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400 text-center px-1">
                            Upload logo
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center pr-12">
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          RT 004 &nbsp; RW 007
                        </h4>
                        <h5 className="text-xs font-black uppercase">
                          KELURAHAN {config.kelurahan} &bull; KECAMATAN {config.kecamatan}
                        </h5>
                        <p className="text-[10px] font-sans text-slate-600 mt-0.5">
                          {config.alamatSekretariat} &bull; Telp/WA: {config.kontakSekretariat || config.kontakRT}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center pt-2">
                      <h3 className="text-sm font-bold underline uppercase tracking-wide">
                        {selectedTemplate.judulSurat}
                      </h3>
                      <p className="text-xs font-mono font-normal mt-0.5 text-slate-700">
                        Nomor: 045/SP-RT{config.namaRT}/RW{config.namaRW}/JTM/VIII/2026
                      </p>
                    </div>

                    {/* Compiled Body */}
                    <div className="text-xs whitespace-pre-wrap leading-relaxed pt-2 font-mono text-slate-800 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                      {generatePreviewText(selectedTemplate)}
                    </div>

                    {/* Signature Preview */}
                    <div className="pt-6 flex justify-end">
                      <div className="text-center w-52 font-sans text-xs">
                        <div>Jatimulya, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div className="font-semibold text-slate-700 mt-0.5">Ketua RT 004 RW 007</div>
                        <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                          [ Tanda Tangan & Stempel Resmi ]
                        </div>
                        <div className="font-bold underline text-slate-900">{config.namaKetuaRT}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* DOC Upload Modal */}
      <DocUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        config={config}
        onTemplateApplied={(docTpl) => {
          const newTemplateObj: SuratTemplate = {
            id: `tpl-doc-${Date.now()}`,
            kode: 'DOC_ACUAN',
            nama: `Template Acuan (${docTpl.fileName})`,
            judulSurat: docTpl.detectedHeaders.judulSurat || 'SURAT PENGANTAR',
            keperluanDefault: 'Keperluan administrasi warga',
            isiTemplate: docTpl.rawText,
            isActive: true,
            keterangan: `Diunggah dari file ${docTpl.fileName}`,
            tanggalDibuat: new Date().toISOString().split('T')[0]
          };
          storageService.saveTemplate(newTemplateObj);
          const updated = storageService.getTemplates();
          setTemplates(updated);
          setSelectedTemplate(newTemplateObj);
          setEditForm(newTemplateObj);
          showFeedback(`Template acuan dari "${docTpl.fileName}" berhasil diterapkan!`);
        }}
      />
    </div>
  );
};
