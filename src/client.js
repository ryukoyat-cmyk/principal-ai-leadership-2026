import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
export const db = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
export const BUCKET = 'card-images';
export function imageUrl(path) { return path && db ? db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : ''; }
export async function fetchCards(includeHidden = false) {
  if (!db) throw new Error('서비스 연결을 준비하고 있습니다. 잠시 후 다시 방문해 주세요.');
  let query = db.from('cards').select('*').order('position').order('id');
  if (!includeHidden) query = query.eq('is_visible', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
