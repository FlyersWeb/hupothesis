$(function(){
  //// autocomplete
  var tagCache = {};
  $("#tags").autocomplete({
    minLength: 2,
    source: function(req,res){
      var terms = req.term.split(',');
      var term  = terms[terms.length-1].trim();
      if(term.length > 2) {
        if(term in tagCache) {
          res(tagCache[term]);
          return;
        }
        $.getJSON("/tag/suggest/"+term, function(data){
          tagCache[term]=data;
          res(data);
        });
      }
    },
    select: function(evt,ui){
      evt.preventDefault();
      var ret = '';
      var values = this.value.split(',');
      for(var i=0;i<(values.length-1);i++){
        var value=values[i].trim();
        ret += value+', ';
      }
      ret += ui.item.value+', ';
      this.value = ret;
      return false;
    },
    focus: function(evt,ui){evt.preventDefault();return false;}
  });
});