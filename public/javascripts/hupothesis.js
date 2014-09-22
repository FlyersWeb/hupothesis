(function() {
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
      var i, j;
      i = start || 0;
      j = this.length;
      while (i < j) {
        if (this[i] === obj) {
          return i;
        }
        i++;
      }
      return -1;
    };
  }

  var options = {};
  if (window.hupothesis_options) { options = window.hupothesis_options; };
  
  var divid = 'hupothesis-'+options.fileid;
  var div = document.createElement('div');
  div.className = divid;
  div.innerHTML = '<h2>Widget</h2>';
  document.body.appendChild(div);
})();