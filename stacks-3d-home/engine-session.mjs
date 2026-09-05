import { apiAmount, decodeOutcome, targetMode } from './engine-contract.mjs';

function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`Invalid ${label} from the server.`);
  return value;
}

export function createEngineSession(href, { required = false, fetcher = globalThis.fetch, timeout = 15000 } = {}) {
  const params = new URL(href).searchParams;
  const publicReplay = params.get('replay') === 'true';
  const enabled = required || publicReplay || params.has('sessionID') || params.has('rgs_url');
  const session = { enabled, publicReplay, locked: enabled, busy: false, balance: 0, currency: '', config: null, round: null };
  let base;

  function endpoint() {
    if (base) return base;
    const value = params.get('rgs_url');
    if (!value) throw new Error('Launch this build from the Stake Engine dashboard.');
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error('Invalid game server URL.');
    base = url.href.replace(/\/$/, '');
    return base;
  }

  async function request(path, body) {
    const url = endpoint() + path;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(url, { method: body ? 'POST' : 'GET', ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}), signal: controller.signal, credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error('The game server could not complete the request. Reconnect before playing again.');
      return await response.json();
    } catch {
      session.locked = true;
      throw new Error('Connection interrupted. Reconnect to check your round; no play request will be retried automatically.');
    } finally { clearTimeout(timer); }
  }

  function authBody() {
    if (publicReplay) throw new Error('Wallet requests are disabled during replay.');
    const sessionID = params.get('sessionID');
    if (!sessionID) throw new Error('Launch this build from the Stake Engine dashboard.');
    return { sessionID };
  }

  function wallet(balance) {
    session.balance = integer(balance?.amount, 'balance');
    if (typeof balance?.currency !== 'string' || !/^[A-Z0-9]{2,10}$/.test(balance.currency)) throw new Error('Invalid currency from the server.');
    session.currency = balance.currency;
  }

  function roundData(round, fallbackAmount) {
    const outcome = decodeOutcome(round.state, round.mode);
    const amount = integer(round.amount ?? fallbackAmount, 'round amount', 1);
    const expected = BigInt(amount) * BigInt(outcome.payoutUnits) / 100n;
    if (expected > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Round payout is too large.');
    const payout = integer(round.payout ?? Number(expected), 'round payout');
    if (payout !== Number(expected) || typeof round.active !== 'boolean') throw new Error('Unexpected round settlement data.');
    return { amount, payout, outcome, active: round.active, mode: round.mode, betID: round.betID };
  }

  session.authenticate = async () => {
    if (session.busy) return null;
    session.busy = true; session.locked = true;
    try {
      const response = await request('/wallet/authenticate', authBody());
      wallet(response.balance);
      const config = response.config;
      const minBet = integer(config?.minBet, 'minimum play', 1);
      const maxBet = integer(config?.maxBet, 'maximum play', minBet);
      const stepBet = integer(config?.stepBet, 'play increment', 1);
      const betLevels = [...new Set([minBet, ...(config.betLevels || []), maxBet])].map(value => integer(value, 'play level', minBet)).filter(value => value <= maxBet).sort((a, b) => a - b);
      session.config = { ...config, minBet, maxBet, stepBet, betLevels };
      session.round = response.round?.active ? roundData(response.round) : null;
      session.locked = false;
      return session.round;
    } finally { session.busy = false; }
  };

  session.validateAmount = text => {
    const amount = apiAmount(text), config = session.config;
    if (!config || amount < config.minBet || amount > config.maxBet || amount % config.stepBet !== 0) throw new RangeError('Choose an allowed play amount within the server limits.');
    if (amount > session.balance) throw new RangeError('The play amount exceeds your balance.');
    return amount;
  };

  session.play = async (text, targetUnits) => {
    if (publicReplay || session.locked || session.busy || session.round) throw new Error('This session is not ready for a new round.');
    const amount = session.validateAmount(text), mode = targetMode(targetUnits);
    session.busy = true;
    try {
      const response = await request('/wallet/play', { ...authBody(), amount, mode });
      wallet(response.balance);
      if (response.round?.mode !== mode) throw new Error('The server returned a different target.');
      session.round = roundData(response.round, amount);
      return session.round;
    } catch (error) { session.locked = true; throw error; }
    finally { session.busy = false; }
  };

  session.finish = async () => {
    if (publicReplay || session.busy || !session.round) throw new Error('No round is ready to settle.');
    session.busy = true;
    try {
      if (session.round.active) {
        const response = await request('/wallet/end-round', authBody());
        wallet(response.balance);
        session.round.active = false;
      }
      return session.balance;
    } catch (error) { session.locked = true; throw error; }
    finally { session.busy = false; }
  };

  session.loadReplay = async () => {
    if (!publicReplay) throw new Error('Not a replay launch.');
    const parts = ['game', 'version', 'mode', 'event'].map(key => {
      const value = params.get(key);
      if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error('The replay link is incomplete.');
      return encodeURIComponent(value);
    });
    session.busy = true;
    try {
      const response = await request('/bet/replay/' + parts.join('/'));
      const outcome = decodeOutcome(response.state, params.get('mode'));
      const amount = params.has('amount') ? integer(Number(params.get('amount')), 'replay amount', 1) : 1000000;
      if (response.costMultiplier !== 1 || response.payoutMultiplier !== outcome.payoutUnits / 100) throw new Error('Replay payout does not match the recorded target.');
      const payout = BigInt(amount) * BigInt(outcome.payoutUnits) / 100n;
      if (payout > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Replay amount is too large.');
      session.currency = /^[A-Z0-9]{2,10}$/.test(params.get('currency') || '') ? params.get('currency') : '';
      return { amount, payout: Number(payout), outcome, active: false, mode: params.get('mode') };
    } finally { session.busy = false; }
  };

  return session;
}
