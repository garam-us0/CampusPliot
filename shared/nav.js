/* Campuspilot — shared left icon rail (Home / Calendar / Feature pages only;
   the Login page has no nav rail).
   Usage on a page: <aside class="nav-rail" id="navrail"></aside>
   then: mountNavRail('navrail', 'home');
   ('home' | 'calendar' | 'lostfound' | 'gradepilot' | 'courseinsights' | 'campusjobs' | 'myprofile') */
var NAV_ICONS = {
  home:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h5v-5h2v5h5v-9"/></svg>',
  calendar:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 10h16"/></svg>',
  lostfound:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.3-4.3"/></svg>',
  gradepilot:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 8 8h-8Z" fill="currentColor" stroke="none"/></svg>',
  courseinsights:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2 9l10 5 10-5-10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>',
  campusjobs:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>',
  myprofile:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>'
};

var NAV_ORDER = [
  ['home','Home',null,'../home/index.html'],
  ['calendar','Calendar',null,'../calendar/index.html'],
  ['lostfound','Lost &amp; Found',null,'../feature/index.html?key=lostfound'],
  ['gradepilot','GradePilot',null,'../feature/index.html?key=gradepilot'],
  ['courseinsights','Course Insights',null,'../feature/index.html?key=courseinsights'],
  ['campusjobs','Campus Jobs',null,'../feature/index.html?key=campusjobs'],
  ['myprofile','My Profile',null,'../feature/index.html?key=myprofile']
];

function renderNavRail(activeKey){
  var items = NAV_ORDER.map(function(o){
    var key=o[0], label=o[1], href=o[3];
    var active = key===activeKey;
    var plainLabel = label.replace(/&amp;/g,'&');
    return '<a class="nav-rail-item'+(active?' active':'')+'" href="'+href+'" title="'+plainLabel+'">'+NAV_ICONS[key]+'<span>'+plainLabel+'</span></a>';
  }).join('');
  var feedback = '<button class="nav-rail-item nav-rail-feedback" onclick="showToast(\'Thank you — your feedback has been submitted to UAC IT 💬\')" title="Give Feedback"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4V5Z"/></svg><span>Feedback</span></button>';
  return items + feedback;
}

function mountNavRail(elId, activeKey){
  var el = document.getElementById(elId);
  if(el) el.innerHTML = renderNavRail(activeKey);
}