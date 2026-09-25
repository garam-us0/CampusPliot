/* Campuspilot — shared toast helper. Include on any page that shows
   a "Give Feedback" / "coming soon" style confirmation message.
   Requires: <div id="toast-host"></div> somewhere in the page body. */
function showToast(msg){
  var host = document.getElementById('toast-host');
  if(!host) return;
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  host.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add('show'); });
  setTimeout(function(){
    t.classList.remove('show');
    setTimeout(function(){ t.remove(); }, 250);
  }, 2400);
}