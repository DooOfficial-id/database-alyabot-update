const API_URL = "/api";
let numbersData = [];

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeBtn');
    const icon = btn?.querySelector('i');
    if (icon) icon.className = document.body.classList.contains('light-mode') ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        const icon = document.getElementById('themeBtn')?.querySelector('i');
        if (icon) icon.className = 'fas fa-sun';
    }
});
function togglePassword() {
    const input = document.getElementById('passwordInput');
    input.type = input.type === 'password' ? 'text' : 'password';
}
async function handleLogin() {
    const key = document.getElementById('passwordInput').value.trim();
    try {
        const r = await fetch(API_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'login', key})});
        const d = await r.json();
        if (d.status) {
            sessionStorage.setItem('alyabotSession', d.session);
            window.location.href = 'dashboard.html';
        } else alert(d.message || 'Key tidak valid!');
    } catch { alert('Gagal terhubung ke server web. Pastikan API Vercel sudah ter-deploy.'); }
}
if (window.location.pathname.endsWith('dashboard.html')) {
    if (!sessionStorage.getItem('alyabotSession')) window.location.href = 'index.html';
    else loadNumbers();
}
async function apiPost(payload) {
    const r = await fetch(API_URL, {method:'POST', headers:{'Content-Type':'application/json','X-Alya-Session':sessionStorage.getItem('alyabotSession') || ''}, body:JSON.stringify(payload)});
    return r.json();
}
async function loadNumbers() {
    try {
        const r = await fetch(`${API_URL}?action=numbers`);
        const d = await r.json();
        numbersData = d.status ? d.numbers : [];
        renderTable(numbersData);
    } catch (e) { console.error(e); numbersData=[]; renderTable(numbersData); }
}
function renderTable(data) {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;
    tbody.replaceChildren();
    if (!data?.length) {
        const tr=document.createElement('tr'), td=document.createElement('td');
        td.colSpan=2; td.style.cssText='padding:30px;color:#94a3b8;font-size:14px';
        td.textContent='Belum ada nomor terdaftar'; tr.appendChild(td); tbody.appendChild(tr); return;
    }
    data.forEach(item => {
        const tr=document.createElement('tr'), num=document.createElement('td'), status=document.createElement('td'), badge=document.createElement('span');
        num.textContent=item.number; badge.className='status-badge'; badge.textContent=item.status || 'active'; status.appendChild(badge); tr.append(num,status); tbody.appendChild(tr);
    });
}
function searchTable() {
    const q=(document.getElementById('searchInput')?.value || '').toLowerCase();
    renderTable(numbersData.filter(x => String(x.number).toLowerCase().includes(q)));
}
async function addNumber() {
    const input=document.getElementById('phoneInput'), number=input.value.trim();
    if (!/^[+0-9][0-9+\-\s()]{7,24}$/.test(number)) { alert('Masukkan nomor yang valid!'); return; }
    try {
        const d=await apiPost({action:'add',number});
        if (d.status) { alert('✅ '+d.message); input.value=''; await loadNumbers(); }
        else alert('❌ '+(d.message || 'Gagal menambah nomor'));
    } catch { alert('Gagal terhubung ke server. Pastikan GITLAB_TOKEN sudah diatur di Vercel.'); }
}
