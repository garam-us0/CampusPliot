/* Campuspilot — shared event-detail modal logic (used by the Home,
   Calendar and Feature/My Profile pages, wherever an RSVP'd event chip
   is clickable). The modal markup itself is already included directly
   inside home/index.html, calendar/index.html and feature/index.html. */
var ICONS = {
  calendar:'<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4M16 4v4M4 10h16"/>',
  pin:'<path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  people:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="2.6"/><path d="M2 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M14.5 14.7c2.7.4 4.5 2.4 4.5 5.3"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>',
  food:'<path d="M6 3v8M4 3v5a2 2 0 0 0 4 0V3M18 3v18M18 3c-2 0-3 2-3 5v3h3"/>'
};
var COLOR = { red:'#BE0000', granite:'#708E99', teal:'#3ABFC0', gold:'#FFB81D', green:'#6CC24A' };
var TINT = { red:'var(--red-tint)', granite:'var(--granite-tint)', teal:'var(--teal-tint)', gold:'var(--gold-tint)', green:'var(--green-tint)' };
/* No demo events are pre-loaded — real campus events get added here
   (or wired up from a real events source) as they're published. */
var EVENTS_DETAIL = {};
function openModal(key){
  var e = EVENTS_DETAIL[key];
  if(!e) return;
  document.getElementById('modal-badge').innerHTML = e.badge;
  document.getElementById('modal-title').innerHTML = e.title;
  document.getElementById('modal-rows').innerHTML = e.rows.map(function(r){
    return '<div class="detail-row"><div class="detail-icon" style="background:'+TINT[r.color]+';"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+COLOR[r.color]+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICONS[r.icon]+'</svg></div><div><div class="detail-label">'+r.label+'</div><div class="detail-value">'+r.value+'</div></div></div>';
  }).join('');
  document.getElementById('event-modal').classList.remove('hidden');
}
function closeModal(){ document.getElementById('event-modal').classList.add('hidden'); }
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    closeModal();
    if(typeof closeAddModal === 'function') closeAddModal();
  }
});
