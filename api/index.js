const crypto = require('crypto');
const RAW = {
  core: 'https://gitlab.com/doo_id/aloffc-alyabot/-/raw/main/core_system.json',
  numbers: 'https://gitlab.com/doo_id/aloffc-alyabot/-/raw/main/database.json',
  keys: 'https://gitlab.com/doo_id/aloffc-alyabot/-/raw/main/keylist.json',
};
const PROJECT = encodeURIComponent('doo_id/aloffc-alyabot');
function send(res, code, data) { res.statusCode=code; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(data)); }
async function readRaw(which) {
  const r=await fetch(RAW[which],{headers:{'Cache-Control':'no-cache'}});
  if(!r.ok) throw new Error(` gagal dibaca (${r.status}).`);
  const data=await r.json();
  if((which==='numbers'||which==='keys')&&!Array.isArray(data)) throw new Error(`${which==='keys'?'keylist.json':'database.json'} harus berupa array JSON.`);
  return data;
}
function sign(value) { const secret=process.env.SESSION_SECRET; if(!secret) throw new Error('404 key.'); return crypto.createHmac('sha256',secret).update(value).digest('hex'); }
function createSession() { const p=Buffer.from(JSON.stringify({role:'admin',exp:Date.now()+8*60*60*1000})).toString('base64url'); return `${p}.${sign(p)}`; }
function isAdmin(req) {
  const token=req.headers['x-alya-session']; if(typeof token!=='string') return false;
  const parts=token.split('.'); if(parts.length!==2) return false;
  const expected=sign(parts[0]), a=Buffer.from(parts[1]), b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) return false;
  try { const p=JSON.parse(Buffer.from(parts[0],'base64url').toString()); return p.role==='admin'&&p.exp>Date.now(); } catch { return false; }
}
async function writeNumbers(numbers) {
  const token=process.env.GITLAB_TOKEN;
  if(!token) throw new Error('404 key.');
  const r=await fetch(`https://gitlab.com/api/v4/projects/${PROJECT}/repository/commits`,{method:'POST',headers:{'PRIVATE-TOKEN':token,'Content-Type':'application/json'},body:JSON.stringify({branch:'main',commit_message:'Update Alya Bot phone database',actions:[{action:'update',file_path:'database.json',content:JSON.stringify(numbers,null,2)}]})});
  if(!r.ok) { const detail=await r.text(); throw new Error(`menolak update database (HTTP ${r.status}). ${detail.slice(0,250)}`); }
}
module.exports=async(req,res)=>{
 try {
  if(req.method==='GET') { const action=String(req.query?.action||'numbers'); if(action==='core') return send(res,200,{status:true,core:await readRaw('core')}); return send(res,200,{status:true,numbers:await readRaw('numbers')}); }
  if(req.method!=='POST') return send(res,405,{status:false,message:'Method tidak didukung.'});
  const body=req.body&&typeof req.body==='object'?req.body:{}; const action=String(body.action||'');
  if(action==='login') { const keys=await readRaw('keys'); const key=String(body.key||'').trim(); if(!key||!keys.some(k=>typeof k==='string'&&k===key)) return send(res,401,{status:false,message:'Key login salah.'}); return send(res,200,{status:true,session:createSession(),message:'Login berhasil.'}); }
  if(!isAdmin(req)) return send(res,401,{status:false,message:'Sesi admin tidak valid atau kedaluwarsa. Silakan login ulang.'});
  const number=String(body.number||'').trim(); if(!/^[+0-9][0-9+\-\s()]{7,24}$/.test(number)) return send(res,422,{status:false,message:'Format nomor tidak valid.'});
  const data=await readRaw('numbers'); const numbers=data.filter(x=>x&&typeof x==='object'&&x.number!==undefined).map(x=>({number:String(x.number),status:String(x.status||'active')}));
  if(action==='add') { if(numbers.some(x=>x.number===number)) return send(res,409,{status:false,message:'Nomor sudah terdaftar.'}); numbers.push({number,status:'active'}); await writeNumbers(numbers); return send(res,200,{status:true,message:'Nomor berhasil disimpan ke database.'}); }
  if(action==='delete') { const filtered=numbers.filter(x=>x.number!==number); if(filtered.length===numbers.length) return send(res,404,{status:false,message:'Nomor tidak ditemukan.'}); await writeNumbers(filtered); return send(res,200,{status:true,message:'Nomor berhasil dihapus dari database.'}); }
  return send(res,400,{status:false,message:'Aksi tidak dikenal.'});
 } catch(e) { return send(res,500,{status:false,message:e?.message||'Terjadi kesalahan server.'}); }
};
