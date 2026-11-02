'use server';

import { createServiceRoleServerClient, createAnonServerClient } from '@/lib/supabase/server';

export interface UploadFileResponse {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadFormFileAction(formData: FormData): Promise<UploadFileResponse> {
  try {
    const file = formData.get('file') as File | null;
    const formSlug = (formData.get('formSlug') as string) || 'general';
    const fieldKey = (formData.get('fieldKey') as string) || 'upload';

    if (!file) {
      return { success: false, error: 'Aucun fichier sélectionné.' };
    }

    // 1. File size check (5 MB maximum)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMo = (file.size / (1024 * 1024)).toFixed(1);
      return {
        success: false,
        error: `Le fichier dépasse la limite maximale de 5 Mo (taille actuelle: ${sizeMo} Mo).`,
      };
    }

    // 2. Validate MIME type & file extension
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
    const lowerName = file.name.toLowerCase();
    const isAllowedExt = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isAllowedExt) {
      return {
        success: false,
        error: 'Format non supporté. Veuillez sélectionner un document PDF (.pdf) ou une image (.png, .jpg).',
      };
    }

    // 3. Prepare client & ensure bucket 'files' is accessible
    const client = createServiceRoleServerClient() || createAnonServerClient();
    if (!client) {
      return { success: false, error: 'Service de stockage temporairement indisponible.' };
    }

    // Ensure bucket 'files' exists (if not created yet)
    try {
      await client.storage.createBucket('files', {
        public: true,
        fileSizeLimit: '5MB',
      });
    } catch {
      // Bucket might already exist, proceed
    }

    // 4. Sanitize file name & generate unique path
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(-60);
    const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `${formSlug}/${fieldKey}/${uniquePrefix}_${sanitizedName}`;

    // 5. Convert file to buffer and upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await client.storage
      .from('files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage files upload error:', uploadError);
      return {
        success: false,
        error: `Échec du téléversement vers le stockage: ${uploadError.message}`,
      };
    }

    // 6. Get Public URL
    const { data: publicData } = client.storage.from('files').getPublicUrl(storagePath);
    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      return { success: false, error: 'Impossible de générer le lien public du fichier.' };
    }

    return {
      success: true,
      publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('uploadFormFileAction exception:', err);
    return { success: false, error: `Erreur inattendue: ${msg}` };
  }
}
