const API_URL = "/api";
let numbersData = [];
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const icon=document.getElementById('themeBtn')?.querySelector('i');
    if(icon) icon.className=document.body.classList.contains('light-mode')?'fas fa-sun':'fas fa-moon';
    localStorage.setItem('theme',document.body.classList.contains('light-mode')?'light':'dark');
}
document.addEventListener('DOMContentLoaded',()=>{if(localStorage.getItem('theme')==='light'){document.body.classList.add('light-mode');const i=document.getElementById('themeBtn')?.querySelector('i');if(i)i.className='fas fa-sun';}});
async function adminLogin() {
    const key=document.getElementById('adminPasswordInput').value.trim();
    try {
        const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',key})});
        const d=await r.json();
        if(d.status){sessionStorage.setItem('alyabotSession',d.session);document.getElementById('adminLoginBox').style.display='none';document.getElementById('searchSection').style.display='block';document.getElementById('tableSection').style.display='block';loadNumbers();}
        else alert(d.message||'Key admin salah!');
    } catch { alert('Gagal terhubung ke server web.'); }
}
async function loadNumbers(){
    try{const r=await fetch(`${API_URL}?action=numbers`);const d=await r.json();numbersData=d.status?d.numbers:[];renderTable(numbersData);}
    catch(e){console.error(e);numbersData=[];renderTable(numbersData);}
}
function renderTable(data){
    const tbody=document.getElementById('dataTableBody');tbody.replaceChildren();
    if(!data?.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=3;td.textContent='Belum ada nomor terdaftar';tr.appendChild(td);tbody.appendChild(tr);return;}
    data.forEach(item=>{
        const tr=document.createElement('tr'),n=document.createElement('td'),s=document.createElement('td'),a=document.createElement('td'),b=document.createElement('span'),btn=document.createElement('button');
        n.textContent=item.number;b.className='status-badge';b.textContent=item.status||'active';s.appendChild(b);
        btn.className='delete-btn';btn.textContent='Hapus';btn.addEventListener('click',()=>deleteNumber(item.number));a.appendChild(btn);tr.append(n,s,a);tbody.appendChild(tr);
    });
}
function searchTable(){const q=document.getElementById('searchInput').value.toLowerCase();renderTable(numbersData.filter(x=>String(x.number).toLowerCase().includes(q)));}
async function deleteNumber(number){
    if(!confirm(`Yakin hapus nomor ${number}?`))return;
    try{const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Alya-Session':sessionStorage.getItem('alyabotSession')||''},body:JSON.stringify({action:'delete',number})});const d=await r.json();alert((d.status?'✅ ':'❌ ')+(d.message||''));if(d.status)loadNumbers();}
    catch{alert('Gagal terhubung ke server.');}
}
