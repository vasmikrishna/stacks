import test from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_COUNT, SUPPORTED_TARGETS, nearestTarget, targetMode, modeCost, modeTarget, samplesAtLeast, modeBooks, apiAmount, amountText, decodeOutcome } from './engine-contract.mjs';
import { GAME_MODES, boostedPayoutUnits, modeRevealUnits } from './game-modes.mjs';
import { winProbability } from './math.mjs';
import { createEngineSession } from './engine-session.mjs';

test('all supported targets preserve exact total weight, win odds and payouts', () => {
  for (const target of SUPPORTED_TARGETS) {
    const rows = modeBooks(target);
    let total = 0n, wins = 0n;
    for (const { book, weight } of rows) {
      assert(weight > 0n);
      total += weight;
      if (book.payoutMultiplier) wins += weight;
      assert.equal(book.payoutMultiplier, book.events[0].resultUnits >= target ? target : 0);
      assert.equal(book.events[1].amount, book.payoutMultiplier);
    }
    assert.equal(total, SAMPLE_COUNT);
    assert.equal(wins, samplesAtLeast(target));
    assert.equal(Number(wins) / Number(total), winProbability(target));
    assert.equal(modeTarget(targetMode(target)), target);
  }
});

test('every boosted mode has one reveal, correct payout, matching demo odds and 96.5% RTP', () => {
  for (const mode of GAME_MODES) for (const target of SUPPORTED_TARGETS) {
    const rows=modeBooks(target,mode.id),name=targetMode(target,mode.id);
    const total=rows.reduce((sum,row)=>sum+row.weight,0n);
    const wins=rows.filter(row=>row.book.payoutMultiplier).reduce((sum,row)=>sum+row.weight,0n);
    const units=boostedPayoutUnits(target,mode.id);
    assert.equal(total,SAMPLE_COUNT);
    assert.equal(wins,samplesAtLeast(units));
    assert.ok(Math.abs(Number(wins)/Number(total)*units-96.5)<0.00001);
    assert.equal(modeCost(name),1);
    assert.equal(modeRevealUnits(Number(wins-1n),mode.id)>=target,true);
    assert.equal(modeRevealUnits(Number(wins),mode.id)<target,true);
    for (const {book} of rows) {
      const outcome=decodeOutcome(book.events,name);
      assert.equal(outcome.modeId,mode.id);
      assert.equal(outcome.payoutUnits,book.payoutMultiplier);
      assert.equal(book.events.filter(event=>event.type==='stacksReveal').length,1);
      assert.ok(outcome.resultUnits<=3900);
      assert.equal(outcome.resultUnits,modeRevealUnits(outcome.visualSeed,mode.id));
    }
  }
  const book=modeBooks(250,'reactor')[0].book;
  assert.throws(()=>decodeOutcome(book.events,'prism_target_250'),/game mode/);
  assert.throws(()=>modeTarget('second_chance_250'));
});

test('classic mode schedule satisfies Engine base volatility, hit-rate and 40x tail limits', () => {
  for (const target of SUPPORTED_TARGETS) {
    const probability = Number(samplesAtLeast(target)) / Number(SAMPLE_COUNT);
    const mean = probability * target / 100;
    const standardDeviation = Math.sqrt(probability * (target / 100) ** 2 - mean ** 2);
    assert.ok(standardDeviation >= 0.6, `${target / 100}x standard deviation ${standardDeviation} must be at least 0.6`);
  }
  assert.ok(SUPPORTED_TARGETS.every(target => Number(SAMPLE_COUNT) / Number(samplesAtLeast(target)) <= 50));
  assert.ok(SUPPORTED_TARGETS.every(target => target < 4000));
});

test('representative books preserve stage odds, cap, and exact target ties', () => {
  for (const target of [150, 250, 300, 700, 2500, 3900]) {
    const rows = modeBooks(target);
    for (const threshold of [100, 150, 300, 700, 2500, 3900]) {
      assert.equal(rows.filter(row => row.book.events[0].resultUnits >= threshold).reduce((sum, row) => sum + row.weight, 0n), samplesAtLeast(threshold));
    }
    assert.equal(rows[0].book.events[0].resultUnits, 3900);
    assert.equal(decodeOutcome(rows[0].book.events, targetMode(target)).payoutUnits, target);
  }
  assert.throws(() => targetMode(100));
  assert.throws(() => targetMode(100001));
  assert.throws(() => targetMode(579));
  assert.equal(nearestTarget(579), 500);
  assert.throws(() => modeTarget('target_0250'));
  assert.throws(() => decodeOutcome([], 'target_250'));
});

test('RGS money preserves six decimal places without floating point parsing', () => {
  for (const text of ['0.000001', '0.1', '1.01', '100', '9876.54321']) assert.equal(apiAmount(amountText(apiAmount(text))), apiAmount(text));
  assert.equal(apiAmount('1.000001'), 1000001);
  for (const text of ['0', '-1', 'NaN', '1e6', '1.0000001', '9007199254740992']) assert.throws(() => apiAmount(text));
});

function server({ active = true, failure = null, resume = false } = {}) {
  const calls = [];
  const book = modeBooks(250)[0].book;
  const round = { amount: 1000000, payout: 2500000, active, mode: 'target_250', state: book.events, betID: 7 };
  const fetcher = async (url, options) => {
    const body = options.body && JSON.parse(options.body);
    calls.push({ url, body });
    if (failure && url.endsWith(failure)) throw new Error('private network details');
    const payload = url.endsWith('/authenticate') ? { balance: { amount: 10000000, currency: 'USD' }, config: { minBet: 100000, maxBet: 100000000, stepBet: 100000, defaultBetLevel: 1000000, betLevels: [100000, 1000000] }, round: resume ? round : null }
      : url.endsWith('/play') ? { balance: { amount: 9000000, currency: 'USD' }, round }
      : url.includes('/bet/replay/') ? { payoutMultiplier: 2.5, costMultiplier: 1, state: book.events }
      : { balance: { amount: 11500000, currency: 'USD' } };
    return { ok: true, json: async () => payload };
  };
  return { fetcher, calls };
}

test('Engine authenticates, uses selected target mode and only server balances', async () => {
  const mock = server();
  const session = createEngineSession('https://game.test/?sessionID=test&rgs_url=rgs.test', mock);
  await session.authenticate();
  const round = await session.play('1', 250);
  assert.equal(round.outcome.targetUnits, 250);
  assert.equal(session.balance, 9000000);
  assert.deepEqual(mock.calls[1].body, { sessionID: 'test', amount: 1000000, mode: 'target_250' });
  await assert.rejects(session.play('1', 250));
  assert.equal(await session.finish(), 11500000);
  assert.equal(mock.calls.length, 3);
});

test('boosted Engine play charges one stake and settles the boosted payout', async () => {
  for(const mode of GAME_MODES) {
    const calls=[],book=modeBooks(250,mode.id)[0].book,units=250*mode.boost;
    const name=targetMode(250,mode.id);
    const fetcher=async (url,options)=>{
      const body=options.body&&JSON.parse(options.body);calls.push({url,body});
      const payload=url.endsWith('/authenticate')
        ? {balance:{amount:1000000,currency:'USD'},config:{minBet:100000,maxBet:2000000,stepBet:100000,betLevels:[1000000]}}
        : url.endsWith('/play') ? {balance:{amount:0,currency:'USD'},round:{amount:1000000,payout:units*10000,active:true,mode:name,state:book.events,betID:9}}
        : {balance:{amount:units*10000,currency:'USD'}};
      return {ok:true,json:async()=>payload};
    };
    const session=createEngineSession('https://game.test/?sessionID=t&rgs_url=rgs.test',{fetcher});
    await session.authenticate();
    const round=await session.play('1',250,{modeId:mode.id});
    assert.equal(round.outcome.modeId,mode.id);
    assert.deepEqual(calls[1].body,{sessionID:'t',amount:1000000,mode:name});
    assert.equal(await session.finish(),units*10000);
  }
});

test('inactive rounds do not call end-round; active rounds resume without play', async () => {
  const mock = server({ active: false });
  const session = createEngineSession('https://game.test/?sessionID=t&rgs_url=rgs.test', mock);
  await session.authenticate(); await session.play('1', 250); await session.finish();
  assert.equal(mock.calls.length, 2);
  const resumed = server({ resume: true });
  const other = createEngineSession('https://game.test/?sessionID=t&rgs_url=rgs.test', resumed);
  assert.equal((await other.authenticate()).amount, 1000000);
  assert.equal(resumed.calls.length, 1);
});

test('ambiguous play errors lock controls and never retry a money operation', async () => {
  const mock = server({ failure: '/play' });
  const session = createEngineSession('https://game.test/?sessionID=t&rgs_url=rgs.test', mock);
  await session.authenticate();
  await assert.rejects(session.play('1', 250), /Reconnect/);
  await assert.rejects(session.play('1', 250), /not ready/);
  assert.equal(session.locked, true);
  assert.equal(mock.calls.length, 2);
});

test('boosted public replays preserve payout and cannot mutate wallets', async () => {
  for (const modeId of ['prism', 'tesseract', 'reactor']) {
    const book = modeBooks(250, modeId).find(row => row.book.payoutMultiplier).book;
    const calls = [];
    const session = createEngineSession(`https://game.test/?replay=true&rgs_url=rgs.test&game=stacks&version=4&mode=${targetMode(250, modeId)}&event=${book.id}&amount=1000000`, {
      fetcher: async url => {
        calls.push(url);
        return { ok: true, json: async () => ({ costMultiplier: 1, payoutMultiplier: book.payoutMultiplier / 100, state: book.events }) };
      },
    });
    const round = await session.loadReplay();
    assert.equal(round.outcome.modeId, modeId);
    assert.equal(round.payout, book.payoutMultiplier * 10000);
    await assert.rejects(session.play('1', 250, { modeId }));
    assert.equal(calls.length, 1);
  }
});

test('public replays never authenticate or place plays; builds fail closed without launch parameters', async () => {
  const mock = server();
  const session = createEngineSession('https://game.test/?replay=true&rgs_url=rgs.test&game=stacks&version=1&mode=target_250&event=0&amount=1000000', mock);
  const round = await session.loadReplay();
  assert.equal(round.payout, 2500000);
  await assert.rejects(session.authenticate());
  await assert.rejects(session.play('1', 250));
  assert.equal(mock.calls.length, 1);
  const missing = createEngineSession('https://game.test/', { ...mock, required: true });
  await assert.rejects(missing.authenticate(), /Launch this build/);
  assert.equal(missing.locked, true);
  assert.equal(mock.calls.length, 1);
});
