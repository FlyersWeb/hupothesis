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

  var options = [];
  if (window.hupothesis_options) { options = window.hupothesis_options; };

  if (!options.length) {
    return;
  }
  for(var i=0; i<options.length; i++)  {
    var c_opt = options[i];
    if (typeof c_opt.userid !== 'undefined') {
      options = options[0];
      break;
    }
  }
  
  var scriptid = 'hupothesis-script-'+options.userid;
  var scripts = document.getElementsByClassName(scriptid);

  for(var i=0; i<scripts.length; i++)
  {
    var script = scripts[i];

    var divid = 'hupothesis-'+options.fileid;
    var div = document.createElement('div');
    var h4 = document.createElement('h4');
    var p1 = document.createElement('p');
    var p2 = document.createElement('p');
    div.className = divid;
    h4.innerHTML = 'Hupothesis download';
    p1.innerHTML = 'File available to download at <a href="'+options.url+'/answer/'+options.fileid+'"><img width="25" height="25" src="'+options.url+'/images/download.png"/></a>';
    p2.innerHTML = 'Offered by <a href="'+options.url+'">Hupothesis&copy;</a> courtesy';

    div.appendChild(h4);
    div.appendChild(p1);
    div.appendChild(p2);

    script.parentNode.appendChild(div);

    console.log(script.parentNode);

  }
})();