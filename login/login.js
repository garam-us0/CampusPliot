/* Campuspilot — login page logic.
   Validates the student UNID/password pair and the admin departmental
   passcode, then hands off to shared/session.js (setSession) and
   redirects into the app. There's no backend, so these are the two
   fixed credential pairs this prototype recognizes. */

var STUDENT_UNID = 'u1621896';
var STUDENT_PASSWORD = 'uacpilot25';
var ADMIN_PASSCODE = '000000';

function tryStudentLogin(){
  var unid = (document.getElementById('login-unid').value || '').trim();
  var pw = (document.getElementById('login-pw').value || '').trim();

  if(!unid || !pw){
    showToast('Enter your UNID and password.');
    return;
  }
  if(unid !== STUDENT_UNID || pw !== STUDENT_PASSWORD){
    showToast('Incorrect UNID or password.');
    return;
  }
  setSession('student');
  window.location.href = '../home/index.html';
}

function getOtpValue(){
  var out = '';
  for(var i = 0; i < 6; i++){
    var box = document.getElementById('otp-' + i);
    out += (box && box.value) ? box.value : '';
  }
  return out;
}

function clearOtp(){
  for(var i = 0; i < 6; i++){
    var box = document.getElementById('otp-' + i);
    if(box) box.value = '';
  }
  var first = document.getElementById('otp-0');
  if(first) first.focus();
}

function tryAdminLogin(){
  var code = getOtpValue();
  if(code.length < 6){
    showToast('Enter the full 6-digit departmental passcode.');
    return;
  }
  if(code !== ADMIN_PASSCODE){
    showToast('Incorrect departmental passcode.');
    clearOtp();
    return;
  }
  setSession('admin');
  window.location.href = '../home/index.html';
}

function wireOtpBoxes(){
  for(var i = 0; i < 6; i++){
    (function(idx){
      var box = document.getElementById('otp-' + idx);
      if(!box) return;
      box.addEventListener('input', function(){
        box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);
        if(box.value && idx < 5){
          var next = document.getElementById('otp-' + (idx + 1));
          if(next) next.focus();
        }
      });
      box.addEventListener('keydown', function(e){
        if(e.key === 'Backspace' && !box.value && idx > 0){
          var prev = document.getElementById('otp-' + (idx - 1));
          if(prev){ prev.focus(); }
        }else if(e.key === 'Enter'){
          tryAdminLogin();
        }
      });
    })(i);
  }
}

document.addEventListener('DOMContentLoaded', wireOtpBoxes);
