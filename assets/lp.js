/* Le Pipeline — comportements partagés : thème, curseur, révélation au scroll */
(function(){
  function sync(){document.querySelectorAll('.theme-btn').forEach(b=>b.textContent=document.body.dataset.theme==='dark'?'☀':'☾');}
  sync();
  document.querySelectorAll('.theme-btn').forEach(btn=>btn.addEventListener('click',function(){
    var n=document.body.dataset.theme==='dark'?'light':'dark';
    document.body.dataset.theme=n;
    try{localStorage.setItem('lp-theme',n);}catch(e){}
    sync();
  }));

  var c=document.getElementById('cursor');
  if(c && !matchMedia('(hover:none)').matches){
    addEventListener('mousemove',function(e){c.style.left=e.clientX+'px';c.style.top=e.clientY+'px';});
    document.querySelectorAll('a,button,input,select,label').forEach(function(el){
      el.addEventListener('mouseenter',function(){c.classList.add('big');});
      el.addEventListener('mouseleave',function(){c.classList.remove('big');});
    });
  }

  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
})();
