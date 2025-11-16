
// app.js - catalog + admin (localStorage)
const STORAGE_KEY = 'furn_products_v1';

const defaultProducts = [{"id": "p1", "title": "Диван Сканди", "price": 25990, "img": "images/sofa1.jpg", "enabled": true}, {"id": "p2", "title": "Кресло Лофт", "price": 8990, "img": "images/chair1.jpg", "enabled": true}, {"id": "p3", "title": "Стол Март", "price": 14990, "img": "images/table1.jpg", "enabled": true}];

function loadProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) try { return JSON.parse(raw); } catch(e){}
  return defaultProducts.slice();
}

function saveProducts(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// render catalog grid
function renderCatalog(){
  const wrap = document.getElementById('products');
  if(!wrap) return;
  const list = loadProducts();
  wrap.innerHTML = '';
  list.filter(p=>p.enabled!==false).forEach(p=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<img src="${p.img}" alt=""><div class="title">${p.title}</div><div class="price">${p.price.toLocaleString()} ₽</div>`;
    wrap.appendChild(card);
  });
}

// Admin utilities
const ADMIN_USER = 'admin123';
const ADMIN_PASS = '12345';
const SECRET_CODE = 'KAROWKIN-MASTER';
const URL_KEY = '12345';

function showLoginBox(){ document.getElementById('loginBox').classList.remove('hidden'); document.getElementById('adminArea').classList.add('hidden'); }
function showAdminArea(){ document.getElementById('loginBox').classList.add('hidden'); document.getElementById('adminArea').classList.remove('hidden'); renderAdminList(); }

function checkUrlKey(){
  const params = new URLSearchParams(location.search);
  if(params.get('key') === URL_KEY) return true;
  return false;
}

function tryAutoLogin(){
  if(checkUrlKey()) { showAdminArea(); return; }
  const logged = sessionStorage.getItem('furn_admin_logged');
  if(logged==='1') showAdminArea();
}

function renderAdminList(){
  const list = loadProducts();
  const container = document.getElementById('productList');
  container.innerHTML = '';
  list.forEach((p, idx)=>{
    const row = document.createElement('div'); row.className='prod-row';
    row.innerHTML = `<img src="${p.img}" alt=""><div style="flex:1"><strong>${p.title}</strong><div class="small">${p.price.toLocaleString()} ₽</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn" data-act="edit" data-i="${idx}">✏️</button>
        <button class="btn ghost" data-act="toggle" data-i="${idx}">${p.enabled===false ? 'Включить' : 'Скрыть'}</button>
        <button class="btn ghost" data-act="del" data-i="${idx}">Удалить</button>
      </div>`;
    container.appendChild(row);
  });
}

function addNewProduct(){
  const title = prompt('Название товара:');
  if(!title) return;
  const price = parseInt(prompt('Цена в рублях:'),10) || 0;
  const img = prompt('URL картинки (или оставь пустым)', 'images/sofa1.jpg');
  const list = loadProducts();
  const id = 'p' + Date.now();
  list.push({id, title, price, img, enabled:true});
  saveProducts(list); renderAdminList(); alert('Добавлено');
}

function exportJSON(){
  const list = loadProducts();
  const blob = new Blob([JSON.stringify(list,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'products_export.json'; a.click(); URL.revokeObjectURL(url);
}

function importJSONFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const arr = JSON.parse(reader.result);
      if(Array.isArray(arr)){
        saveProducts(arr);
        renderAdminList();
        alert('Импорт успешен');
      } else alert('Неверный формат JSON');
    }catch(e){ alert('Ошибка импорта'); }
  };
  reader.readAsText(file);
}

document.addEventListener('click', function(e){
  if(e.target.id==='btnLogin'){
    const u = document.getElementById('user').value.trim();
    const p = document.getElementById('pass').value;
    if(u===ADMIN_USER && p===ADMIN_PASS){
      sessionStorage.setItem('furn_admin_logged','1');
      showAdminArea();
    } else alert('Неверный логин или пароль');
  }
  if(e.target.id==='btnSecret'){
    const code = document.getElementById('secret').value.trim();
    if(code===SECRET_CODE){ sessionStorage.setItem('furn_admin_logged','1'); showAdminArea(); } else alert('Неверный код');
  }
  if(e.target.id==='btnLogout'){ sessionStorage.removeItem('furn_admin_logged'); showLoginBox(); }
  if(e.target.id==='btnNew') addNewProduct();
  if(e.target.id==='btnExport') exportJSON();
  if(e.target.id==='importFile'){ const f = e.target.files[0]; if(f) importJSONFile(f); }
  // product list actions
  if(e.target.dataset && e.target.dataset.act){
    const act = e.target.dataset.act; const i = parseInt(e.target.dataset.i);
    const list = loadProducts();
    if(act==='del'){ if(confirm('Удалить товар?')){ list.splice(i,1); saveProducts(list); renderAdminList(); } }
    if(act==='toggle'){ list[i].enabled = list[i].enabled===false ? true : false; saveProducts(list); renderAdminList(); }
    if(act==='edit'){ const p = list[i]; const title = prompt('Название', p.title); if(title!==null){ p.title = title; const price = parseInt(prompt('Цена', p.price),10); if(!isNaN(price)) p.price = price; const img = prompt('URL картинки', p.img); if(img!==null) p.img = img; saveProducts(list); renderAdminList(); } }
  }
});

// init
document.addEventListener('DOMContentLoaded', function(){
  if(!localStorage.getItem(STORAGE_KEY)){
    fetch('products.json').then(r=>r.json()).then(data=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); renderCatalog(); }).catch(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts)); renderCatalog(); });
  } else renderCatalog();
  tryAutoLogin();
});
