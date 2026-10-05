import './style.css';
import { fetchCards } from './client.js';
import { createCard, emptySection, el } from './ui.js';
import { SECTIONS } from './domain.js';
let previous = '', loading = false, succeeded = false;
for (const section of Object.keys(SECTIONS)) document.querySelector(`#${section}-grid`).append(el('div','loading-state','자료를 불러오고 있습니다…'));
async function refresh() {
  if(loading) return; loading=true;
  const status=document.querySelector('#load-status');
  try {
    const cards=await fetchCards(); const next=JSON.stringify(cards);
    if(next!==previous) {
      for(const section of Object.keys(SECTIONS)) { const list=cards.filter(c=>c.section===section); const grid=document.querySelector(`#${section}-grid`); grid.replaceChildren(...(list.length?list.map(createCard):[emptySection(section)])); document.querySelector(`#${section}-count`).textContent=list.length; }
      previous=next;
    }
    succeeded=true; status.hidden=true;
  } catch {
    status.hidden=false; status.replaceChildren(el('span','',succeeded?'자료를 새로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.':'자료를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.'));
    const retry=el('button','text-button','다시 시도'); retry.onclick=refresh; status.append(retry);
    if(!succeeded) for(const section of Object.keys(SECTIONS)) document.querySelector(`#${section}-grid`).replaceChildren(el('div','loading-state','위의 ‘다시 시도’를 눌러 자료를 불러와 주세요.'));
  } finally { loading=false; }
}
refresh();
const pageButtons=[...document.querySelectorAll('[data-page]')];
function showPage(name){
  if(!SECTIONS[name])return;
  document.querySelectorAll('[data-section]').forEach(section=>{section.hidden=section.dataset.section!==name;section.classList.toggle('active-page',section.dataset.section===name);});
  pageButtons.forEach(button=>{const active=button.dataset.page===name;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  document.querySelector('.skip-link').href=`#${name}`;
  document.querySelector('#page-title').focus({preventScroll:true});
}
pageButtons.forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));
document.querySelector('#page-title').tabIndex=-1;
window.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
setInterval(()=>{if(!document.hidden)refresh();},30000);
