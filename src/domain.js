export const SECTIONS = { preparation: '사전작업', workshop: '본 연수' };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function validUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
export function validateCard(card) {
  if (!card.title?.trim() || card.title.trim().length > 100) throw new Error('제목은 1~100자로 입력해 주세요.');
  if (!validUrl(card.url)) throw new Error('http:// 또는 https://로 시작하는 올바른 링크를 입력해 주세요.');
  if (!(card.section in SECTIONS)) throw new Error('섹션을 선택해 주세요.');
  if ((card.description || '').length > 500) throw new Error('설명은 500자 이내로 입력해 주세요.');
  return { ...card, title: card.title.trim(), url: card.url.trim(), description: (card.description || '').trim() };
}
export function validateImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 이미지를 선택해 주세요.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('이미지는 5MB 이하로 올려 주세요.');
}
export function sortCards(cards) { return [...cards].sort((a,b) => a.position - b.position || a.id.localeCompare(b.id)); }
export function hostname(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
