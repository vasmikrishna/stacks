const { chromium } = require('/Users/vamsikrishnavh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(()=>localStorage.setItem('stacks:intro-seen:v1','1'));
  await page.route('**/main.js*', async route => {
   const response = await route.fetch();
   await route.fulfill({ response, body: await response.text() + `
    window.visualPreview=(kind)=>{
      clearCelebration();
      state.bet=10000;state.target=25;state.roundId=999;state.phase='running';state.started=performance.now();state.speed=0;state.breakAt=1000;
      if(kind==='bonus'){state.phase='idle';state.bonus=2;rebuild(21);message.textContent='Double Stack';}
      if(kind==='win'){rebuild(28);settle(true,56.21);}
      if(kind==='break'){rebuild(15);settle(false,3.42);}
    };
    window.visualBounds=()=>({count:visibleCount,rot:turntable.rotation.y,visible:blocks.filter(b=>b.visible).map(b=>b.getWorldPosition(new THREE.Vector3()).project(camera).toArray())});
    window.celebrationCount=()=>celebration.visible?confetti.filter(p=>p.visible).length:0;
   ` });
  });
  await page.goto('http://127.0.0.1:4175'); await page.waitForSelector('canvas');
  const brightCanvasPixels = () => page.locator('canvas').evaluate(c => {
   const gl=c.getContext('webgl2'),p=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);
   let bright=0;for(let i=0;i<p.length;i+=4)if(Math.max(p[i],p[i+1],p[i+2])>90)bright++;return bright;
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: __dirname + '/crystal-desktop.png' });
  assert(await brightCanvasPixels()>80,'Idle canvas is not blank');
  await page.evaluate(()=>window.visualPreview('bonus'));await page.waitForTimeout(1500);
  assert(await brightCanvasPixels()>2000,'Visible illuminated crystal geometry');
  await page.screenshot({ path: __dirname + '/crystal-bonus.png' });
  for(const [x,y] of (await page.evaluate(()=>window.visualBounds())).visible)assert(Math.abs(x)<.94&&Math.abs(y)<.94,'Tower within camera frame');
  await page.evaluate(()=>window.visualPreview('win'));await page.waitForTimeout(450);
  assert(await page.evaluate(()=>window.celebrationCount())>0,'Win celebration effect');
  await page.screenshot({ path: __dirname + '/crystal-win.png' });
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.visualPreview('bonus'));await page.waitForTimeout(1200);
  await page.screenshot({path:__dirname+'/crystal-mobile.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  for(const [x,y] of (await page.evaluate(()=>window.visualBounds())).visible)assert(Math.abs(x)<.94&&Math.abs(y)<.94,'Mobile tower within camera frame');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>window.visualPreview('win'));
  assert.equal(await page.locator('.score-burst span').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: illuminated canvas pixels, full tower framing, win celebration, desktop/mobile screenshots, reduced motion and no runtime errors.');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
