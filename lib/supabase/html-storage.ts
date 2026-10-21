import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'Html_forms';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://aysysyrjqhqrcqoinbgx.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_ykDYxnsHMXN58NOlvq9Lnw_v9Pv6V--';

function getStorageClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export interface HtmlStorageItem {
  name: string;
  id?: string | null;
  size?: number;
  created_at?: string | null;
  updated_at?: string | null;
  publicUrl?: string;
}

/**
 * Lists all HTML files stored in the 'Html_forms' bucket.
 */
export async function listHtmlStorageTemplates(): Promise<HtmlStorageItem[]> {
  const supabase = getStorageClient();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    console.error('Error listing Html_forms:', error);
    throw new Error(`Impossible de lister le bucket '${BUCKET_NAME}': ${error.message}`);
  }

  if (!data) return [];

  // Filter out system folders, non-html files, and virtual folders (id === null or prefixed with _ or .)
  return data
    .filter(
      (f) =>
        f.name &&
        !f.name.startsWith('.') &&
        !f.name.startsWith('_') &&
        f.id !== null &&
        f.name.toLowerCase().endsWith('.html')
    )
    .map((item) => {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(item.name);
      return {
        name: item.name,
        id: item.id,
        size: item.metadata?.size || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        publicUrl: urlData.publicUrl,
      };
    });
}

/**
 * Downloads and returns the HTML string of a template from 'Html_forms'.
 */
export async function getHtmlStorageContent(fileName: string): Promise<string> {
  const supabase = getStorageClient();
  const cleanName = fileName.trim();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(cleanName);

  if (error) {
    console.error(`Error downloading ${cleanName} from Html_forms:`, error);
    throw new Error(`Erreur lors du téléchargement de '${cleanName}': ${error.message}`);
  }

  if (!data) {
    throw new Error(`Fichier '${cleanName}' introuvable dans '${BUCKET_NAME}'.`);
  }

  return await data.text();
}

/**
 * Inserts / uploads or updates an HTML template in 'Html_forms'.
 */
export async function saveHtmlStorageTemplate(
  fileName: string,
  htmlContent: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = getStorageClient();
  
  // Ensure .html extension
  let safeName = fileName.trim().toLowerCase().replace(/[^a-z0-9-_.]/g, '-');
  if (!safeName.endsWith('.html')) {
    safeName += '.html';
  }

  const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(safeName, blob, {
      contentType: 'text/html; charset=utf-8',
      upsert: true,
    });

  if (error) {
    console.error(`Error saving ${safeName} to Html_forms:`, error);
    throw new Error(`Erreur d'insertion dans '${BUCKET_NAME}': ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(safeName);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Deletes an HTML file from 'Html_forms'.
 */
export async function deleteHtmlStorageTemplate(fileName: string): Promise<boolean> {
  const cleanName = fileName.trim();
  if (
    cleanName.startsWith('_') ||
    cleanName.startsWith('.') ||
    !cleanName.toLowerCase().endsWith('.html')
  ) {
    throw new Error(`Le fichier '${cleanName}' est un fichier système protégé et ne peut pas être supprimé.`);
  }

  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([cleanName]);

  if (error) {
    console.error(`Error deleting ${cleanName} from Html_forms:`, error);
    throw new Error(`Erreur de suppression dans '${BUCKET_NAME}': ${error.message}`);
  }

  return true;
}
