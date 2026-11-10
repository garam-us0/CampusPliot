/* Campuspilot — CAMPUS JOBS page logic: a real job board. Students
   search/filter, save, view details inline and apply; admins post,
   open/close and delete listings. Everything here is persisted in
   localStorage (see shared/store.js) — applications never advance past
   "Submitted" because there's no real review backend behind this
   prototype to move them further; that's shown as-is rather than
   faked. shared/toast.js, shared/nav.js and shared/session.js are
   already loaded before this file. */

var CJ_CATS = [
  { id:'all', label:'All Jobs' },
  { id:'ta', label:'Teaching Assistant', initials:'TA' },
  { id:'office', label:'Office & Admin', initials:'OA' },
  { id:'library', label:'Library', initials:'LB' },
  { id:'ambassador', label:'Student Ambassador', initials:'SA' },
  { id:'research', label:'Research', initials:'RA' }
];
function cjCatMeta(id){
  for(var i=0;i<CJ_CATS.length;i++){ if(CJ_CATS[i].id===id) return CJ_CATS[i]; }
  return { id:id, label:id, initials:'JB' };
}

var CJ_STORAGE_KEY = 'campuspilot.campusjobs.v1';
var CJ_SAVED_KEY = 'campuspilot.campusjobs.saved.v1';
var CJ_APPS_KEY = 'campuspilot.campusjobs.applications.v1';
var cjJobs = cpLoadJSON(CJ_STORAGE_KEY, []);
var cjSaved = cpLoadJSON(CJ_SAVED_KEY, []);     // array of job ids
var cjApps = cpLoadJSON(CJ_APPS_KEY, []);       // array of {jobId, title, appliedDate, status, step}
function cjPersist(){ cpSaveJSON(CJ_STORAGE_KEY, cjJobs); }
function cjPersistSaved(){ cpSaveJSON(CJ_SAVED_KEY, cjSaved); }
function cjPersistApps(){ cpSaveJSON(CJ_APPS_KEY, cjApps); }

var isAdmin = false;
var cjCatFilter = 'all';
var cjQuery = '';
var cjOpenDetails = {}; // job id -> bool, UI-only, not persisted

var CJ_STEPS = ['Submitted','Reviewed','Interview','Offer'];

function cjApplyAdmin(){
  document.getElementById('fhSub').textContent = isAdmin
    ? 'Post new listings and manage which jobs stay open.'
    : 'On-campus positions at the Utah Asia Campus · Fall Semester 2026';
  document.getElementById('cjPostBtn').classList.toggle('hidden', !isAdmin);
  cjRenderJobs();
}

function cjRenderChips(){
  document.getElementById('chips').innerHTML = CJ_CATS.map(function(c){
    return '<button type="button" class="cj-chip" aria-pressed="'+(cjCatFilter===c.id)+'" onclick="cjSetCat(\''+c.id+'\')">'+c.label+'</button>';
  }).join('');
}
function cjSetCat(id){ cjCatFilter = id; cjRenderChips(); cjRenderJobs(); }
function cjSetQuery(v){ cjQuery = v; cjRenderJobs(); }

function cjDaysUntil(dateStr){
  if(!dateStr) return null;
  var today = new Date(); today.setHours(0,0,0,0);
  var d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}
function cjFormatDate(dateStr){
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function cjDeadlineDisplay(j){
  if(!j.deadlineDate) return { text:'Open until filled', urgent:false };
  var days = cjDaysUntil(j.deadlineDate);
  if(days < 0) return { text:'Deadline passed', urgent:false };
  if(days <= 7) return { text:(days===0?'Closes today':'Closes in '+days+' day'+(days===1?'':'s')) + ' · ' + cjFormatDate(j.deadlineDate), urgent:true };
  return { text:'Closes '+cjFormatDate(j.deadlineDate), urgent:false };
}

function cjRenderStats(){
  var open = cjJobs.filter(function(j){ return j.status==='open'; });
  var depts = {};
  open.forEach(function(j){ if(j.dept) depts[j.dept]=1; });
  document.getElementById('openCount').textContent = open.length;
  document.getElementById('openNote').textContent = 'across ' + Object.keys(depts).length + ' department' + (Object.keys(depts).length===1?'':'s');

  document.getElementById('appsCount').textContent = cjApps.length;
  document.getElementById('appsNote').textContent = cjApps.length ? (cjApps.length + ' submitted') : 'none yet';

  document.getElementById('savedCount').textContent = cjSaved.length;

  var upcoming = open.filter(function(j){ return j.deadlineDate && cjDaysUntil(j.deadlineDate) >= 0; })
    .sort(function(a,b){ return new Date(a.deadlineDate) - new Date(b.deadlineDate); });
  if(upcoming.length){
    document.getElementById('nextDeadlineDate').textContent = cjFormatDate(upcoming[0].deadlineDate);
    document.getElementById('nextDeadlineNote').textContent = upcoming[0].title;
  }else{
    document.getElementById('nextDeadlineDate').textContent = '—';
    document.getElementById('nextDeadlineNote').textContent = 'No upcoming deadlines';
  }
}

function cjRenderJobs(){
  var q = cjQuery.toLowerCase().trim();
  var list = cjJobs.filter(function(j){
    var catOk = cjCatFilter === 'all' || j.cat === cjCatFilter;
    var qOk = !q || (j.title+' '+j.dept).toLowerCase().indexOf(q) !== -1;
    var visOk = isAdmin || j.status === 'open';
    return catOk && qOk && visOk;
  }).sort(function(a,b){ return b.id - a.id; });

  document.getElementById('resultLabel').textContent = list.length + (list.length===1 ? ' position' : ' positions');

  if(!list.length){
    document.getElementById('jobs').innerHTML =
      '<div class="cj-empty"><div style="font-size:15px;font-weight:700;margin-bottom:5px;">No positions match</div>'
    + '<div class="muted">Try another keyword or choose "All Jobs".' + (isAdmin ? ' Use "Post Job" to add a listing.' : '') + '</div></div>';
    cjRenderStats();
    return;
  }

  document.getElementById('jobs').innerHTML = list.map(function(j){
    var cat = cjCatMeta(j.cat);
    var saved = cjSaved.indexOf(j.id) !== -1;
    var open = !!cjOpenDetails[j.id];
    var applied = cjApps.some(function(a){ return a.jobId === j.id; });
    var dl = cjDeadlineDisplay(j);

    var li = function(x){ return '<li>'+x+'</li>'; };
    var detailsHtml = open
      ? '<div class="cj-details" id="det-'+j.id+'">'
        + '<div><h4>What you\'ll do</h4><ul>' + (j.todo||[]).map(li).join('') + '</ul></div>'
        + '<div><h4>Requirements</h4><ul>' + (j.need||[]).map(li).join('') + '</ul></div>'
        + '<div><h4>Details</h4><ul><li>' + (j.location||'Location TBD') + '</li><li>' + (j.hours||'Hours TBD') + '</li></ul></div>'
      + '</div>'
      : '';

    var applyBtn = applied
      ? '<button type="button" class="cj-btn cj-btn-sm" disabled>Applied</button>'
      : (j.status==='open'
        ? '<button type="button" class="cj-btn cj-btn-primary cj-btn-sm" onclick="cjApplyToJob('+j.id+')">Apply</button>'
        : '<button type="button" class="cj-btn cj-btn-sm" disabled>Closed</button>');

    var adminBtns = isAdmin
      ? '<button type="button" class="cj-admin-btn" title="'+(j.status==='open'?'Close listing':'Reopen listing')+'" onclick="cjToggleStatus('+j.id+')">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+(j.status==='open'?'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>':'<path d="M5 13l4 4L19 7"/>')+'</svg></button>'
      + '<button type="button" class="cj-admin-btn danger" title="Delete listing" onclick="cjDelete('+j.id+')">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6l-12 12"/></svg></button>'
      : '';
    var statusTag = isAdmin ? '<span class="cj-status-tag '+j.status+'">'+j.status.toUpperCase()+'</span>' : '';

    return ''
    + '<article class="cj-card cj-job">'
      + '<div class="cj-job-top">'
        + '<div class="cj-job-id">'
          + '<div class="cj-logo" aria-hidden="true">'+cat.initials+'</div>'
          + '<div><h3>'+j.title+'</h3><div class="muted">'+j.dept+'</div></div>'
        + '</div>'
        + '<div class="cj-job-actions">'
          + statusTag
          + adminBtns
          + '<button type="button" class="cj-bm" aria-pressed="'+saved+'" aria-label="'+(saved?'Remove from saved':'Save job')+'" onclick="cjToggleSave('+j.id+')">'
            + '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>'
        + '</div>'
      + '</div>'
      + '<p class="cj-desc">'+j.desc+'</p>'
      + detailsHtml
      + '<div class="cj-tags">'
        + '<span class="cj-tag strong">'+cat.label+'</span>'
        + '<span class="cj-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>'+(j.hours||'Hours TBD')+'</span>'
        + '<span class="cj-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>'+(j.location||'Location TBD')+'</span>'
      + '</div>'
      + '<div class="cj-job-foot">'
        + '<div class="cj-meta"><span class="cj-pay">'+j.pay+'</span>'
          + (dl.urgent ? '<span class="cj-badge">'+dl.text+'</span>' : '<span class="muted" style="font-size:12.5px;">'+dl.text+'</span>')
        + '</div>'
        + '<div class="cj-actions">'
          + '<button type="button" class="cj-btn cj-btn-sm" onclick="cjToggleDetails('+j.id+')">'+(open?'Hide details':'View details')+'</button>'
          + applyBtn
        + '</div>'
      + '</div>'
    + '</article>';
  }).join('');

  cjRenderStats();
}

function cjToggleDetails(id){ cjOpenDetails[id] = !cjOpenDetails[id]; cjRenderJobs(); }

function cjToggleSave(id){
  var idx = cjSaved.indexOf(id);
  if(idx === -1){ cjSaved.push(id); } else { cjSaved.splice(idx,1); }
  cjPersistSaved();
  cjRenderJobs();
  showToast(idx === -1 ? 'Saved to your list.' : 'Removed from saved.');
}

function cjApplyToJob(id){
  var j = cjJobs.filter(function(x){ return x.id===id; })[0];
  if(!j || j.status !== 'open') return;
  if(cjApps.some(function(a){ return a.jobId===id; })) return;
  var today = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' });
  cjApps.unshift({ jobId:id, title:j.title, appliedDate:today, status:'Submitted', step:1 });
  cjPersistApps();
  cjRenderJobs();
  cjRenderSide();
  showToast('Application submitted for "'+j.title+'" — the department will follow up by email.');
}

function cjToggleStatus(id){
  var j = cjJobs.filter(function(x){ return x.id===id; })[0];
  if(!j) return;
  j.status = j.status === 'open' ? 'closed' : 'open';
  cjPersist();
  cjRenderJobs();
  showToast('"'+j.title+'" marked '+j.status.toUpperCase()+'.');
}
function cjDelete(id){
  var j = cjJobs.filter(function(x){ return x.id===id; })[0];
  cjJobs = cjJobs.filter(function(x){ return x.id !== id; });
  cjPersist();
  cjRenderJobs();
  showToast(j ? 'Deleted "'+j.title+'".' : 'Listing deleted.');
}

function cjRenderSide(){
  document.getElementById('apps').innerHTML = cjApps.length
    ? cjApps.map(function(a){
        return '<div class="cj-app">'
          + '<div class="cj-row-between" style="align-items:flex-start;">'
            + '<div><div class="cj-app-title">'+a.title+'</div><div class="muted" style="font-size:12px;">Applied '+a.appliedDate+'</div></div>'
            + '<span class="cj-pill">'+a.status+'</span>'
          + '</div>'
          + '<div class="cj-steps">' + CJ_STEPS.map(function(s,i){
              return '<div><div class="cj-bar'+(i<a.step?' done':'')+'"></div><div class="cj-step-label">'+s+'</div></div>';
            }).join('') + '</div>'
        + '</div>';
      }).join('')
    : '<div class="muted" style="font-size:13px;">You haven\'t applied to anything yet.</div>';

  var open = cjJobs.filter(function(j){ return j.status==='open' && j.deadlineDate && cjDaysUntil(j.deadlineDate) >= 0; })
    .sort(function(a,b){ return new Date(a.deadlineDate) - new Date(b.deadlineDate); })
    .slice(0,3);
  document.getElementById('deadlines').innerHTML = open.length
    ? open.map(function(j){
        var d = new Date(j.deadlineDate+'T00:00:00');
        var mon = d.toLocaleDateString('en-US',{month:'short'}).toUpperCase();
        return '<div class="cj-dl">'
          + '<div class="cj-cal"><div class="cj-cal-m">'+mon+'</div><div class="cj-cal-d">'+d.getDate()+'</div></div>'
          + '<div><div class="cj-dl-title">'+j.title+'</div><div class="muted" style="font-size:12px;">'+j.dept+'</div></div>'
        + '</div>';
      }).join('')
    : '<div class="muted" style="font-size:13px;">No upcoming deadlines.</div>';
}

function cjOpenPost(){
  ['cjFormTitle','cjFormDept','cjFormLocation','cjFormPay','cjFormHours','cjFormDeadline','cjFormDesc','cjFormTodo','cjFormReq'].forEach(function(id){
    document.getElementById(id).value='';
  });
  document.getElementById('post-modal').classList.remove('hidden');
}
function cjClosePost(){ document.getElementById('post-modal').classList.add('hidden'); }
function cjSubmitPost(){
  var title = document.getElementById('cjFormTitle').value.trim();
  if(!title){ showToast('Please enter a job title.'); return; }
  var todoText = document.getElementById('cjFormTodo').value.trim();
  var reqText = document.getElementById('cjFormReq').value.trim();
  cjJobs.unshift({
    id: Date.now(),
    title: title,
    cat: document.getElementById('cjFormCat').value,
    dept: document.getElementById('cjFormDept').value.trim() || 'UAC',
    location: document.getElementById('cjFormLocation').value.trim() || 'Location TBD',
    pay: document.getElementById('cjFormPay').value.trim() || 'Pay TBD',
    hours: document.getElementById('cjFormHours').value.trim() || 'Hours TBD',
    deadlineDate: document.getElementById('cjFormDeadline').value || null,
    status: 'open',
    desc: document.getElementById('cjFormDesc').value.trim() || 'No description provided.',
    todo: todoText ? todoText.split('\n').filter(function(l){ return l.trim(); }) : [],
    need: reqText ? reqText.split('\n').filter(function(l){ return l.trim(); }) : []
  });
  cjPersist();
  cjClosePost();
  cjSetCat('all');
  showToast('"'+title+'" published — now visible to all students.');
}

document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cjClosePost(); });

cjRenderChips();
cjRenderJobs();
cjRenderSide();
