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
  function loadValues($question){
    var id = parseInt($question.attr('data-id'));
    var qTitleValue = $question.find('input[name="question_title[]"]').val();
    var qTypeValue = $question.find('input[name="question_type_'+id+'"]:checked').val();
    var qAnswerValues = [];
    $question.find('input[name="question_answer_'+id+'[]"]').each(function(i){
      qAnswerValues.push($(this).val());
    });
    var qValues = {'title':qTitleValue, 'type':qTypeValue, 'answers': qAnswerValues};
  }
  // bind dynamic DOM
  var replaces = ['question_title','question_type','question_answer'];
  var pollQuestions = {};
  $(document.body).on('click',"button.question_add",function(evt){
    evt.preventDefault();
    var $question = $(this).parent().parent().parent();
    var $origin   = $question.parent();
    var id = parseInt($question.attr('data-id'));

    pollQuestions[id] = loadValues($question);

    if(id >= 39) return false;
    $qQuestion = $question.clone();$qQuestion.attr('data-id',(id+1));
    var question = $qQuestion[0].outerHTML;
    for(var i=0;i<replaces.length;i++){
      var replace=replaces[i];
      var toreplace=replace+'_'+(id+1);
      replace += '_'+id;
      question=question.replace(new RegExp(replace,'g'),toreplace);
    }
    $origin.append(question);
    return false;
  });
  $(document.body).on('click',"button.question_rm",function(evt){
    evt.preventDefault();
    var $question = $(this).parent().parent().parent();
    var id = parseInt($question.attr('data-id'));

    delete pollQuestions[id];

    if (id) $question.remove();
    return false;
  });
  var kinds = ['open','unique','multiple','feel'];
  $(document.body).on('click',"input.question_type",function(evt){
    var $question = $(this).parent().parent().parent().parent().parent();
    var kind = $(this).attr('value');
    for(var i=0;i<kinds.length;i++){
      var ckind = kinds[i];
      $question.find('.'+ckind).hide();
    }
    $question.find('.'+kind).show();
  });


  //// profile
  // more
  $('.more').on('click',function(evt){
    evt.preventDefault();
    var id = $(this).data('id');
    $('.answer').hide();
    $('#'+id).fadeToggle();
    return false;
  });
  // modal redirection
  $("#confirmModal").on("show.bs.modal",function(e){
    $(this).find('.btn-danger').attr('href',$(e.relatedTarget).data('href'));
  });
});