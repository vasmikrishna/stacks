const colors={loss:'#ff6570',regular:'#9ba7b2',win:'#64e58c',high:'#ffda65'};

export function resultColor(value){
 if(value<1)return colors.loss;
 if(value>=10)return colors.high;
 if(value>=2)return colors.win;
 return colors.regular;
}

export function recentRows(values){
 return values.slice(0,5).map((value,index)=>({
  value,
  label:value.toFixed(2)+'x',
  color:resultColor(value),
  latest:index===0,
 }));
}

export function createRecentResults(stage){
 const root=document.createElement('aside');
 root.className='recent-results empty';
 root.setAttribute('aria-label','Recent round results');
 root.innerHTML='<div class="recent-title">Recent</div><ol class="recent-values"></ol>';
 stage.append(root);
 const list=root.querySelector('ol');

 function render(values){
  const rows=recentRows(values);
  root.hidden=!rows.length;
  list.innerHTML=rows.map(row=>{
   return `<li${row.latest?' class="latest"':''} style="--result-color:${row.color}"><i aria-hidden="true"></i><span>${row.label}</span></li>`;
  }).join('');
 }

 render([]);
 return {render};
}
