/* Campuspilot — CAMPUS JOBS page logic: a real job board. Students
   browse/search/apply; admins post listings and open/close/delete
   them. Persisted in localStorage (see shared/store.js). shared/toast.js,
   shared/nav.js and shared/session.js are already loaded before this
   file. */
var TYPE_ICON = {
  'TA':'<path d="M12 4 2 9l10 5 10-5-10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  'RA':'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/>',
  'Student Worker':'<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>'
};
var TYPE_COLOR = { 'TA':'granite','RA':'teal','Student Worker':'gold' };
var TINT = { red:'var(--red-tint)', granite:'var(--granite-tint)', teal:'var(--teal-tint)', gold:'var(--gold-tint)', green:'var(--green-tint)' };
var SOLID = { red:'#BE0000', granite:'#708E99', teal:'#3ABFC0', gold:'#FFB81D', green:'#6CC24A' };

var CJ_STORAGE_KEY = 'campuspilot.campusjobs.v1';
var cjJobs = cpLoadJSON(CJ_STORAGE_KEY, []);
function cjPersist(){ cpSaveJSON(CJ_STORAGE_KEY, cjJobs); }

var isAdmin = false;
var cjTypeFilter = 'all';
var cjActiveJob = null;

function cjApplyAdmin(){
  document.getElementById('fhSub').textContent = isAdmin
    ? 'Post new listings and manage which jobs stay open.'
    : 'Teaching Assistant, RA, and student worker listings';
  document.getElementById('cjPostBtn').classList.toggle('hidden', !isAdmin);
  cjRender();
}

function cjRenderFilters(){
  var types = ['all','TA','RA','Student Worker'];
  document.getElementById('cjTypeFilters').innerHTML = types.map(function(t){
    var active = t===cjTypeFilter;
    return '<button class="cj-pill'+(active?' active':'')+'" onclick="cjSetType(\''+t+'\')">'+(t==='all'?'All Roles':t)+'</button>';
  }).join('');
}
function cjSetType(t){ cjTypeFilter = t; cjRenderFilters(); cjRender(); }

function cjRender(){
  var q = document.getElementById('cjSearch').value.trim().toLowerCase();
  var list = cjJobs.filter(function(j){
    if(cjTypeFilter !== 'all' && j.type !== cjTypeFilter) return false;
    if(q && (j.title+' '+j.dept).toLowerCase().indexOf(q) === -1) return false;
    return true;
  }).sort(function(a,b){ return b.id - a.id; });

  document.getElementById('cjList').innerHTML = list.map(function(j){
    var color = TYPE_COLOR[j.type] || 'granite';
    var admin = isAdmin ? '<div class="lc-admin">'
      + '<button class="lc-admin-btn" title="'+(j.status==='open'?'Close listing':'Reopen listing')+'" onclick="event.stopPropagation();cjToggleStatus('+j.id+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(j.status==='open'?'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>':'<path d="M5 13l4 4L19 7"/>')+'</svg></button>'
      + '<button class="lc-admin-btn danger" title="Delete listing" onclick="event.stopPropagation();cjDelete('+j.id+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6l-12 12"/></svg></button>'
      + '</div>' : '';
    return '<div class="list-card'+(j.status==='closed'?' closed':'')+'">'
      + '<button class="lc-click" onclick="cjOpenDetail('+j.id+')">'
      + '<div class="lc-icon" style="background:'+TINT[color]+';"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="'+SOLID[color]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+TYPE_ICON[j.type]+'</svg></div>'
      + '<div style="min-width:0;"><div class="lc-title">'+j.title+'</div><div class="lc-sub">'+j.dept+' · '+j.pay+' · '+j.hours+' hrs/wk</div></div>'
      + '</button>'
      + '<span class="lc-tag '+(j.status==='open'?'tag-open':'tag-closed')+'">'+(j.status==='open'?'OPEN':'CLOSED')+'</span>'
      + admin
      + '</div>';
  }).join('') || '<div style="text-align:center;padding:40px;color:var(--muted-2);font-size:13.5px;">No listings match.</div>';
}
function cjToggleStatus(id){
  var j = cjJobs.filter(function(x){ return x.id===id; })[0];
  if(!j) return;
  j.status = j.status === 'open' ? 'closed' : 'open';
  cjPersist();
  cjRender();
  showToast('"'+j.title+'" marked '+j.status.toUpperCase()+'.');
}
function cjDelete(id){
  var j = cjJobs.filter(function(x){ return x.id===id; })[0];
  cjJobs = cjJobs.filter(function(x){ return x.id !== id; });
  cjPersist();
  cjRender();
  showToast(j ? 'Deleted "'+j.title+'".' : 'Listing deleted.');
}

function cjOpenDetail(id){
  var j = cjJobs.filter(function(x){ return x.id===id; })[0];
  if(!j) return;
  cjActiveJob = j;
  document.getElementById('detailTitle').textContent = j.title;
  document.getElementById('detailSub').textContent = j.dept + ' · ' + j.type;
  document.getElementById('detailStats').innerHTML =
    '<div class="cj-stat"><div class="cj-stat-val">'+j.pay+'</div><div class="cj-stat-label">Pay</div></div>'
  + '<div class="cj-stat"><div class="cj-stat-val">'+j.hours+' hrs</div><div class="cj-stat-label">Per Week</div></div>'
  + '<div class="cj-stat"><div class="cj-stat-val">'+j.deadline+'</div><div class="cj-stat-label">Apply By</div></div>';
  document.getElementById('detailDesc').textContent = j.desc;
  document.getElementById('detailReq').innerHTML = j.req.map(function(r){ return '<li>'+r+'</li>'; }).join('');
  var btn = document.getElementById('applyBtn');
  btn.disabled = j.status !== 'open';
  btn.textContent = j.status === 'open' ? 'Apply Now' : 'Applications Closed';
  document.getElementById('detail-modal').classList.remove('hidden');
}
function cjCloseDetail(){ document.getElementById('detail-modal').classList.add('hidden'); }
function cjApply(){
  if(!cjActiveJob || cjActiveJob.status !== 'open') return;
  showToast('Application submitted for "'+cjActiveJob.title+'" — the department will follow up by email.');
  cjCloseDetail();
}

function cjOpenPost(){
  ['cjFormTitle','cjFormDept','cjFormPay','cjFormHours','cjFormDesc','cjFormReq'].forEach(function(id){ document.getElementById(id).value=''; });
  document.getElementById('post-modal').classList.remove('hidden');
}
function cjClosePost(){ document.getElementById('post-modal').classList.add('hidden'); }
function cjSubmitPost(){
  var title = document.getElementById('cjFormTitle').value.trim();
  if(!title){ showToast('Please enter a job title.'); return; }
  var reqText = document.getElementById('cjFormReq').value.trim();
  cjJobs.unshift({
    id: Date.now(),
    title: title,
    type: document.getElementById('cjFormType').value,
    dept: document.getElementById('cjFormDept').value.trim() || 'UAC',
    pay: document.getElementById('cjFormPay').value.trim() || 'TBD',
    hours: document.getElementById('cjFormHours').value.trim() || 'TBD',
    deadline: 'Open until filled',
    status: 'open',
    desc: document.getElementById('cjFormDesc').value.trim() || 'No description provided.',
    req: reqText ? reqText.split('\n').filter(function(l){ return l.trim(); }) : []
  });
  cjClosePost();
  cjSetType('all');
  showToast('"'+title+'" published — now visible to all students.');
}

document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ cjCloseDetail(); cjClosePost(); } });

cjRenderFilters();
cjRender();
