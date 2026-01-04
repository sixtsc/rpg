const SAVE_KEY = "text_rpg_save_modular_v1";

// Beberapa browser / mode (mis. Safari Private, embedded webview tertentu,
// atau ketika storage diblokir) bisa melempar error saat akses localStorage.
// Kalau error ini tidak ditangani, setelah klik Save script bisa error dan
// terasa seperti tombol lain "tidak bisa disentuh".
function safeSet(key, value){
  try{
    localStorage.setItem(key, value);
    return true;
  }catch(err){
    console.error("[SAVE] localStorage.setItem gagal:", err);
    return false;
  }
}

function safeGet(key){
  try{
    return localStorage.getItem(key);
  }catch(err){
    console.error("[LOAD] localStorage.getItem gagal:", err);
    return null;
  }
}

export function autosave(state){
  const payload = { v:1, t:Date.now(), player: state.player };
  return safeSet(SAVE_KEY, JSON.stringify(payload));
}

export function save(state){
  return autosave(state) === true;
}

export function load(){
  const raw = safeGet(SAVE_KEY);
  if(!raw) return null;
  try{
    const payload = JSON.parse(raw);
    return payload?.player ? payload : null;
  }catch{
    return null;
  }
}
