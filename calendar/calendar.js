/* Campuspilot — CALENDAR page logic (filters + add-schedule modal). */

/* ---------------- add schedule modal ---------------- */
(function(){
  var sel = document.getElementById('as-date');
  for(var d=1; d<=30; d++){ var o=document.createElement('option'); o.value=d; o.textContent='September '+d+', 2026'; sel.appendChild(o); }
})();
function openAddModal(){ document.getElementById('add-modal').classList.remove('hidden'); }
function closeAddModal(){ document.getElementById('add-modal').classList.add('hidden'); }
function addSchedule(){
  var title = document.getElementById('as-title').value.trim() || 'New Personal Event';
  var date = document.getElementById('as-date').value;
  var time = document.getElementById('as-time').value.trim();
  var cell = document.querySelector('.cal-cell[data-date="'+date+'"]');
  if(cell){
    var chip = document.createElement('span');
    chip.className = 'ev-chip ev-chip--personal';
    chip.setAttribute('data-cat','personal');
    chip.textContent = '[Personal] ' + title + (time ? ' · ' + time : '');
    cell.appendChild(chip);
  }
  closeAddModal();
  document.getElementById('as-title').value = '';
  document.getElementById('as-time').value = '';
  applyFilters();
  showToast('Personal schedule added to Sep ' + date);
}

/* ---------------- calendar filters ---------------- */
var currentFilter = 'all';
var personalOn = true;
function applyFilters(){
  document.querySelectorAll('.ev-chip').forEach(function(chip){
    var cat = chip.getAttribute('data-cat');
    var career = chip.getAttribute('data-career') === '1';
    var pass = true;
    if(currentFilter === 'rsvp') pass = cat === 'rsvp';
    else if(currentFilter === 'food') pass = cat === 'food';
    else if(currentFilter === 'career') pass = career;
    if(cat === 'personal' && !personalOn) pass = false;
    chip.classList.toggle('chip-hidden', !pass);
  });
}
document.getElementById('filter-row').addEventListener('click', function(e){
  var btn = e.target.closest('.pill');
  if(!btn) return;
  document.querySelectorAll('#filter-row .pill').forEach(function(p){ p.classList.remove('active'); });
  btn.classList.add('active');
  currentFilter = btn.getAttribute('data-filter');
  applyFilters();
});
function togglePersonal(){
  personalOn = !personalOn;
  document.getElementById('personal-switch').classList.toggle('on', personalOn);
  document.getElementById('personal-toggle').style.opacity = personalOn ? '1' : '.6';
  applyFilters();
  showToast(personalOn ? 'Personal schedule shown' : 'Personal schedule hidden');
}