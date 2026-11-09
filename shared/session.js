/* Campuspilot — shared session helper (student / admin sign-in state).
   Persisted in localStorage so it survives a real page navigation or
   reload — there's no backend yet, so this *is* the sign-in system.
   Load this FIRST on every protected page, before shared/toast.js,
   and call requireSession() at the top of that page's inline script. */
var SESSION_KEY = 'campuspilot.session.v1';

function getSession(){
  try{
    var raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function setSession(role){
  var session = (role === 'admin')
    ? { role:'admin', name:'UAC Admin (Dept. Staff)', initial:'A' }
    : { role:'student', name:'Garam (u1621896)', initial:'G' };
  try{ localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }catch(e){}
  return session;
}

function clearSession(){
  try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
}

/* Redirects to the login page if nobody is signed in; otherwise paints
   the topbar identity (avatar + name + admin badge) and shows/hides
   any [data-role="admin"] / [data-role="student"] elements on the
   page. Returns the session object, or null (and redirects) if there
   isn't one. */
function requireSession(loginHref){
  var session = getSession();
  if(!session){
    window.location.href = loginHref || '../login/index.html';
    return null;
  }
  applySessionUI(session);
  return session;
}

function applySessionUI(session){
  var avatarEl = document.querySelector('.topbar-avatar');
  var nameEl = document.querySelector('.topbar-username');
  if(avatarEl){
    avatarEl.textContent = session.initial;
    avatarEl.classList.toggle('is-admin', session.role === 'admin');
  }
  if(nameEl){
    nameEl.innerHTML = session.name + (session.role === 'admin' ? ' <span class="admin-badge">ADMIN</span>' : '');
  }
  document.body.classList.remove('role-student', 'role-admin');
  document.body.classList.add('role-' + session.role);
  document.querySelectorAll('[data-role="admin"]').forEach(function(el){
    el.classList.toggle('hidden', session.role !== 'admin');
  });
  document.querySelectorAll('[data-role="student"]').forEach(function(el){
    el.classList.toggle('hidden', session.role !== 'student');
  });
}

function logout(){
  clearSession();
  window.location.href = '../login/index.html';
}
