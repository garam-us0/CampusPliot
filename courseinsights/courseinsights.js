/* Campuspilot — COURSE INSIGHTS page logic: a real course browser.
   The 5-course catalog is structural and always loads; each course's
   admin "featured" flag and student reviews persist in localStorage
   (see shared/store.js). shared/toast.js, shared/nav.js and
   shared/session.js are already loaded before this file. */
var DEPT_COLOR = { 'OSC':'red', 'CS':'granite', 'WRTG':'gold', 'MATH':'teal', 'BIOL':'green' };
var SOLID = { red:'#BE0000', granite:'#708E99', teal:'#3ABFC0', gold:'#FFB81D', green:'#6CC24A' };
var TINT = { red:'var(--red-tint)', granite:'var(--granite-tint)', teal:'var(--teal-tint)', gold:'var(--gold-tint)', green:'var(--green-tint)' };

/* The 5 courses are the site's own catalog (structural, not sample
   scenario data) and always load; only each course's admin "featured"
   flag and its reviews persist across a reload, in localStorage. */
var CI_STORAGE_KEY = 'campuspilot.courseinsights.v1';
var ciCourses = [
  { id:1, code:'OSC 2030', name:'Business Statistics', instructor:'Prof. Eunsol Yoo', dept:'OSC', difficulty:'Medium', workload:6, featured:false, reviews:[]},
  { id:2, code:'CS 3500', name:'Software Practice', instructor:'Prof. Daniel Kopta', dept:'CS', difficulty:'Hard', workload:11, featured:false, reviews:[]},
  { id:3, code:'WRTG 2010', name:'Intermediate Writing', instructor:'Prof. Sarah Jenkins', dept:'WRTG', difficulty:'Easy', workload:4, featured:false, reviews:[]},
  { id:4, code:'MATH 1210', name:'Calculus I', instructor:'Prof. Han-Bit Oh', dept:'MATH', difficulty:'Hard', workload:9, featured:false, reviews:[]},
  { id:5, code:'BIOL 1010', name:'General Biology', instructor:'Prof. Grace Kim', dept:'BIOL', difficulty:'Medium', workload:5, featured:false, reviews:[]}
];
(function(){
  var saved = cpLoadJSON(CI_STORAGE_KEY, null);
  if(saved){
    ciCourses.forEach(function(c){
      if(saved[c.id]){ c.featured = !!saved[c.id].featured; c.reviews = saved[c.id].reviews || []; }
    });
  }
})();
function ciPersist(){
  var saved = {};
  ciCourses.forEach(function(c){ saved[c.id] = { featured: c.featured, reviews: c.reviews }; });
  cpSaveJSON(CI_STORAGE_KEY, saved);
}

var isAdmin = false;
var ciDeptFilter = 'all';
var ciActiveCourse = null;
var ciSelectedStars = 0;

function ciApplyAdmin(){
  document.getElementById('fhSub').textContent = isAdmin
    ? 'Feature courses on top of the list and moderate reviews.'
    : 'Course evaluations, syllabus previews, and ratings';
  ciRender();
}

function avgRating(c){
  if(!c.reviews.length) return null;
  var s = c.reviews.reduce(function(a,r){ return a+r.rating; },0);
  return (s/c.reviews.length);
}
function starsHtml(n, size){
  size = size || 12;
  var out = '';
  for(var i=1;i<=5;i++){
    out += '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="'+(i<=Math.round(n)?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.6"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3 6.2 20.5l1.1-6.5-4.8-4.6 6.6-.9Z"/></svg>';
  }
  return out;
}

function ciRenderFilters(){
  var depts = ['all','OSC','CS','WRTG','MATH','BIOL'];
  document.getElementById('ciDeptFilters').innerHTML = depts.map(function(d){
    var active = d===ciDeptFilter;
    return '<button class="ci-pill'+(active?' active':'')+'" onclick="ciSetDept(\''+d+'\')">'+(d==='all'?'All Departments':d)+'</button>';
  }).join('');
}
function ciSetDept(d){ ciDeptFilter = d; ciRenderFilters(); ciRender(); }

function ciRender(){
  var q = document.getElementById('ciSearch').value.trim().toLowerCase();
  var list = ciCourses.filter(function(c){
    if(ciDeptFilter !== 'all' && c.dept !== ciDeptFilter) return false;
    if(q && (c.code+' '+c.name+' '+c.instructor).toLowerCase().indexOf(q) === -1) return false;
    return true;
  }).sort(function(a,b){ return (b.featured?1:0) - (a.featured?1:0); });

  document.getElementById('ciList').innerHTML = list.map(function(c){
    var color = DEPT_COLOR[c.dept] || 'granite';
    var rating = avgRating(c);
    var diffClass = c.difficulty === 'Easy' ? 'diff-easy' : c.difficulty === 'Hard' ? 'diff-hard' : 'diff-medium';
    var adminStar = isAdmin
      ? '<button class="lc-feature-star'+(c.featured?' on':'')+'" title="Feature this course" onclick="event.stopPropagation();ciToggleFeature('+c.id+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="'+(c.featured?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3 6.2 20.5l1.1-6.5-4.8-4.6 6.6-.9Z"/></svg></button>'
      : '';
    return '<div class="list-card" onclick="ciOpenDetail('+c.id+')">'
      + (c.featured ? '' : '')
      + '<div class="lc-icon" style="background:'+TINT[color]+';color:'+SOLID[color]+';">'+c.dept+'</div>'
      + '<div style="min-width:0;">'+(c.featured?'<div class="lc-pin-tag">★ FEATURED</div>':'')+'<div class="lc-title">'+c.code+' — '+c.name+'</div><div class="lc-sub">'+c.instructor+'</div></div>'
      + '<div class="lc-right">'
      + '<div class="lc-rating">'+(rating?rating.toFixed(1):'—')+' <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3 6.2 20.5l1.1-6.5-4.8-4.6 6.6-.9Z"/></svg></div>'
      + '<span class="lc-diff '+diffClass+'">'+c.difficulty+'</span>'
      + '</div>'
      + adminStar
      + '</div>';
  }).join('') || '<div style="text-align:center;padding:40px;color:var(--muted-2);font-size:13.5px;">No courses match.</div>';
}
function ciToggleFeature(id){
  var c = ciCourses.filter(function(x){ return x.id===id; })[0];
  if(!c) return;
  c.featured = !c.featured;
  ciPersist();
  ciRender();
  showToast(c.featured ? '"'+c.code+'" pinned to the top as Featured.' : '"'+c.code+'" unfeatured.');
}

function ciOpenDetail(id){
  var c = ciCourses.filter(function(x){ return x.id===id; })[0];
  if(!c) return;
  ciActiveCourse = c;
  var rating = avgRating(c);
  document.getElementById('detailTitle').textContent = c.code + ' — ' + c.name;
  document.getElementById('detailSub').textContent = c.instructor + ' · ' + c.dept + ' Department';
  document.getElementById('statRating').textContent = (rating?rating.toFixed(1):'—') + ' ★';
  document.getElementById('statDiff').textContent = c.difficulty;
  document.getElementById('statWorkload').textContent = c.workload + ' hrs';
  document.getElementById('writeForm').classList.remove('show');
  ciSelectedStars = 0;
  document.getElementById('reviewText').value = '';
  ciRenderStarPick();
  ciRenderReviews();
  document.getElementById('detail-modal').classList.remove('hidden');
}
function ciCloseDetail(){ document.getElementById('detail-modal').classList.add('hidden'); }

function ciRenderReviews(){
  var c = ciActiveCourse;
  document.getElementById('reviewsCount').textContent = 'Reviews (' + c.reviews.length + ')';
  document.getElementById('reviewList').innerHTML = c.reviews.map(function(r){
    return '<div class="ci-review"><div class="ci-review-avatar">'+r.user+'</div><div style="flex:1;min-width:0;">'
      + '<div class="ci-review-top"><div><span class="ci-review-user">'+r.user+'</span><span class="ci-review-date">'+r.date+'</span></div>'
      + '<div class="ci-review-stars">'+starsHtml(r.rating,12)+'</div></div>'
      + '<div class="ci-review-text">'+r.text+'</div></div>'
      + (isAdmin ? '<button class="ci-review-del" title="Remove review" onclick="ciDeleteReview('+r.id+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6l-12 12"/></svg></button>' : '')
      + '</div>';
  }).join('') || '<div style="font-size:13px;color:var(--muted-2);padding:10px 0;">No reviews yet — be the first.</div>';
}
function ciDeleteReview(id){
  var c = ciActiveCourse;
  c.reviews = c.reviews.filter(function(r){ return r.id !== id; });
  ciPersist();
  ciRenderReviews();
  ciRender();
  showToast('Review removed.');
}

function ciToggleWriteForm(){
  document.getElementById('writeForm').classList.toggle('show');
}
function ciRenderStarPick(){
  var html = '';
  for(var i=1;i<=5;i++){
    html += '<button class="'+(i<=ciSelectedStars?'sel':'')+'" onclick="ciPickStar('+i+')"><svg width="22" height="22" viewBox="0 0 24 24" fill="'+(i<=ciSelectedStars?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3 6.2 20.5l1.1-6.5-4.8-4.6 6.6-.9Z"/></svg></button>';
  }
  document.getElementById('starPick').innerHTML = html;
}
function ciPickStar(n){ ciSelectedStars = n; ciRenderStarPick(); }
function ciSubmitReview(){
  var text = document.getElementById('reviewText').value.trim();
  if(ciSelectedStars === 0){ showToast('Please pick a star rating.'); return; }
  if(!text){ showToast('Please write a short review.'); return; }
  ciActiveCourse.reviews.unshift({ id:Date.now(), user:'GY', rating:ciSelectedStars, date:'Today', text:text });
  ciPersist();
  document.getElementById('writeForm').classList.remove('show');
  document.getElementById('reviewText').value = '';
  ciSelectedStars = 0;
  ciRenderStarPick();
  ciRenderReviews();
  ciRender();
  showToast('Review posted — thanks for helping other students!');
}

document.addEventListener('keydown', function(e){ if(e.key === 'Escape') ciCloseDetail(); });

ciRenderFilters();
ciRender();
