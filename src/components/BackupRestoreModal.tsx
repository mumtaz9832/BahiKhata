import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Clock,
  Layers,
  ArrowRight,
  HardDrive,
  Users,
  Package,
  Receipt,
  FileCode,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  exportBackupData,
  downloadBackupFile,
  inspectBackupData,
  restoreBackupData,
  getStorageStatistics,
  getSafetyRollbackSnapshot,
  rollbackToSafetySnapshot,
  clearSafetyRollbackSnapshot,
} from '../utils/storage';
import { AppLanguage, StorageStatistics, BackupInspectionResult, RestoreResult } from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
  lang?: AppLanguage;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  lang = 'en',
}) => {
  if (!isOpen) return null;

  const isHindi = lang === 'hi';

  const [activeTab, setActiveTab] = useState<'export' | 'restore' | 'rollback'>('export');
  const [stats, setStats] = useState<StorageStatistics>(getStorageStatistics());
  const [backupNotes, setBackupNotes] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewJson, setPreviewJson] = useState('');

  // Restore State
  const [restoreMethod, setRestoreMethod] = useState<'upload' | 'paste'>('upload');
  const [rawRestoreText, setRawRestoreText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [inspection, setInspection] = useState<BackupInspectionResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

  // Rollback State
  const [snapshot, setSnapshot] = useState(getSafetyRollbackSnapshot());
  const [rollbackSuccess, setRollbackSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingRollback, setIsConfirmingRollback] = useState(false);
  const [isConfirmingClearSnapshot, setIsConfirmingClearSnapshot] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh statistics and rollback snapshot when modal opens or tab changes
  useEffect(() => {
    setStats(getStorageStatistics());
    setSnapshot(getSafetyRollbackSnapshot());
  }, [isOpen, activeTab]);

  // Handle live inspection when raw text changes
  useEffect(() => {
    if (rawRestoreText.trim()) {
      const res = inspectBackupData(rawRestoreText);
      setInspection(res);
    } else {
      setInspection(null);
    }
  }, [rawRestoreText]);

  // Generate preview when expanding preview
  const handleTogglePreview = () => {
    if (!isPreviewOpen) {
      try {
        const json = exportBackupData(backupNotes || 'Manual backup preview');
        setPreviewJson(json);
      } catch (err) {
        console.error('Failed to preview backup JSON:', err);
      }
    }
    setIsPreviewOpen(!isPreviewOpen);
  };

  const handleDownload = () => {
    try {
      setErrorMessage(null);
      downloadBackupFile(undefined, undefined);
      setDownloadSuccess(true);
      setStats(getStorageStatistics());
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download backup error:', err);
      setErrorMessage(
        isHindi
          ? 'बैकअप फ़ाइल डाउनलोड करने में त्रुटि: ' + String(err)
          : 'Failed to generate backup file: ' + String(err)
      );
    }
  };

  const handleCopyClipboard = async () => {
    try {
      setErrorMessage(null);
      const json = exportBackupData(backupNotes || undefined);
      await navigator.clipboard.writeText(json);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      setErrorMessage(
        isHindi
          ? 'क्लिपबोर्ड पर कॉपी करने में त्रुटि: ' + String(err)
          : 'Failed to copy to clipboard: ' + String(err)
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawRestoreText(content);
    };
    reader.onerror = () => {
      setErrorMessage(
        isHindi ? 'बैकअप फ़ाइल पढ़ने में त्रुटि हुई।' : 'Error reading backup file.'
      );
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage(
        isHindi
          ? 'कृपया केवल मान्य .json बैकअप फ़ाइल अपलोड करें।'
          : 'Please upload a valid .json backup file.'
      );
      return;
    }

    setErrorMessage(null);
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawRestoreText(content);
    };
    reader.readAsText(file);
  };

  const executeRestore = () => {
    if (!rawRestoreText.trim() || !inspection?.isValid) return;

    setErrorMessage(null);
    setIsRestoring(true);
    setTimeout(() => {
      const res = restoreBackupData(rawRestoreText, {
        mode: restoreMode,
        createSafetySnapshot: true,
      });

      setIsRestoring(false);
      setRestoreResult(res);
      setIsConfirmingReplace(false);

      if (res.success) {
        setStats(getStorageStatistics());
        setSnapshot(getSafetyRollbackSnapshot());
        if (onDataRestored) {
          onDataRestored();
        }
      } else {
        setErrorMessage(
          res.error ||
            (isHindi ? 'डेटा रिस्टोर करने में विफलता।' : 'Failed to restore data.')
        );
      }
    }, 400);
  };

  const confirmAndExecuteRollback = () => {
    if (!snapshot) return;

    setErrorMessage(null);
    const res = rollbackToSafetySnapshot();
    setIsConfirmingRollback(false);

    if (res.success) {
      setRollbackSuccess(true);
      setStats(getStorageStatistics());
      setSnapshot(getSafetyRollbackSnapshot());
      if (onDataRestored) {
        onDataRestored();
      }
      setTimeout(() => setRollbackSuccess(false), 3000);
    } else {
      setErrorMessage(res.error || (isHindi ? 'रोलबैक विफल हुआ।' : 'Failed to rollback.'));
    }
  };

  const confirmAndExecuteClearSnapshot = () => {
    clearSafetyRollbackSnapshot();
    setSnapshot(null);
    setIsConfirmingClearSnapshot(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return isHindi ? 'कभी नहीं' : 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Database className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {isHindi ? 'स्थानीय डेटा बैकअप व रिस्टोर' : 'Manual JSON Backup & Restore'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isHindi ? '100% ऑफलाइन सुरक्षित' : '100% Offline Safe'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isHindi
                  ? 'अपने व्यापार बिल, ग्राहक, लेजर और स्टॉक का सुरक्षित JSON बैकअप लें और कभी भी रिस्टोर करें'
                  : 'Export and restore your invoices, parties, ledger balances, and catalog with full rollback safety'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Storage Statistics Quick Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 overflow-x-auto shrink-0 gap-3">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-semibold">{stats.invoiceCount}</span>
              <span className="text-slate-500 text-[11px]">{isHindi ? 'बिल' : 'Bills'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{stats.customerCount}</span>
              <span className="text-slate-500 text-[11px]">{isHindi ? 'ग्राहक' : 'Parties'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold">{stats.productCount}</span>
              <span className="text-slate-500 text-[11px]">{isHindi ? 'आइटम' : 'Items'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            <div className="flex items-center gap-1 text-slate-600">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>~{stats.estimatedSizeKb} KB</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isHindi ? 'अंतिम बैकअप:' : 'Last:'} {stats.lastBackupDate ? formatDate(stats.lastBackupDate) : (isHindi ? 'कोई नहीं' : 'None')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isHindi ? 'बैकअप डाउनलोड करें (Export)' : 'Export Backup'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'restore'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isHindi ? 'बैकअप रिस्टोर करें (Restore)' : 'Restore from File'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rollback')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === 'rollback'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isHindi ? 'सुरक्षा स्नैपशॉट' : 'Safety Rollback'}</span>
            {snapshot && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Snapshot available" />
            )}
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: EXPORT BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isHindi ? 'पूर्ण व्यापार डेटा का मैनुअल JSON बैकअप' : 'Full Local Data Backup (.json)'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                    {isHindi
                      ? 'यह बैकअप फ़ाइल आपके सभी इनवॉइस, ग्राहक लेजर, इन्वेंट्री स्टॉक और व्यापार सेटिंग्स को सुरक्षित रखती है। इसे अपने कंप्यूटर, फोन या पेनड्राइव में सेव करें।'
                      : 'Downloads an offline portable JSON archive containing all invoices, customer khata ledger entries, inventory items, and business configuration.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>{isHindi ? 'डाउनलोड पूरा हुआ!' : 'Downloaded!'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{isHindi ? 'JSON बैकअप फ़ाइल डाउनलोड करें' : 'Download JSON Backup'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Optional Notes & Tags */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isHindi ? 'बैकअप नोट (वैकल्पिक)' : 'Backup Note / Tag (Optional)'}
                </label>
                <input
                  type="text"
                  value={backupNotes}
                  onChange={(e) => setBackupNotes(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'उदा. महीने के अंत का बैकअप, ऑडिट से पहले, सिस्टम अपग्रेड'
                      : 'e.g. Month-end closing audit, prior to browser reset, FY2026'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Secondary Actions: Copy to clipboard & Preview */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">{isHindi ? 'कॉपी हो गया!' : 'Copied to Clipboard!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isHindi ? 'JSON टेक्स्ट क्लिपबोर्ड में कॉपी करें' : 'Copy Raw JSON to Clipboard'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleTogglePreview}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isPreviewOpen ? (isHindi ? 'प्रिव्यू छिपाएं' : 'Hide JSON Preview') : (isHindi ? 'JSON प्रिव्यू देखें' : 'Inspect JSON Preview')}</span>
                  {isPreviewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Collapsible JSON Preview Area */}
              {isPreviewOpen && (
                <div className="p-3 bg-slate-900 rounded-xl text-slate-200 text-[11px] font-mono max-h-60 overflow-y-auto space-y-2 border border-slate-800 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 text-[10px]">
                    <span>BIZCORE_BACKUP v2.1 Payload</span>
                    <span>{stats.estimatedSizeKb} KB</span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all select-all">{previewJson}</pre>
                </div>
              )}

              {/* Security & Offline Guarantee */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">{isHindi ? 'डेटा गोपनीयता और सुरक्षा आश्वासन' : 'Data Privacy & Disaster Recovery'}</div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    {isHindi
                      ? 'आपका डेटा पूरी तरह से आपकी स्थानीय मशीन पर सुरक्षित है। नियमित JSON बैकअप लेने से ब्राउज़र कैश साफ होने या कंप्यूटर बदलने पर आपका व्यापार डेटा कभी नष्ट नहीं होगा।'
                      : 'Your business records are stored on your device. Downloading periodic JSON backups ensures you never lose invoices or khata ledger balances during device migrations or browser resets.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* Method Toggle: Upload File vs Paste Text */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {isHindi ? 'बैकअप इनपुट विधि चुनें:' : 'Select Backup Source:'}
                </span>
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreMethod('upload');
                      setRestoreResult(null);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      restoreMethod === 'upload'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isHindi ? 'फ़ाइल अपलोड' : 'Upload File (.json)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreMethod('paste');
                      setRestoreResult(null);
                    }}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      restoreMethod === 'paste'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isHindi ? 'JSON पेस्ट करें' : 'Paste Raw JSON'}
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              {restoreMethod === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 transition-all rounded-2xl p-6 text-center cursor-pointer group flex flex-col items-center justify-center space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {selectedFileName ? (
                        <span className="text-indigo-700 font-mono">{selectedFileName}</span>
                      ) : isHindi ? (
                        'यहाँ क्लिक करके JSON बैकअप फ़ाइल चुनें या ड्रैग करें'
                      ) : (
                        'Click to browse or drop your .json backup file here'
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedFileSize
                        ? `${Math.round(selectedFileSize / 1024)} KB`
                        : isHindi
                        ? 'मानक BIZCORE JSON बैकअप स्वीकार्य'
                        : 'Compatible with standard BIZCORE and legacy backup formats'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <textarea
                    rows={5}
                    value={rawRestoreText}
                    onChange={(e) => {
                      setRawRestoreText(e.target.value);
                      setRestoreResult(null);
                    }}
                    placeholder={
                      isHindi
                        ? 'यहाँ अपनी JSON बैकअप सामग्री पेस्ट करें...'
                        : 'Paste valid BIZCORE backup JSON text string here...'
                    }
                    className="w-full p-3 font-mono text-[11px] border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Pre-flight Inspection Preview Card */}
              {inspection && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    inspection.isValid
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {inspection.isValid ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-emerald-900">
                              {isHindi ? 'वैध बैकअप फ़ाइल सत्यापित!' : 'Valid Backup File Verified'}
                            </div>
                            <div className="text-[11px] text-emerald-700">
                              {inspection.isLegacy
                                ? (isHindi ? 'लेगेसी BIZCORE फ़ॉर्मेट' : 'Legacy Compatible Format')
                                : (isHindi ? 'BIZCORE स्टैंडर्ड फ़ॉर्मेट (v2.1)' : 'BIZCORE Standard Format (v2.1)')}
                            </div>
                          </div>
                        </div>

                        {inspection.summary.businessName && (
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg">
                            🏢 {inspection.summary.businessName}
                          </span>
                        )}
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 bg-white/80 rounded-lg border border-emerald-100 shadow-2xs">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            {isHindi ? 'इनवॉइस' : 'Invoices'}
                          </div>
                          <div className="text-sm font-black text-slate-900">
                            {inspection.summary.invoiceCount}
                          </div>
                        </div>

                        <div className="p-2 bg-white/80 rounded-lg border border-emerald-100 shadow-2xs">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            {isHindi ? 'ग्राहक / पार्टी' : 'Customers'}
                          </div>
                          <div className="text-sm font-black text-slate-900">
                            {inspection.summary.customerCount}
                          </div>
                        </div>

                        <div className="p-2 bg-white/80 rounded-lg border border-emerald-100 shadow-2xs">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            {isHindi ? 'आइटम / स्टॉक' : 'Items'}
                          </div>
                          <div className="text-sm font-black text-slate-900">
                            {inspection.summary.productCount}
                          </div>
                        </div>

                        <div className="p-2 bg-white/80 rounded-lg border border-emerald-100 shadow-2xs">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            {isHindi ? 'कुल बिक्री' : 'Sales Value'}
                          </div>
                          <div className="text-xs font-black text-emerald-700 truncate">
                            {formatCurrency(inspection.summary.totalSalesValue)}
                          </div>
                        </div>
                      </div>

                      {/* Export Date & Note */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-1">
                        <div>
                          <span className="font-semibold">{isHindi ? 'एक्सपोर्ट समय: ' : 'Exported: '}</span>
                          <span>{formatDate(inspection.exportedAt)}</span>
                        </div>
                        {inspection.notes && (
                          <div className="italic text-slate-500">
                            &quot;{inspection.notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-rose-900">
                          {isHindi ? 'अमान्य बैकअप फ़ाइल' : 'Invalid or Corrupt Backup'}
                        </div>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          {inspection.error || (isHindi ? 'यह JSON फ़ाइल BIZCORE डेटा नहीं रखती है।' : 'Unrecognized backup structure.')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Restore Mode Options */}
              {inspection?.isValid && (
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-bold text-slate-900">
                    {isHindi ? 'रिस्टोर मोड चुनें:' : 'Select Restore Strategy:'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setRestoreMode('replace')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        restoreMode === 'replace'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">
                          {isHindi ? '1. पूर्ण ओवरराइट (Replace All)' : '1. Clean Overwrite (Replace All)'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                          {isHindi ? 'अनुशंसित' : 'Recommended'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isHindi
                          ? 'वर्तमान स्थानीय डेटा को बैकअप फ़ाइल के डेटा से पूरी तरह बदल देता है। नए डिवाइस पर रिस्टोर करने के लिए सबसे उपयुक्त।'
                          : 'Replaces current local storage with the exact data from the backup file. Ideal for migrations and total device recovery.'}
                      </p>
                    </div>

                    <div
                      onClick={() => setRestoreMode('merge')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">
                          {isHindi ? '2. स्मार्ट मर्ज (Merge Records)' : '2. Smart Append & Merge'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {isHindi ? 'सुरक्षित जोड़' : 'Non-destructive'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isHindi
                          ? 'मौजूदा बिल और ग्राहकों को सुरक्षित रखते हुए केवल नए रिकॉर्ड जोड़ता है। समान आईडी वाले रिकॉर्ड ओवरराइट नहीं होंगे।'
                          : 'Keeps existing invoices and parties while seamlessly appending any new missing records from the backup file.'}
                      </p>
                    </div>
                  </div>

                  {/* Safety Snapshot Assurance */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isHindi
                        ? 'सुरक्षा गारंटी: रिस्टोर शुरू करने से पहले आपके वर्तमान डेटा का एक ऑटो-स्नैपशॉट लिया जाएगा। गलती होने पर आप कभी भी रोलबैक कर सकते हैं।'
                        : 'Safety snapshot: An automated rollback snapshot of your current state will be created before proceeding. You can undo anytime.'}
                    </span>
                  </div>

                  {/* Restore Confirmation Dialog or Trigger Button */}
                  {!isConfirmingReplace ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={() => {
                          if (restoreMode === 'replace') {
                            setIsConfirmingReplace(true);
                          } else {
                            executeRestore();
                          }
                        }}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {restoreMode === 'replace'
                            ? isHindi
                              ? `डेटा रिस्टोर करें (${inspection.summary.invoiceCount} बिल)`
                              : `Restore Data (${inspection.summary.invoiceCount} Invoices & Profile)`
                            : isHindi
                            ? `डेटा मर्ज करें (${inspection.summary.invoiceCount} बिल)`
                            : `Merge Data (${inspection.summary.invoiceCount} Invoices)`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3 animate-in fade-in zoom-in-98 duration-100">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-amber-950">
                            {isHindi ? 'क्या आप वाकई स्थानीय डेटा को बदलना चाहते हैं?' : 'Confirm Overwrite & Restore'}
                          </div>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            {isHindi
                              ? `यह क्रिया आपके वर्तमान ${stats.invoiceCount} बिलों को बैकअप के ${inspection.summary.invoiceCount} बिलों से बदल देगी। आपका वर्तमान डेटा सुरक्षा स्नैपशॉट में सहेजा जाएगा।`
                              : `This will replace your current ${stats.invoiceCount} local invoices with ${inspection.summary.invoiceCount} invoices from the backup. An auto-snapshot will be created.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingReplace(false)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 cursor-pointer"
                        >
                          {isHindi ? 'रद्द करें' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={isRestoring}
                          onClick={executeRestore}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          {isRestoring ? (
                            <span>{isHindi ? 'रिस्टोर हो रहा है...' : 'Restoring...'}</span>
                          ) : (
                            <span>{isHindi ? 'हाँ, रिस्टोर पूरा करें' : 'Yes, Confirm & Restore'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Restore Result Card */}
              {restoreResult && (
                <div
                  className={`p-4 rounded-xl border mt-3 animate-in fade-in duration-200 ${
                    restoreResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {restoreResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-xs">
                        {restoreResult.success
                          ? isHindi
                            ? 'डेटा सफलतापूर्वक रिस्टोर हो गया!'
                            : 'Data Restored Successfully!'
                          : isHindi
                          ? 'रिस्टोर विफल हुआ'
                          : 'Restore Failed'}
                      </div>
                      <p className="text-[11px] mt-0.5">
                        {restoreResult.success
                          ? isHindi
                            ? `${restoreResult.restoredStats.invoicesRestored} इनवॉइस, ${restoreResult.restoredStats.customersRestored} ग्राहक और ${restoreResult.restoredStats.productsRestored} उत्पाद सफलतापूर्वक लोड किए गए।`
                            : `Loaded ${restoreResult.restoredStats.invoicesRestored} invoices, ${restoreResult.restoredStats.customersRestored} parties, and ${restoreResult.restoredStats.productsRestored} products.`
                          : restoreResult.error}
                      </p>
                    </div>
                  </div>

                  {restoreResult.success && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 flex justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                      >
                        {isHindi ? 'डैशबोर्ड देखें' : 'View Dashboard'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAFETY ROLLBACK */}
          {activeTab === 'rollback' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? 'सुरक्षा स्नैपशॉट व रोलबैक' : 'Safety Rollback & Undo Protection'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'जब भी आप कोई नया बैकअप रिस्टोर करते हैं, BIZCORE स्वचालित रूप से आपके पहले के डेटा का एक सुरक्षा स्नैपशॉट सहेज लेता है। यदि आपने गलती से गलत फ़ाइल रिस्टोर कर दी हो, तो आप यहाँ से तुरंत पहले जैसी स्थिति में लौट सकते हैं।'
                    : 'Whenever you restore a backup file, BIZCORE automatically freezes a safety snapshot of your previous records. If you ever restore an unintended file, you can immediately undo and revert here.'}
                </p>
              </div>

              {snapshot ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs text-amber-950">
                        {isHindi ? 'सहेजा गया स्नैपशॉट:' : 'Saved Snapshot:'}{' '}
                        {formatDate(snapshot.timestamp)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                      {isHindi ? 'रोलबैक उपलब्ध' : 'Rollback Ready'}
                    </span>
                  </div>

                  {snapshot.summary && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-lg border border-amber-100">
                        <div className="text-[10px] text-slate-500">{isHindi ? 'इनवॉइस' : 'Invoices'}</div>
                        <div className="text-sm font-bold text-slate-900">
                          {snapshot.summary.invoiceCount ?? 0}
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-amber-100">
                        <div className="text-[10px] text-slate-500">{isHindi ? 'ग्राहक' : 'Parties'}</div>
                        <div className="text-sm font-bold text-slate-900">
                          {snapshot.summary.customerCount ?? 0}
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-amber-100">
                        <div className="text-[10px] text-slate-500">{isHindi ? 'उत्पाद' : 'Items'}</div>
                        <div className="text-sm font-bold text-slate-900">
                          {snapshot.summary.productCount ?? 0}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Rollback / Discard Confirmation Panels */}
                  {isConfirmingRollback ? (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                      <p className="text-xs font-semibold text-indigo-950">
                        {isHindi
                          ? 'क्या आप सुनिश्चित हैं? यह क्रिया पिछले रिस्टोर को वापस कर देगी।'
                          : 'Are you sure you want to rollback to this safety snapshot? This will undo the last restore.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={confirmAndExecuteRollback}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                        >
                          {isHindi ? 'हाँ, तुरंत रोलबैक करें' : 'Yes, Rollback Now'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingRollback(false)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 cursor-pointer"
                        >
                          {isHindi ? 'रद्द करें' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : isConfirmingClearSnapshot ? (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                      <p className="text-xs font-semibold text-rose-950">
                        {isHindi
                          ? 'क्या आप वाकई इस सुरक्षा स्नैपशॉट को हटाना चाहते हैं?'
                          : 'Are you sure you want to discard this safety rollback snapshot?'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={confirmAndExecuteClearSnapshot}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                        >
                          {isHindi ? 'हाँ, हटाएँ' : 'Yes, Discard'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingClearSnapshot(false)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 cursor-pointer"
                        >
                          {isHindi ? 'रद्द करें' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingClearSnapshot(true)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        {isHindi ? 'स्नैपशॉट हटाएं' : 'Discard Snapshot'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsConfirmingRollback(true)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'इस स्नैपशॉट पर रोलबैक करें' : 'Rollback to Snapshot'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                  <RotateCcw className="w-8 h-8 mx-auto text-slate-400" />
                  <div className="font-bold text-xs text-slate-700">
                    {isHindi ? 'कोई सक्रिय सुरक्षा स्नैपशॉट नहीं है' : 'No Active Safety Snapshot'}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    {isHindi
                      ? 'जब आप अगली बार कोई फ़ाइल रिस्टोर करेंगे, तो वर्तमान स्थिति का स्नैपशॉट यहाँ अपने आप दिखाई देगा।'
                      : 'An automated snapshot will be created immediately prior to your next restore operation.'}
                  </p>
                </div>
              )}

              {rollbackSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isHindi
                      ? 'डेटा सफलतापूर्वक पिछली स्थिति में रोलबैक हो गया!'
                      : 'Local storage successfully rolled back to snapshot state!'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">BIZCORE v2.1 Storage Engine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 cursor-pointer transition-colors"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
