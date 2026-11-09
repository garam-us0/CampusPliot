/* Campuspilot — shared localStorage JSON helpers. There's no backend
   yet, so each feature page's own data (lost & found items, job
   listings, course reviews, profile settings) is persisted here under
   a page-owned storage key, so it survives a real page reload or
   navigation instead of resetting every visit. */
function cpLoadJSON(key, fallback){
  try{
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
  }catch(e){ return (fallback !== undefined ? fallback : null); }
}
function cpSaveJSON(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* private mode / quota exceeded — best effort */ }
}
