const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const playwrightPath = process.env.PLAYWRIGHT_MODULE || '/Users/vamsikrishnavh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(playwrightPath);

(async () => {
  const root = path.resolve(process.argv[2] || 'output/stacks-engine-qa/frontend');
  const evidence = path.join(path.dirname(root), 'browser-verification');
  fs.mkdirSync(evidence, { recursive: true });
  const { modeBooks, modeDetails, targetMode } = await import(pathToFileURL(path.resolve('stacks-3d-home/engine-contract.mjs')));
  const failures = [], requests = [], calls = [];
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg' };
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); requests.push(pathname); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  let activeRound = null, balance = 10000000, failPlay = false;
  const config = { minBet: 100000, maxBet: 100000000, stepBet: 100000, defaultBetLevel: 1000000, betLevels: [100000, 500000, 1000000, 5000000], jurisdiction: {} };
  function round(target, amount, win = true, modeId = 'classic') {
    const rows = modeBooks(target, modeId);
    const book = (win ? [...rows].reverse().find(row => row.book.payoutMultiplier) : rows.find(row => !row.book.payoutMultiplier)).book;
    return { betID: 123, mode: targetMode(target, modeId), amount, payout: Number(BigInt(amount) * BigInt(book.payoutMultiplier) / 100n), active: win, state: book.events };
  }
  async function pageFor(viewport) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => failures.push(error.message));
    await page.addInitScript(() => localStorage.setItem('stacks:intro-seen:v1', '1'));
    // Software WebGL shader compilation can block the first mocked response.
    await page.route('**/engine-session.mjs*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace('timeout = 15000', 'timeout = 120000') });
    });
    await page.route('**/main.js*', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nrenderer.setPixelRatio(.5); renderer.transmissionResolutionScale=.3; renderer.shadowMap.enabled=false; resize(); window.engineInspect=()=>({phase:state.phase,balance:state.balance,history:state.history.length,replay:Boolean(state.replay),target:state.target});' });
    });
    await page.route('https://rgs.test/**', async route => {
      const endpoint = new URL(route.request().url()).pathname;
      const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null;
      calls.push({ endpoint, body });
      let response;
      if (endpoint.endsWith('/authenticate')) response = { balance: { amount: balance, currency: 'USD' }, config, round: activeRound };
      else if (endpoint.endsWith('/play')) {
        if (failPlay) { await route.abort('failed'); return; }
        const { targetUnits: target, modeId } = modeDetails(body.mode);
        activeRound = round(target, body.amount, target !== 1000, modeId);
        balance -= body.amount;
        response = { balance: { amount: balance, currency: 'USD' }, round: activeRound };
      } else if (endpoint.endsWith('/end-round')) {
        balance += activeRound.payout; activeRound.active = false;
        response = { balance: { amount: balance, currency: 'USD' } };
      } else if (endpoint.includes('/bet/replay/')) {
        const replay = round(250, 1000000);
        response = { costMultiplier: 1, payoutMultiplier: 2.5, state: replay.state };
      } else throw new Error('Unexpected RGS route: ' + endpoint);
      await route.fulfill({ json: response });
    });
    return page;
  }
  const waitReady = async page => {
    try { await page.waitForSelector('#gameLoader[hidden]', { state: 'attached', timeout: 60000 }); }
    catch (error) { throw new Error(`Frontend did not become ready: ${failures.join('; ') || error.message}`); }
    await page.waitForFunction(() => typeof window.engineInspect === 'function', null, { timeout: 60000 });
  };
  const start = async page => {
    await page.locator('.play-button').click();
    await page.waitForFunction(() => ['won', 'broken'].includes(window.engineInspect().phase), { polling: 100 }, { timeout: 25000 });
  };
  try {
    const desktop = await pageFor({ width: 1440, height: 900 });
    await desktop.goto(url + '/?sessionID=mock&rgs_url=rgs.test'); await waitReady(desktop);
    assert.equal(await desktop.locator('#prediction').getAttribute('step'), '0.01');
    assert.equal(await desktop.locator('#prediction').getAttribute('min'), '1.50');
    assert.equal(await desktop.locator('#prediction').getAttribute('max'), '39');
    await desktop.waitForFunction(() => document.querySelector('#bet').min === '0.1' || !document.querySelector('.engine-notice').hidden);
    assert.equal(await desktop.locator('#bet').getAttribute('min'), '0.1', await desktop.locator('.engine-notice').textContent());
    await desktop.locator('#prediction').fill('2.40');
    await desktop.locator('#prediction').press('Tab');
    assert.equal(await desktop.locator('#prediction').inputValue(), '2.50');
    await desktop.locator('#bonusMode').click();
    await desktop.locator('#modeDialog [data-mode="prism"]').click();
    assert.equal(await desktop.locator('#modalPayout').textContent(), '5.00 (5.00x)');
    assert.equal(await desktop.locator('body').getAttribute('data-mode'), 'classic');
    await desktop.locator('#modeDialog').press('Escape');
    assert.equal(await desktop.locator('#bonusMode').getAttribute('data-mode'), 'classic');
    assert.equal(calls.filter(call => call.endpoint.endsWith('/play')).length, 0);
    await desktop.locator('#turbo').click();
    await start(desktop);
    assert.equal((await desktop.evaluate(() => window.engineInspect())).balance, 1150);
    assert.equal(calls.filter(call => call.endpoint.endsWith('/end-round')).length, 1);
    await desktop.screenshot({ path: path.join(evidence, 'desktop-win.png') });
    const canvas = await desktop.locator('#stack-scene canvas').evaluate(c => {
      const gl = c.getContext('webgl2'), pixels = new Uint8Array(c.width * c.height * 4);
      gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return { pixels: pixels.filter((value, index) => index % 4 === 3 && value > 0).length, width: c.width, height: c.height };
    });
    assert(canvas.pixels > 1000, '3D canvas must be nonblank');
    await desktop.locator('#prediction').fill('17.43');
    assert.equal(await desktop.locator('#prediction').inputValue(), '17.43');
    await desktop.locator('#prediction').fill('10.00'); await start(desktop);
    assert.equal(calls.filter(call => call.endpoint.endsWith('/play')).at(-1).body.mode, 'target_1000');
    assert.equal(calls.filter(call => call.endpoint.endsWith('/end-round')).length, 1, 'Auto-closed losses must not call end-round');
    for (const modeId of ['prism', 'tesseract', 'reactor']) {
      await desktop.locator("#bonusMode").click();
      await desktop.locator(`#modeDialog [data-mode="${modeId}"]`).click();
      await desktop.locator("#confirmMode").click();
      await desktop.locator('#prediction').fill('2.50');
      const before = balance;
      await start(desktop);
      assert.equal(activeRound.mode, targetMode(250, modeId));
      assert.equal(balance, before - activeRound.amount + activeRound.payout);
      await desktop.locator('#prediction').fill('10.00');
      const ends = calls.filter(call => call.endpoint.endsWith('/end-round')).length;
      await start(desktop);
      assert.equal(activeRound.payout, 0);
      assert.equal(calls.filter(call => call.endpoint.endsWith('/end-round')).length, ends);
    }
    const count = calls.length;
    failPlay = true;
    await desktop.locator('.play-button').click();
    await desktop.locator('.engine-notice').waitFor({ state: 'visible' });
    assert.equal(await desktop.locator('.play-button').isDisabled(), true);
    assert.equal(calls.length, count + 1, 'No automatic retries');
    failPlay = false;
    await desktop.locator('.engine-notice button').click();
    await desktop.waitForFunction(() => !document.querySelector('.play-button').disabled);
    assert.equal(calls.at(-1).endpoint, '/wallet/authenticate');
    activeRound = round(250, 1000000, true, 'reactor'); balance -= 1000000;
    const playsBeforeResume = calls.filter(call => call.endpoint.endsWith('/play')).length;
    await desktop.reload(); await waitReady(desktop);
    await desktop.waitForFunction(() => window.engineInspect().phase === 'won', null, { timeout: 25000 });
    assert.equal(calls.filter(call => call.endpoint.endsWith('/play')).length, playsBeforeResume);
    const mobile = await pageFor({ width: 390, height: 844 });
    await mobile.goto(url + '/?sessionID=mock&rgs_url=rgs.test'); await waitReady(mobile);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const mobilePixels=await mobile.locator('#stack-scene canvas').evaluate(c=>{const gl=c.getContext('webgl2'),p=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);return p.filter((v,i)=>i%4===3&&v>0).length;});
    assert(mobilePixels>1000,'Mobile idle canvas must be nonblank');
    await mobile.screenshot({ path: path.join(evidence, 'mobile-ready.png') });
    await mobile.locator('#bonusMode').click();
    await mobile.locator('#modeDialog [data-mode="prism"]').click();
    await mobile.screenshot({ path: path.join(evidence, 'mobile-modal.png') });
    assert.equal(await mobile.locator('#modeDialog').evaluate(el => el.scrollWidth <= el.clientWidth), true);
    await mobile.locator('#confirmMode').click();
    assert.equal(await mobile.locator('#bonusMode').getAttribute('data-mode'), 'prism');
    await desktop.close(); await mobile.close();
    const replay = await pageFor({ width: 1280, height: 800 });
    const beforeReplay = calls.length;
    await replay.goto(url + '/?replay=true&game=stacks&version=1&mode=target_250&event=0&amount=1000000&rgs_url=rgs.test&currency=USD'); await waitReady(replay);
    await start(replay);
    assert(calls.slice(beforeReplay).every(call => call.endpoint.startsWith('/bet/replay/')), 'Public replay must never call a wallet');
    assert.equal(await replay.locator('.play-button .action-label').textContent(), 'Play Again');
    assert.equal(await replay.locator('#bet').isDisabled(), true);
    await replay.close();
    const missing = await pageFor({ width: 800, height: 600 });
    await missing.goto(url); await waitReady(missing);
    assert.equal(await missing.locator('.play-button').isDisabled(), true);
    assert.match(await missing.locator('.engine-notice').textContent(), /Launch this build/);
    assert.deepEqual(failures, []);
    assert.deepEqual(requests.filter(value => value !== '/favicon.ico'), []);
    const report = { passed: true, checks: ['smooth 0.01x local control', '1.50x to 39x compliant prediction range', 'RGS amount limits', 'authoritative win balance', 'all four mode win and loss settlements', 'boosted active-round resume', 'auto-closed loss', 'no mutation retries', 'active-round resume', 'public replay isolation', 'missing-launch failure', 'desktop canvas pixels', 'mobile overflow', 'asset loads'], canvas, requestCounts: { authenticate: calls.filter(call => call.endpoint.endsWith('/authenticate')).length, play: calls.filter(call => call.endpoint.endsWith('/play')).length, endRound: calls.filter(call => call.endpoint.endsWith('/end-round')).length }, realRgsTested: false };
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
