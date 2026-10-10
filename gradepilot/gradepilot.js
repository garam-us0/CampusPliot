/* Campuspilot — GRADEPILOT page logic: a syllabus-driven grade
   calculator / GPA simulator. Nothing here talks to a real backend —
   "Analyze Syllabus" just loads one of three sample grading models
   (or a generic one for any other PDF name) so the tool is fully
   clickable without a server. shared/toast.js (showToast) and
   shared/nav.js (mountNavRail) are already loaded before this file. */

/* ---- sample grading models, as if parsed from a real syllabus ---- */
var gpTemplates = {
  OSC2030: {
    code: 'OSC 2030', name: 'OSC 2030 — Business Statistics', instructor: 'Prof. Eunsol Yoo',
    file: '(OSC 2030-301) Business Statistics — Syllabus.pdf',
    grade: 'A', expanded: false,
    items: [
      { id:'att', name:'Attendance & Participation', weight:5, score:null },
      { id:'tests', name:'Tests', weight:60, group:true, sub:[
        { id:'t1', name:'Test 1', weight:20, score:null },
        { id:'t2', name:'Test 2', weight:20, score:null },
        { id:'t3', name:'Test 3', weight:20, score:null }
      ]},
      { id:'final', name:'Final Exam', weight:35, score:null }
    ]
  },
  CS3500: {
    code: 'CS 3500', name: 'CS 3500 — Software Practice', instructor: 'Prof. Daniel Kopta',
    file: '(CS 3500) Software Practice — Fall 2026.pdf',
    grade: 'A', expanded: false,
    items: [
      { id:'assign', name:'Weekly Assignments (avg)', weight:30, score:null },
      { id:'midterms', name:'Midterm Exams', weight:30, group:true, sub:[
        { id:'m1', name:'Midterm 1', weight:15, score:null },
        { id:'m2', name:'Midterm 2', weight:15, score:null }
      ]},
      { id:'project', name:'Final Software Project', weight:25, score:null },
      { id:'final', name:'Final Comprehensive Exam', weight:15, score:null }
    ]
  },
  WRTG2010: {
    code: 'WRTG 2010', name: 'WRTG 2010 — Intermediate Writing', instructor: 'Prof. Sarah Jenkins',
    file: '(WRTG 2010) Syllabus — Section 04.pdf',
    grade: 'A', expanded: false,
    items: [
      { id:'w1', name:'Rhetorical Analysis Essay', weight:20, score:null },
      { id:'w2', name:'Argumentative Synthesis', weight:25, score:null },
      { id:'w3', name:'Peer Review & Workshops', weight:15, score:null },
      { id:'w4', name:'Research Paper Portfolio', weight:40, score:null }
    ]
  }
};

var gpGradeCutoffs = [
  ['A',93,4.0],['A-',90,3.7],['B+',87,3.3],['B',83,3.0],['B-',80,2.7],
  ['C+',77,2.3],['C',73,2.0],['C-',70,1.7],['D',65,1.0]
];

var gpCourses = {};      // active, built courses keyed by code
var gpActiveKey = null;
var gpStagedKey = null;
var gpStagedFile = '';

/* ---------------- view switching ---------------- */
function gpShowUpload(){
  document.getElementById('gpDashboardView').classList.add('hidden');
  document.getElementById('gpUploadView').classList.remove('hidden');
  var cancelBtn = document.getElementById('gpCancelBtn');
  cancelBtn.classList.toggle('hidden', Object.keys(gpCourses).length === 0);
}
function gpShowDashboard(){
  if(!gpActiveKey || !gpCourses[gpActiveKey]){ gpShowUpload(); return; }
  document.getElementById('gpUploadView').classList.add('hidden');
  document.getElementById('gpDashboardView').classList.remove('hidden');
}

/* ---------------- course pills ---------------- */
function gpRenderPills(){
  var toolbar = document.getElementById('gpToolbar');
  var wrap = document.getElementById('gpPills');
  var keys = Object.keys(gpCourses);
  toolbar.classList.toggle('hidden', keys.length === 0);
  wrap.innerHTML = keys.map(function(key){
    var c = gpCourses[key];
    var active = key === gpActiveKey;
    return '<button class="gp-pill'+(active?' active':'')+'" onclick="gpSelectCourse(\''+key+'\')"><span class="dot"></span>'+c.code+'</button>';
  }).join('');
}
function gpSelectCourse(key){
  gpActiveKey = key;
  gpShowDashboard();
  gpRenderPills();
  gpRenderCourse();
  showToast('Switched to ' + gpCourses[key].code);
}

/* ---------------- file staging (drop / browse / samples) ---------------- */
function gpGuessKey(filename){
  var u = filename.toUpperCase();
  if(u.indexOf('OSC') > -1) return 'OSC2030';
  if(u.indexOf('CS') > -1) return 'CS3500';
  if(u.indexOf('WRTG') > -1) return 'WRTG2010';
  return null;
}
function gpSetStaged(key, filename){
  gpStagedKey = key;
  gpStagedFile = filename;
  var el = document.getElementById('gpStagedName');
  el.textContent = 'Selected: ' + filename;
  el.classList.remove('hidden');
  document.getElementById('gpAnalyzeBtn').disabled = false;
}
function gpHandleFileSelected(e){
  var file = e.target.files[0];
  if(!file) return;
  gpSetStaged(gpGuessKey(file.name), file.name);
}
function gpHandleDrop(e){
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  if(!file) return;
  gpSetStaged(gpGuessKey(file.name), file.name);
}
function gpLoadSample(key){
  var t = gpTemplates[key];
  if(t) gpSetStaged(key, t.file);
}

/* ---------------- "AI analysis" (simulated) ---------------- */
function gpStartAnalysis(){
  if(!gpStagedFile) gpLoadSample('OSC2030');

  var overlay = document.getElementById('gpOverlay');
  var bar = document.getElementById('gpOverlayBar');
  var title = document.getElementById('gpOverlayTitle');
  var sub = document.getElementById('gpOverlaySub');

  overlay.classList.remove('hidden');
  title.textContent = 'Extracting course rules...';
  sub.textContent = 'Parsing weights, drop policies & grade cutoffs';
  bar.style.width = '15%';

  var progress = 15;
  var timer = setInterval(function(){
    progress += 28;
    bar.style.width = Math.min(progress,100) + '%';
    if(progress >= 65 && progress < 93){
      title.textContent = 'Building grade model...';
      sub.textContent = 'Mapping assessments to letter-grade thresholds';
    }
    if(progress >= 100){
      clearInterval(timer);
      setTimeout(function(){
        overlay.classList.add('hidden');
        gpFinishAnalysis();
      }, 300);
    }
  }, 220);
}
function gpFinishAnalysis(){
  var template = gpTemplates[gpStagedKey];
  var course;
  if(template){
    course = JSON.parse(JSON.stringify(template));
  } else {
    var label = (gpStagedFile.split('.')[0] || 'New Course').slice(0, 24);
    course = {
      code: label.slice(0,10), name: label, instructor: 'Instructor TBD',
      file: gpStagedFile, grade: 'A', expanded: false,
      items: [
        { id:'c1', name:'Assignments', weight:40, score:null },
        { id:'c2', name:'Midterm Exam', weight:30, score:null },
        { id:'c3', name:'Final Exam', weight:30, score:null }
      ]
    };
  }
  if(gpStagedFile) course.file = gpStagedFile;

  var key = gpStagedKey || ('CUSTOM_' + Date.now());
  gpCourses[key] = course;
  gpActiveKey = key;

  gpShowDashboard();
  gpRenderPills();
  gpRenderCourse();
  showToast('Grade model created for ' + course.code + '!');

  gpStagedKey = null;
  gpStagedFile = '';
}

/* ---------------- dashboard rendering ---------------- */
function gpRenderCourse(){
  var c = gpCourses[gpActiveKey];
  if(!c) return;

  document.getElementById('gpCourseTitle').textContent = c.name;
  document.getElementById('gpCourseInstructor').textContent = c.instructor;
  document.getElementById('gpActiveFileName').textContent = c.file;
  document.getElementById('gpAppliedCourse').textContent = c.code;
  document.getElementById('gpRightCourseBadge').textContent = c.code;
  document.getElementById('gpGpaCourse').textContent = c.code;

  gpRenderGradeGrid();
  gpRenderRows();
  gpCalculate();
}

function gpRenderGradeGrid(){
  var c = gpCourses[gpActiveKey];
  var grid = document.getElementById('gpGradeGrid');
  grid.innerHTML = gpGradeCutoffs.map(function(g){
    var grade = g[0];
    var active = grade === c.grade;
    return '<button class="gp-grade-btn'+(active?' active':'')+'" onclick="gpSetTargetGrade(\''+grade+'\')">'+grade+'</button>';
  }).join('');
}
function gpSetTargetGrade(grade){
  gpCourses[gpActiveKey].grade = grade;
  gpRenderGradeGrid();
  gpCalculate();
}

function gpRenderRows(){
  var c = gpCourses[gpActiveKey];
  var list = document.getElementById('gpRows');
  var html = '';
  var totalWeight = 0;

  c.items.forEach(function(item, idx){
    totalWeight += item.weight;
    if(item.group){
      var done = item.sub.filter(function(s){ return s.score !== null; }).length;
      html += '<div class="gp-row gp-row-group'+(c.expanded?' expanded':'')+'" onclick="gpToggleGroup()">'
        + '<div class="gp-row-name"><span class="gp-chevron"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>'+item.name+'</div>'
        + '<div class="gp-row-wt">'+item.weight+'%</div>'
        + '<div class="gp-row-group-count">'+done+'/'+item.sub.length+' completed</div>'
        + '</div>';
      if(c.expanded){
        html += '<div class="gp-subrows">' + item.sub.map(function(s, subIdx){
          var isDone = s.score !== null;
          return '<div class="gp-subrow">'
            + '<div class="gp-row-name"><span class="gp-dot'+(isDone?' done':'')+'"></span>'+s.name+'</div>'
            + '<div class="gp-row-wt">'+s.weight+'%</div>'
            + '<div class="gp-row-score"><input type="number" min="0" max="100" value="'+(isDone?s.score:'')+'" placeholder="—" oninput="gpUpdateSubScore('+idx+','+subIdx+',this.value)"><span>/100</span></div>'
            + '<div class="gp-row-status"><span class="gp-status-tag '+(isDone?'done':'pending')+'">'+(isDone?'DONE':'PENDING')+'</span></div>'
            + '</div>';
        }).join('') + '</div>';
      }
    } else {
      var isDone = item.score !== null;
      html += '<div class="gp-row">'
        + '<div class="gp-row-name"><span class="gp-dot'+(isDone?' done':'')+'"></span>'+item.name+'</div>'
        + '<div class="gp-row-wt">'+item.weight+'%</div>'
        + '<div class="gp-row-score"><input type="number" min="0" max="100" value="'+(isDone?item.score:'')+'" placeholder="—" oninput="gpUpdateScore('+idx+',this.value)"><span>/100</span></div>'
        + '<div class="gp-row-status"><span class="gp-status-tag '+(isDone?'done':'pending')+'">'+(isDone?'DONE':'PENDING')+'</span></div>'
        + '</div>';
    }
  });

  list.innerHTML = html;
  document.getElementById('gpWeightTotal').textContent = 'Total weight: ' + totalWeight + '%';
}

function gpToggleGroup(){
  var c = gpCourses[gpActiveKey];
  c.expanded = !c.expanded;
  gpRenderRows();
}
function gpUpdateScore(idx, value){
  var v = value.trim();
  gpCourses[gpActiveKey].items[idx].score = v === '' ? null : Math.max(0, Math.min(100, parseFloat(v) || 0));
  gpRenderRows();
  gpCalculate();
}
function gpUpdateSubScore(idx, subIdx, value){
  var v = value.trim();
  gpCourses[gpActiveKey].items[idx].sub[subIdx].score = v === '' ? null : Math.max(0, Math.min(100, parseFloat(v) || 0));
  gpRenderRows();
  gpCalculate();
}

function gpPromptNewAssessment(){
  var name = prompt('Assessment title:', 'Homework / Quiz');
  if(!name) return;
  var weight = parseInt(prompt('Weight percentage (e.g. 10):', '10'), 10) || 10;
  gpCourses[gpActiveKey].items.push({ id:'custom_'+Date.now(), name:name, weight:weight, score:null });
  gpRenderRows();
  gpCalculate();
  showToast('Added ' + name);
}

/* ---------------- grade math ---------------- */
function gpFlattenItems(items){
  var out = [];
  items.forEach(function(item){
    if(item.group) item.sub.forEach(function(s){ out.push(s); });
    else out.push(item);
  });
  return out;
}
function gpPercentToGpa(pct){
  if(pct >= gpGradeCutoffs[0][1]) return gpGradeCutoffs[0][2];
  for(var i = 0; i < gpGradeCutoffs.length; i++){
    if(pct >= gpGradeCutoffs[i][1]){
      var hi = gpGradeCutoffs[i-1] || [null, 100, 4.0];
      var lo = gpGradeCutoffs[i];
      var span = hi[1] - lo[1];
      var frac = span > 0 ? (pct - lo[1]) / span : 0;
      return (lo[2] + frac * (hi[2] - lo[2]));
    }
  }
  return 0.0;
}

function gpCalculate(){
  var c = gpCourses[gpActiveKey];
  if(!c) return;
  var items = gpFlattenItems(c.items);
  var targetCutoff = (gpGradeCutoffs.filter(function(g){ return g[0] === c.grade; })[0] || gpGradeCutoffs[0])[1];

  var completedPoints = 0, completedWeight = 0, pendingWeight = 0;
  items.forEach(function(it){
    if(it.score !== null){
      completedPoints += it.score * (it.weight / 100);
      completedWeight += it.weight;
    } else {
      pendingWeight += it.weight;
    }
  });

  var deficit = targetCutoff - completedPoints;
  var requiredPerPending = pendingWeight > 0
    ? Math.round(deficit / (pendingWeight / 100))
    : (completedPoints >= targetCutoff ? 0 : 100);

  var floor = (Math.round(completedPoints * 10) / 10).toFixed(1);
  var ceiling = (Math.round((completedPoints + pendingWeight) * 10) / 10).toFixed(1);
  document.getElementById('gpFloorCeil').textContent = 'Current floor ' + floor + '% · ceiling ' + ceiling + '%.';

  var bigNum = document.getElementById('gpBigNum');
  var badge = document.getElementById('gpGoalBadge');
  if(requiredPerPending <= 0){
    bigNum.textContent = '0';
    badge.innerHTML = '<span class="gp-goal-tag ok">✓ Goal Secured</span>';
  } else if(requiredPerPending <= 100){
    bigNum.textContent = requiredPerPending;
    badge.innerHTML = '<span class="gp-goal-tag ok">✓ Goal Achievable</span>';
  } else {
    bigNum.textContent = requiredPerPending;
    badge.innerHTML = '<span class="gp-goal-tag over">⚠ Needs &gt;100%</span>';
  }

  document.getElementById('gpSharedLabel').textContent = c.grade + ' target';
  document.getElementById('gpSharedRows').innerHTML = items.map(function(it){
    var isDone = it.score !== null;
    return '<div class="gp-shared-row"><div><div class="gp-shared-row-name">'+it.name+'</div><div class="gp-shared-row-wt">'+it.weight+'% of course grade</div></div>'
      + '<span class="gp-shared-row-val">'+(isDone ? 'Done ('+it.score+')' : Math.max(0, requiredPerPending)+' pts')+'</span></div>';
  }).join('');

  var gpaEl = document.getElementById('gpGpaVal');
  var barEl = document.getElementById('gpGpaBar');
  if(completedWeight === 0){
    gpaEl.textContent = '—';
    barEl.style.width = '0%';
  } else {
    var avgPct = completedPoints / completedWeight * 100;
    var gpa = gpPercentToGpa(avgPct);
    gpaEl.textContent = gpa.toFixed(2);
    barEl.style.width = Math.min(100, (gpa / 4.0) * 100) + '%';
  }
}

/* ---------------- initial state ---------------- */
window.addEventListener('DOMContentLoaded', function(){
  gpShowUpload();
  gpRenderPills();
});