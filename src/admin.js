import './style.css';
import { db, BUCKET, fetchCards } from './client.js';
import { ADMIN_ID } from './config.js';
import { SECTIONS, validateCard, validateImage, sortCards } from './domain.js';
import { el, cardVisual, cardContents } from './ui.js';
const $=s=>document.querySelector(s);
let cards=[], filter='all', editing=null, deleting=null, removeImage=false, selectedFile=null, previewUrl=null, busy=false, toastTimer;
function toast(message,error=false){const t=$('#toast');t.textContent=message;t.classList.toggle('error',error);t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,6000);}
function message(error,fallback='저장하지 못했습니다. 잠시 후 다시 시도해 주세요.') { return error?.message && /^[가-힣]/.test(error.message) ? error.message : fallback; }
function showLogin(){ $('#dashboard').hidden=true; $('#login-panel').hidden=false; cards=[]; $('#admin-list').replaceChildren(); }
async function authorize(){ if(!db)return false; const {data:{user},error}=await db.auth.getUser(); if(error||!user)return false; const {data,error:check}=await db.from('administrators').select('user_id').eq('user_id',user.id).maybeSingle(); return !check&&!!data; }
async function loadDashboard(){
  if(!await authorize()){await db?.auth.signOut();showLogin();return;}
  $('#login-panel').hidden=true;$('#dashboard').hidden=false;
  try{cards=await fetchCards(true);render();}catch{toast('자료를 불러오지 못했습니다. 새로고침해 주세요.',true);}
}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;$('#login-message').textContent='';
  try{if(!db)throw new Error('서비스 연결을 준비하고 있습니다.');const {error}=await db.auth.signInWithPassword({email:ADMIN_ID,password:$('#password').value});if(error)throw error;if(!await authorize()){await db.auth.signOut();throw new Error('관리자 권한을 확인할 수 없습니다.');}$('#password').value='';await loadDashboard();}catch(error){$('#login-message').textContent=message(error,'비밀번호가 올바르지 않거나 잠시 로그인이 제한되었습니다. 다시 확인해 주세요.');}finally{b.disabled=false;}
});
$('#logout-button').onclick=async()=>{const {error}=await db.auth.signOut();if(error){toast('로그아웃하지 못했습니다. 다시 시도해 주세요.',true);return;}showLogin();};
db?.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){document.querySelectorAll('dialog[open]').forEach(d=>d.close());showLogin();}});
function render(){
  const root=$('#admin-list');root.replaceChildren();
  for(const section of Object.keys(SECTIONS)){
    if(filter!=='all'&&filter!==section)continue;
    const list=sortCards(cards.filter(c=>c.section===section));const group=el('section','admin-section');group.append(el('h2','',`${SECTIONS[section]} · ${list.length}`));
    const grid=el('div','card-grid admin-card-grid');group.append(grid);
    if(!list.length)grid.append(el('div','admin-empty','아직 등록된 자료가 없습니다. ‘＋ 자료 추가’로 시작해 보세요.'));
    list.forEach((card,index)=>{const row=el('article',`resource-card admin-card${card.is_visible?'':' is-hidden'}`);row.append(...cardContents(card,index));
      const controls=el('div','card-controls');controls.append(el('span',`visibility-badge${card.is_visible?'':' hidden-badge'}`,card.is_visible?'공개 중':'숨김'));
      const actions=el('div','row-actions');
      const action=(text,label,fn,disabled=false,cls='')=>{const b=el('button',cls,text);b.type='button';b.setAttribute('aria-label',`${card.title} ${label}`);b.onclick=fn;b.disabled=disabled;actions.append(b);};
      action('↑','위로 이동',()=>moveCard(card,-1),index===0);action('↓','아래로 이동',()=>moveCard(card,1),index===list.length-1);
      action(card.is_visible?'숨기기':'공개하기','공개 상태 변경',()=>mutate(async()=>{const {error}=await db.from('cards').update({is_visible:!card.is_visible}).eq('id',card.id).select('id').single();if(error)throw error;},card.is_visible?'자료를 숨겼습니다.':'자료를 공개했습니다.'));
      action('수정','수정',()=>openEditor(card));action('삭제','삭제',()=>{deleting=card;$('#delete-title').textContent=card.title;$('#delete-dialog').showModal();},false,'delete-action');controls.append(actions);row.append(controls);grid.append(row);
    });root.append(group);
  }
}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();});
async function mutate(fn,success){if(busy)return;busy=true;$('#admin-list').setAttribute('aria-busy','true');try{await fn();cards=await fetchCards(true);render();toast(success);}catch(error){toast(message(error),true);}finally{busy=false;$('#admin-list').removeAttribute('aria-busy');}}
async function moveCard(card,direction){const list=sortCards(cards.filter(c=>c.section===card.section));const i=list.findIndex(c=>c.id===card.id);const other=i+direction;if(other<0||other>=list.length)return;[list[i],list[other]]=[list[other],list[i]];await mutate(async()=>{const {error}=await db.rpc('reorder_cards',{section_name:card.section,ordered_ids:list.map(c=>c.id)});if(error)throw error;},'자료 순서를 변경했습니다.');}
function clearPreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}}
function renderPreview(){clearPreview();const box=$('#image-preview');box.replaceChildren();if(selectedFile){previewUrl=URL.createObjectURL(selectedFile);const img=el('img');img.src=previewUrl;img.alt='선택한 이미지 미리보기';box.append(img);}else{box.append(cardVisual({section:$('#card-form').elements.section.value,image_path:removeImage?null:editing?.image_path}));}$('#remove-image').hidden=!selectedFile&&(!editing?.image_path||removeImage);}
function openEditor(card=null){editing=card;removeImage=false;selectedFile=null;const form=$('#card-form');form.reset();form.elements.section.value=card?.section||(filter==='all'?'preparation':filter);form.elements.title.value=card?.title||'';form.elements.url.value=card?.url||'';form.elements.description.value=card?.description||'';form.elements.is_visible.checked=card?.is_visible??true;$('#editor-title').textContent=card?'자료 수정':'자료 추가';$('#edit-message').textContent='';renderPreview();$('#edit-dialog').showModal();}
$('#add-button').onclick=()=>openEditor();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(!busy)document.getElementById(b.dataset.close).close();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{if(busy)e.preventDefault();}));
$('#edit-dialog').addEventListener('close',clearPreview);
$('#card-form').elements.section.onchange=renderPreview;
$('#image-input').onchange=e=>{const file=e.target.files[0];if(!file)return;try{validateImage(file);selectedFile=file;removeImage=false;$('#edit-message').textContent='';renderPreview();}catch(error){e.target.value='';$('#edit-message').textContent=error.message;}};
$('#remove-image').onclick=()=>{selectedFile=null;removeImage=true;$('#image-input').value='';renderPreview();};
async function uploadImage(file){
  validateImage(file);let bitmap;
  try{bitmap=await createImageBitmap(file);}catch{throw new Error('이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.');}
  const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.86));if(!blob)throw new Error('이미지를 변환하지 못했습니다.');
  const path=`cards/${crypto.randomUUID()}.webp`;const {error}=await db.storage.from(BUCKET).upload(path,blob,{contentType:'image/webp',upsert:false});if(error)throw error;return path;
}
async function removeStoredImage(path){if(!path)return;const {error}=await db.storage.from(BUCKET).remove([path]);if(error)console.warn('Unused image cleanup failed');}
$('#card-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;$('#save-button').disabled=true;$('#save-button').textContent='저장 중…';$('#edit-message').textContent='';let uploaded=null,saved=false;
  try{const f=e.currentTarget.elements;const card=validateCard({title:f.title.value,url:f.url.value,description:f.description.value,section:f.section.value,is_visible:f.is_visible.checked});
    const imagePath=selectedFile?(uploaded=await uploadImage(selectedFile)):(removeImage?null:editing?.image_path||null);
    const payload={...card,image_path:imagePath};
    if(!editing||editing.section!==card.section)payload.position=Math.max(-1,...cards.filter(c=>c.section===card.section).map(c=>c.position))+1;
    const query=editing?db.from('cards').update(payload).eq('id',editing.id):db.from('cards').insert(payload);
    const {error}=await query.select('id').single();if(error)throw error;saved=true;
    if(editing?.image_path&&editing.image_path!==imagePath)await removeStoredImage(editing.image_path);
    $('#edit-dialog').close();toast('자료를 저장했습니다.');cards=await fetchCards(true);render();
  }catch(error){if(uploaded&&!saved)await removeStoredImage(uploaded);if(saved)toast('저장은 완료했습니다. 목록을 새로고침해 주세요.',true);else $('#edit-message').textContent=message(error);}finally{busy=false;$('#save-button').disabled=false;$('#save-button').textContent='저장하기';}
});
$('#confirm-delete').onclick=async()=>{if(!deleting||busy)return;const card=deleting;$('#confirm-delete').disabled=true;await mutate(async()=>{const {error}=await db.from('cards').delete().eq('id',card.id).select('id').single();if(error)throw error;await removeStoredImage(card.image_path);$('#delete-dialog').close();deleting=null;},'자료를 삭제했습니다.');$('#confirm-delete').disabled=false;};
$('#password-button').onclick=()=>{$('#password-form').reset();$('#password-message').textContent='';$('#password-dialog').showModal();};
$('#password-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const f=e.currentTarget.elements;const status=$('#password-message');status.textContent='';if(f.next.value.length<12){status.textContent='새 비밀번호는 12자 이상으로 입력해 주세요.';return;}if(f.next.value!==f.confirm.value){status.textContent='새 비밀번호가 서로 일치하지 않습니다.';return;}busy=true;e.submitter.disabled=true;
  try{const {error:verify}=await db.auth.signInWithPassword({email:ADMIN_ID,password:f.current.value});if(verify)throw new Error('현재 비밀번호를 확인해 주세요.');const {error}=await db.auth.updateUser({password:f.next.value});if(error)throw error;await db.auth.signOut({scope:'others'});$('#password-dialog').close();e.target.reset();toast('비밀번호를 변경했습니다.');}catch(error){status.textContent=message(error,'비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');}finally{busy=false;e.submitter.disabled=false;}
};
if(db)loadDashboard();else $('#login-message').textContent='서비스 연결을 준비하고 있습니다.';
