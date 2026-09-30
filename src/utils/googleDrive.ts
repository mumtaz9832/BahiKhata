export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

const APP_FOLDER_NAME = 'AutoBill & Smart Khata Invoices';
let cachedFolderId: string | null = null;

/**
 * Finds or creates the dedicated app folder in Google Drive
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  try {
    // 1. Search for existing folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name = '${encodeURIComponent(
      APP_FOLDER_NAME
    )}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false&fields=files(id,name)`;

    const res = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to search Drive folder: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      cachedFolderId = data.files[0].id;
      return cachedFolderId!;
    }

    // 2. Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Invoices, Delivery Challans, and Khata Ledgers created via AutoBill & Smart Khata',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Drive folder: ${createRes.statusText}`);
    }

    const createdData = await createRes.json();
    cachedFolderId = createdData.id;
    return cachedFolderId!;
  } catch (err: any) {
    console.error('Error finding/creating Drive folder:', err);
    throw err;
  }
}

/**
 * Uploads a Blob (PDF invoice or document) to Google Drive
 */
export async function uploadBlobToDrive(
  blob: Blob,
  filename: string,
  accessToken: string,
  mimeType: string = 'application/pdf',
  description?: string
): Promise<DriveFileItem> {
  const folderId = await getOrCreateAppFolder(accessToken);

  const metadata = {
    name: filename,
    parents: [folderId],
    description: description || 'Generated via AutoBill & Smart Khata',
    mimeType,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;

  const fileHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const metaBlob = new Blob([metadataPart, fileHeader]);
  const closeBlob = new Blob([closeDelimiter]);

  const multipartBody = new Blob([metaBlob, blob, closeBlob], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,webViewLink,webContentLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload to Drive: ${res.statusText}`);
  }

  const uploadedFile = await res.json();
  return uploadedFile;
}

/**
 * Uploads Khata JSON backup file to Google Drive
 */
export async function uploadKhataBackupToDrive(
  jsonContent: string,
  filename: string,
  accessToken: string
): Promise<DriveFileItem> {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  return uploadBlobToDrive(blob, filename, accessToken, 'application/json', 'AutoBill & Smart Khata Backup');
}

/**
 * Lists all invoices and backups stored in the app folder on Google Drive
 */
export async function listDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  const folderId = await getOrCreateAppFolder(accessToken);

  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed = false&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink)&orderBy=createdTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to list files from Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads a file's text content (for restoring Khata JSON backup)
 */
export async function downloadDriveFileText(fileId: string, accessToken: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to download file from Drive: ${res.statusText}`);
  }

  return res.text();
}

/**
 * Deletes a file from Google Drive (MUST be preceded by user confirmation dialog)
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Drive: ${res.statusText}`);
  }
}
