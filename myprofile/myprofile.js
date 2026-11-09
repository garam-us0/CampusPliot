/* Campuspilot — MY PROFILE page logic: account card, notification
   toggles (persisted — see shared/store.js), and an admin-only
   platform-overview card whose counts read real data from the Lost &
   Found / Campus Jobs localStorage. shared/toast.js, shared/nav.js
   and shared/session.js are already loaded before this file. */
var isAdmin = false;
var MP_SETTINGS_KEY = 'campuspilot.settings.v1';
var mpToggles = cpLoadJSON(MP_SETTINGS_KEY, { toggleEmail:true, toggleReminders:true, toggleLF:false, toggleJobs:true });
/* paint the persisted toggle state onto the switches on load */
Object.keys(mpToggles).forEach(function(id){
  var el = document.getElementById(id);
  if(el) el.className = 'switch' + (mpToggles[id] ? ' on' : '');
});

function mpToggle(id, label){
  mpToggles[id] = !mpToggles[id];
  document.getElementById(id).className = 'switch' + (mpToggles[id] ? ' on' : '');
  cpSaveJSON(MP_SETTINGS_KEY, mpToggles);
  showToast((mpToggles[id] ? 'Turned on: ' : 'Turned off: ') + label.replace(/&amp;/g,'&'));
}

function mpRenderAdminStats(){
  var lf = cpLoadJSON('campuspilot.lostfound.v1', null);
  var lfPending = (lf && lf.items) ? lf.items.filter(function(it){ return it.status === 'pending'; }).length : 0;
  var jobs = cpLoadJSON('campuspilot.campusjobs.v1', []) || [];
  var jobsOpen = jobs.filter(function(j){ return j.status === 'open'; }).length;
  document.getElementById('mpStatLF').textContent = lfPending;
  document.getElementById('mpStatJobs').textContent = jobsOpen;
  document.getElementById('mpAttnLF').textContent = lfPending
    ? (lfPending + ' open Lost & Found report' + (lfPending === 1 ? '' : 's') + ' awaiting pickup')
    : 'No open Lost & Found reports right now';
  document.getElementById('mpAttnJobs').textContent = jobsOpen
    ? (jobsOpen + ' open job listing' + (jobsOpen === 1 ? '' : 's') + ' posted')
    : 'No Campus Jobs listings posted yet';
}
function mpApplyAdmin(){
  document.getElementById('profileAvatar').textContent = isAdmin ? 'A' : 'G';
  document.getElementById('profileAvatar').className = 'profile-avatar' + (isAdmin ? ' is-admin' : '');
  document.getElementById('profileName').textContent = isAdmin ? 'Garam Lee (Department Admin)' : 'Garam Lee';
  document.getElementById('statusValue').textContent = isAdmin ? 'Department Staff — UAC IT Authorized' : 'Active Student';
  document.getElementById('fhSub').textContent = isAdmin
    ? 'Manage your account, plus a quick overview of what needs platform attention'
    : 'Manage your account, saved events, and notification preferences';
  document.getElementById('adminPanel').classList.toggle('hidden', !isAdmin);
  if(isAdmin) mpRenderAdminStats();
}
