/* ini toggle */
function iniToggle(id){
  var el=document.getElementById(id);
  if(!el){return false;}
  var dis=el.style.display;
  el.style.display=dis=='none'?'block':'none';
}
/* ini parse data */
function iniParseData(r){
  var parsed=parse_ini_string(r);
  //console.log(parsed);
  var data={},raw=r.split(/\r\n|\r|\n/g),key=null;
  for(var i=0;i<raw.length;i++){
    row=raw[i];
    if(row.match(/^\[.*\]$/g)){
      key=row.substr(1,row.length-2);
    }else if(!key){
      continue;
    }else{
      if(!data[key]){
        data[key]='';
      }
      if(row.match(/^;/g)){
        row='<span class="row-comment">'+row+'</span>';
      }
      if(row.match(/^ini:\/\/.*\.ini$/g)){
        row='<a href="#'+row.substr(6)+'">'+row+'</a>';
      }
      data[key]+=row+'\r\n';
    }
  }
  index.innerHTML='';
  var divConfig=document.createElement('div');
  var idx=0;
  var hideData=parsed.ini_config&&parseInt(parsed.ini_config['hide-data'])?true:false;
  for(var i in data){
    idx++;
    var head=document.createElement('div');
    var row=document.createElement('div');
    var an=document.createElement('a');
    head.classList.add('row-head');
    row.classList.add('row-data');
    row.id='ini-row-'+idx;
    row.style.display=hideData?'none':'block';
    row.innerHTML=data[i];
    an.innerText='['+i+']';
    an.title=i;
    an.href='javascript:iniToggle(\'ini-row-'+idx+'\');';
    head.appendChild(an);
    if(i=='ini_config'){
      divConfig.appendChild(head);
      divConfig.appendChild(row);
      continue;
    }
    index.appendChild(head);
    index.appendChild(row);
  }index.appendChild(divConfig);
  if(parsed.ini_config&&parsed.ini_config['font-size']){
    var css=document.createElement('style');
    css.type='text/css';
    css.textContent='.row-head,.row-head a,.row-data,span.row-comment'
      +'{font-size:'+parsed.ini_config['font-size']+'px;}';
    document.head.appendChild(css);
  }return true;
}
/* initialize */
function init(){
  let index=document.getElementById('index'),
  header=document.getElementById('header');
  if(!index||!header){return false;}
  window.INI_STORAGE=window.INI_STORAGE||{};
  let file=location.hash.substr(1)
    ?location.hash.substr(1):'index.ini';
  header.dataset.text=file;
  if(window.INI_STORAGE[file]){
    return iniParseData(window.INI_STORAGE[file]);
  }
  window.addEventListener('popstate',function(e){
    return init();
  },false);
  return getContent(file+'?r='+Math.random(),function(r){
    window.INI_STORAGE[file]=r;
    return iniParseData(r);
  },function(e){
    index.innerHTML='<div class="error">'+e+'</div>';
  },true);
}
/* get content
 * url = string of url
 * cb  = function of success callback
 * er  = function of error callback
 * txt = bool of text output
 */
function getContent(url,cb,er,txt){
  cb=typeof cb==='function'?cb:function(){};
  er=typeof er==='function'?er:function(){};
  txt=txt===false?false:true;
  var xhr=new XMLHttpRequest();
  xhr.open('GET',url,true);
  xhr.send();
  xhr.onreadystatechange=function(e){
    if(xhr.readyState==4){
      if(xhr.status==200){
        var text=xhr.responseText?xhr.responseText:' ';
        if(txt){return cb(text);}
        var res=false;
        try{res=JSON.parse(text);}catch(e){}
        return cb(res?res:text);
      }else if(xhr.status==0){
        return er('Error: No internet connection.');
      }return er('Error: '+xhr.status+' - '+xhr.statusText+'.');
    }else if(xhr.readyState<4){
      return false;
    }return er('Error: '+xhr.status+' - '+xhr.statusText+'.');
  };return true;
}
/* parse_ini_string.js
 * ~ ini reader
 * authored by 9r3i
 * https://github.com/9r3i
 * started at november 18th 2017
 * update at september 7th 2018
 */
function parse_ini_string(data){
  if(typeof data!=="string"){return;}
  var ex=data.split(/\r\n|\r|\n/g);
  var res={},store='',index='',pin='';
  for(var i in ex){
    if(ex[i]==''&&index==''){continue;}
    else if(ex[i].match(/^;/g)){continue;}
    else if(ex[i].match(/^\[(.*)\]/ig)){
      pin=ex[i].replace(/^\[/ig,'').replace(/\]\s*$/ig,'');
      res[pin]={};
    }else if(ex[i].match(/^.+=\s*/ig)&&index==''){
      var mt=ex[i].match(/^(.+)=\s*"(.*)"\s*$/ig);
      var mi=ex[i].match(/^[^=]+/ig);
      if(mt&&mi){
        index=mi[0].replace(/^\s+|\s+$/ig,'');
        res[pin][index]=mt[0].substr(mi[0].length).replace(/^\s*=\s*"|\s*"\s*$/ig,'');
        index='';
        continue;
      }
      var exi=ex[i].match(/^.+=\s*/ig);
      if(mi){
        index=mi[0].replace(/^\s+|\s+$/ig,'');
      }else{
        index=exi[0].replace(/=\s*$/ig,'').replace(/^\s+|\s+$/ig,'');
      }
      exi=ex[i].replace(/^.+=\s*/ig,'');
      if(exi.match(/^".*"\s*$/ig)){
        res[pin][index]=exi.substr(1).replace(/"\s*$/ig,'');
        index='';
      }else if(exi.match(/^"/ig)){
        store=exi.substr(1)+'\r\n';
      }else{
        if(typeof res[pin]==='undefined'){continue;}
        res[pin][index]=exi.replace(/^\s+|\s+$/ig,'');
        index='';
      }exi=null;
    }else if(ex[i].match(/"\s*$/ig)&&index!==''){
      if(typeof res[pin]==='undefined'){continue;}
      store+=ex[i].replace(/"\s*$/ig,'')+'\r\n';
      res[pin][index]=store;
      store='',index='';
    }else if(index!==''){
      store+=ex[i]+'\r\n';
    }
  }return res;
}
