// Isolated visual test server. It injects deterministic controls into responses only.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=__dirname;
const hook=`
 const originalPreviewAnimate=animate;
 let previewTime=null;
 animate=(now)=>{if(previewTime!==null){last=previewTime-16;originalPreviewAnimate(previewTime);}else originalPreviewAnimate(now);};
 const previewTools=document.createElement('div');
 previewTools.style.cssText='position:fixed;top:0;left:210px;z-index:99;display:flex;gap:4px;background:#080c12';
 previewTools.innerHTML='<button>Standard</button><button>Stack</button><button>Double</button><button>Super</button><button>Legendary</button><input aria-label="Animation time" type="range" min="0" max="4500" step="50" value="1100">';
 document.body.append(previewTools);
 function previewWin(target){
  clearTimeout(nextRound);state.auto=false;state.motion=true;state.bet=10000;state.target=target;state.phase='running';
  rebuild(28);cameraHeight=6.02;settle(true,Math.max(3.5,target));
  previewTime=state.ended+Number(previewTools.querySelector('input').value);
  winAnimation?.pause();if(winAnimation)winAnimation.currentTime=800;
 }
 previewTools.querySelectorAll('button').forEach((button,i)=>button.onclick=()=>previewWin([1.2,1.5,3,7,25][i]));
 previewTools.querySelector('input').oninput=e=>{previewTime=state.ended+Number(e.target.value);};
 action.addEventListener('click',()=>{previewTime=null;},{capture:true});
 state.history=[2.96,1.08,12.60,3.84,.73].map((at,index)=>({at,target:2.5,bet:10000,payout:index===4?0:25000,won:index!==4}));
 renderRoundHistory();
`;
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.wasm':'application/wasm'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  let data=await fs.readFile(file);
  if(file===path.join(root,'main.js'))data=Buffer.from(data.toString()+hook);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end();}
}).listen(0,'127.0.0.1',function(){console.log('Win preview: http://127.0.0.1:'+this.address().port);});
