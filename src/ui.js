import { imageUrl } from './client.js';
export function el(tag, className, text) { const node = document.createElement(tag); if(className) node.className=className; if(text !== undefined) node.textContent=text; return node; }
export function cardVisual(card) {
  const visual = el('div', `card-visual visual-${card.section}`);
  const art = el('div', 'default-art');
  art.setAttribute('aria-hidden', 'true');
  art.append(el('span', 'art-planet'), el('span', 'art-spark', '✦'));
  visual.append(art);
  if (card.image_path) { const img = el('img'); img.src=imageUrl(card.image_path); img.alt=''; img.loading='lazy'; img.addEventListener('error',()=>img.remove()); visual.append(img); }
  return visual;
}
export function cardContents(card, index) {
  const visual=cardVisual(card); visual.append(el('span','card-index',String(index+1).padStart(2,'0')));
  const body=el('div','card-body'); body.append(el('h3','',card.title));
  if(card.description) body.append(el('p','card-description',card.description));
  return [visual, body];
}
export function createCard(card, index) {
  const link=el('a','resource-card'); link.href=card.url; link.target='_blank'; link.rel='noopener noreferrer';
  link.setAttribute('aria-label', `${card.title} (새 탭에서 열기)`);
  link.append(...cardContents(card,index)); return link;
}
export function emptySection(section) {
  const box=el('div',`empty-state empty-${section}`); box.append(el('span','empty-symbol','✦'));
  const words=el('div');
  const copy={preparation:['배움의 첫걸음을 준비하고 있어요','사전 준비 자료가 등록되면 이곳에서 확인할 수 있습니다.'],workshop:['새로운 가능성을 만날 시간','연수에 사용할 교안과 강의 자료를 이곳에서 확인할 수 있습니다.'],resources:['실습에 필요한 도구를 모으고 있어요','다운로드 자료와 실습 링크가 등록되면 이곳에서 확인할 수 있습니다.'],survey:['배움의 여정을 마무리해 주세요','연수 후 설문 링크가 등록되면 이곳에서 참여할 수 있습니다.']}[section];
  words.append(el('h3','',copy[0]));
  words.append(el('p','',copy[1]));
  box.append(words,el('span','empty-note','COMING SOON')); return box;
}
