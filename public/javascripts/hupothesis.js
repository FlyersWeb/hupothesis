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

  // DOM
  for(var i=0; i<scripts.length; i++)
  {
    var script = scripts[i];

    var divid = 'hupothesis-'+options.fileid;
    var div = document.createElement('div');
    div.className = divid;
    var h4 = document.createElement('h4');
    var p1 = document.createElement('p');
    p1.className = 'hupothesis-download';
    var p2 = document.createElement('p');
    p2.className = 'hupothesis-slogan';
    h4.innerHTML = 'Hupothesis download';
    p1.innerHTML = 'File available to download at <a class="download" href="'+options.url+'/answer/'+options.fileid+'"><i class="fa fa-cloud-download"></i><span class="download-inner">Hupothesis</span></a>';
    p2.innerHTML = 'Offered with <a href="'+options.url+'">Hupothesis</a> <i class="fa fa-copyright"></i> courtesy';

    div.appendChild(h4);
    div.appendChild(p1);
    div.appendChild(p2);

    script.parentNode.appendChild(div);
  }

  // Style
  var sBody = '\
  div.hupothesis-'+options.fileid+'{  \
    font-size:1em;                    \
  }                                   \
  .hupothesis-download .download {\
    vertical-align: top;\
    line-height: 5px;\
    border-radius: 4px;\
    box-shadow: #439230 0 6px 0px, rgba(0, 0, 0, 0.3) 0 10px 3px;\
    font-family: Arial, Helvetica, sans-serif;\
    font-size: 20px;\
    color: #fff;\
    text-decoration: none;\
    display: inline-block;\
    text-align: center;\
    padding: 10px 15px 8px;\
    margin: -.6em .5em -.4em 0;\
    cursor: pointer;\
    text-shadow: 0 1px 1px rgba(0,0,0,0.4);\
    -webkit-transition: 0.1s linear;\
    -moz-transition: 0.1s linear;\
    -ms-transition: 0.1s linear;\
    -o-transition: 0.1s linear;\
    transition: 0.1s linear;\
  \
    background: #82cc5d;\
    background: -moz-linear-gradient(top,  #82cc5d 0%, #53b73c 100%);\
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#82cc5d), color-stop(100%,#53b73c));\
    background: -webkit-linear-gradient(top,  #82cc5d 0%,#53b73c 100%);\
    background: -ms-linear-gradient(top,  #82cc5d 0%,#53b73c 100%);\
    background: linear-gradient(to bottom,  #82cc5d 0%,#53b73c 100%);\
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#82cc5d", endColorstr="#53b73c",GradientType=0 );\
    border: 1px solid #429E34;\
  }\
  \
  .hupothesis-download .download:hover {\
    box-shadow: #439230 0 6px 0px, rgba(0, 0, 0, 0.3) 0 10px 3px;\
  \
    background: #99cc80;\
    background: -moz-linear-gradient(top,  #99cc80 0%, #53b73c 100%);\
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#99cc80), color-stop(100%,#53b73c));\
    background: -webkit-linear-gradient(top,  #99cc80 0%,#53b73c 100%);\
    background: -ms-linear-gradient(top,  #99cc80 0%,#53b73c 100%);\
    background: linear-gradient(to bottom,  #99cc80 0%,#53b73c 100%);\
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#99cc80", endColorstr="#53b73c",GradientType=0 );\
  }\
  \
  .hupothesis-download .download:active {\
    box-shadow: #439230 0 3px 0, rgba(0, 0, 0, 0.2) 0 6px 3px;\
  \
    position: relative;\
    top: 5px;\
  }\
  \
  .hupothesis-download .download span {\
    margin-left: 5px;\
    color: #f0f0f0;\
    font-weight: normal;\
    font-size: 0.9em;\
    text-shadow: 0 none;\
  } \
  p.hupothesis-slogan{                \
    color: #CCC;                      \
    font-size: 0.8em;                 \
    font-weight: bold;                \
  }                                   \
  ';

  var link = document.createElement('link');
  link.setAttribute('href', '//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css');
  link.setAttribute('rel', 'stylesheet');
  var css = document.createElement('style');
  css.type = 'text/css';
  css.innerHTML = sBody;
  document.body.appendChild(link);
  document.body.appendChild(css);
})();