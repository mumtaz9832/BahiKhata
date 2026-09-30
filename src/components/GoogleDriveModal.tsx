import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  DriveFileItem,
  listDriveFiles,
  deleteDriveFile,
  uploadKhataBackupToDrive,
  downloadDriveFileText,
} from '../utils/googleDrive';
import { exportBackupData, importBackupData } from '../utils/storage';
import {
  Cloud,
  X,
  ExternalLink,
  Trash2,
  Upload,
  RefreshCw,
  FolderSync,
  FileText,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowDownToLine,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignInRequired: () => void;
  onKhataRestored: () => void;
  onUploadCurrentInvoice: () => void;
  isUploadingCurrent: boolean;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignInRequired,
  onKhataRestored,
  onUploadCurrentInvoice,
  isUploadingCurrent,
}) => {
  if (!isOpen) return null;

  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'files' | 'backup'>('files');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Destructive delete confirmation dialog state (Mandatory per skill)
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Restore confirmation dialog state
  const [backupToRestore, setBackupToRestore] = useState<DriveFileItem | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Backup loading state
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  const fetchFiles = async () => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const items = await listDriveFiles(accessToken);
      setFiles(items);
    } catch (err: any) {
      console.error('Error fetching Drive files:', err);
      setErrorMessage(err.message || 'Failed to list files from Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchFiles();
    }
  }, [isOpen, accessToken]);

  const handleBackupNow = async () => {
    if (!accessToken) {
      onSignInRequired();
      return;
    }
    setIsBackingUp(true);
    setErrorMessage(null);
    try {
      const jsonBackup = exportBackupData();
      const filename = `AutoBill_Khata_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      await uploadKhataBackupToDrive(jsonBackup, filename, accessToken);
      setSuccessMessage('Khata ledger backed up successfully to Google Drive!');
      setTimeout(() => setSuccessMessage(null), 3500);
      await fetchFiles();
    } catch (err: any) {
      console.error('Backup error:', err);
      setErrorMessage(err.message || 'Failed to back up Khata to Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !accessToken) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteDriveFile(fileToDelete.id, accessToken);
      setSuccessMessage(`File "${fileToDelete.name}" removed from Google Drive.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMessage(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!backupToRestore || !accessToken) return;
    setIsRestoring(true);
    setErrorMessage(null);
    try {
      const jsonText = await downloadDriveFileText(backupToRestore.id, accessToken);
      const success = importBackupData(jsonText);
      if (success) {
        setSuccessMessage('Khata data restored successfully from Google Drive!');
        onKhataRestored();
        setTimeout(() => {
          setSuccessMessage(null);
          setBackupToRestore(null);
        }, 2000);
      } else {
        throw new Error('Invalid backup file structure.');
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      setErrorMessage(err.message || 'Failed to restore Khata from Google Drive file.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-900/30">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Google Drive Cloud Hub
                </h2>
                <span className="text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded">
                  Workspace Drive Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Folder: <span className="font-mono text-slate-300">AutoBill &amp; Smart Khata Invoices</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFiles}
              disabled={isLoadingFiles || !accessToken}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              title="Refresh Drive files"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Account / Auth Check Banner */}
        {!user || !accessToken ? (
          <div className="p-6 bg-blue-50 border-b border-blue-200 text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-xs border border-blue-200">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Connect your Google Account to access Google Drive
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                Back up your bills, delivery challans, and customer Khata ledgers securely in your own Google Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={onSignInRequired}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google Account'}
                  className="w-7 h-7 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName[0] : 'G'}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900 leading-tight">
                  {user.displayName || user.email}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {user.email} &bull; Connected
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onUploadCurrentInvoice}
                disabled={isUploadingCurrent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploadingCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Upload Current Bill</span>
              </button>

              <button
                type="button"
                onClick={handleBackupNow}
                disabled={isBackingUp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBackingUp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderSync className="w-3.5 h-3.5" />
                )}
                <span>Backup Khata to Drive</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 cursor-pointer font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1 font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Files on Google Drive ({files.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud Backup &amp; Restore</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'files' ? (
            <div className="space-y-2">
              {isLoadingFiles ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs font-semibold">Reading Google Drive folder...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Cloud className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">
                    No files found in "AutoBill &amp; Smart Khata Invoices"
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click "Upload Current Bill" or "Backup Khata to Drive" above to save your first document directly to your Google Drive!
                  </p>
                </div>
              ) : (
                files.map((file) => {
                  const isPdf = file.mimeType.includes('pdf');
                  const isJson = file.mimeType.includes('json');

                  return (
                    <div
                      key={file.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          {isPdf ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <Database className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>
                              {file.createdTime
                                ? new Date(file.createdTime).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recent'}
                            </span>
                            {file.size && (
                              <span>&bull; {(parseInt(file.size) / 1024).toFixed(1)} KB</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1 transition-colors"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Open in Drive</span>
                          </a>
                        )}

                        {isJson && (
                          <button
                            type="button"
                            onClick={() => setBackupToRestore(file)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="Restore Khata from this backup"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restore</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-xl mx-auto py-3">
              {/* Backup Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2">
                  <FolderSync className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Sync Complete Ledger to Google Drive
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Backs up all saved invoices, vehicle delivery records, customer balances, and your dealership profile into an encrypted JSON file stored in your Google Drive.
                </p>
                <button
                  type="button"
                  onClick={handleBackupNow}
                  disabled={isBackingUp || !accessToken}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                  <span>Create Cloud Backup Now</span>
                </button>
              </div>

              {/* Restore Info */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Restore from Google Drive
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To restore, switch to the <strong>Files on Google Drive</strong> tab, locate a backup file (e.g. <code>AutoBill_Khata_Backup_*.json</code>), and click <strong>Restore</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Google Drive integration &bull; Real-time synchronization</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive Deletion */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Confirm Deletion from Google Drive
              </h3>
            </div>

            <div className="text-xs text-slate-700 space-y-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                Are you sure you want to permanently delete:
              </p>
              <p className="font-bold text-slate-900 font-mono break-all">
                "{fileToDelete.name}"
              </p>
              <p className="text-slate-500 text-[11px]">
                This will remove the file directly from your Google Drive. This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete File Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Restoring Khata from Drive */}
      {backupToRestore && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-amber-600">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Restore Khata Ledger from Google Drive
              </h3>
            </div>

            <div className="text-xs text-slate-700 space-y-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                Restore Khata ledger from Google Drive file:
              </p>
              <p className="font-bold text-slate-900 font-mono break-all">
                "{backupToRestore.name}"
              </p>
              <p className="text-amber-800 text-[11px] font-semibold">
                &bull; This will merge and restore all saved invoices and dealership profile data.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBackupToRestore(null)}
                disabled={isRestoring}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Confirm Restore</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
