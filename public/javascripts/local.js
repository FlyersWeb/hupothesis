function pad(number) {
    var r = String(number);
    if ( r.length === 1 ) {
        r = '0' + r;
    }
    return r;
}

$(function(){

  var sendTrack = function(cid) {
    var uinf = {};
    var d = new Date();
    if(typeof cid != 'undefined') uinf['cid']=cid;
    uinf['appCodeName']=navigator.appCodeName;
    uinf['appName']=navigator.appName;
    uinf['appVersion']=navigator.appVersion;
    uinf['language']=navigator.language;
    uinf['platform']=navigator.platform;
    uinf['product']=navigator.product;
    uinf['productSub']=navigator.productSub;
    uinf['userAgent']=navigator.userAgent;
    uinf['vendor']=navigator.vendor;
    uinf['location']=document.location.href;
    uinf['referrer']=document.referrer;
    uinf['screen']=screen.width+'x'+screen.height+'x'+screen.pixelDepth;
    uinf['time']=d.getTime();
    uinf['timeoffset']=d.getTimezoneOffset();
    $.ajax({
      url: '/track',
      data: uinf,
      dataType: 'jsonp'
    });
  };
  $(document).on("sendTrack",function(e){
    sendTrack(e.message);
  });

  var zecsec  = 0;
  var seconds = 0;
  var mints   = 0;
  var $timer = $('.timer');
  var chronometer = function(e){
    zecsec+=1;
    if(zecsec>9){zecsec=0;seconds+=1;}
    if(seconds>59){seconds=0;mints+=1;}
    $timer.html(pad(mints)+":"+pad(seconds));
    setTimeout(function(){
      chronometer(e);
    },100);
  };
  $(document).on("launchTimer",chronometer);
  $("a.launchTimer").on("click",function(e){
    $.event.trigger({
      type:"launchTimer",
      message: "",
      time: new Date()
    });
  });

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
    $qQuestion = $question.clone();$qQuestion.attr('data-id',(id+2));
    $qQuestion.find('.question_id').html((id+1));
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
  //// feeling
  $('.range_feeling').on('change',function(evt){
    var idx = $(this).val();
    var $select = $(this).parent().parent().find('.in_feeling');
    $select.find('option:selected').removeAttr('selected');
    $select.find('option:eq('+(idx-1)+')').prop('selected', true);
  });

  //// prompts
  $('.prompt').on('click', function(e){
    $(this).removeAttr('readonly');
  });
  $('.prompt').on('blur', function(e){
    $(this).attr('readonly','');
  });
  $('.prompt').on('keypress', function(e){
    e.preventDefault();
    return false;
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