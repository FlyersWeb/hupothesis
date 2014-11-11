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

  //// poll
  // bind dynamic DOM
  var replaces = ['question_title','question_type','question_answer'];
  $(document.body).on('click',"button.question_add",function(evt){
    evt.preventDefault();
    var $question = $(this).parent().parent().parent();
    var $origin   = $question.parent();
    var id = parseInt($question.attr('data-id'));
    if(id>=3) return false;
    $qQuestion = $question.clone();$qQuestion.attr('data-id',(id+1));
    var question = $qQuestion[0].outerHTML;
    for(var i=0;i<replaces.length;i++){
      var replace=replaces[i];
      var toreplace=replace+'_'+(id+1);
      replace += '_'+id;
      console.log(replace)
      question=question.replace(new RegExp(replace,'g'),toreplace);
    }
    console.log(question)
    $origin.html($origin.html()+question);
    return false;
  });
  $(document.body).on('click',"button.question_rm",function(evt){
    evt.preventDefault();
    var $question = $(this).parent().parent().parent();
    var id = parseInt($question.attr('data-id'));
    if (id) $question.remove();
    return false;
  });
  var kinds = ['open','unique','multiple','feel'];
  $(document.body).on('click',"input.question_type",function(evt){
    var $question = $(this).parent().parent().parent();
    var kind = $(this).attr('value');
    for(var i=0;i<kinds.length;i++){
      var ckind = kinds[i];
      $question.find('.'+ckind).hide();
    }
    $question.find('.'+kind).show();
  });

});