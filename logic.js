export const SCHEMA_VERSION = 2;
export const LEVEL_IDS = Object.freeze([1, 2, 3, 4]);
export const LEVELS = Object.freeze({
  1: Object.freeze({ id:1, title:'レベル1', label:'÷2〜5', description:'割る数2〜5・あまりなし', divisors:[2,3,4,5], remainder:false }),
  2: Object.freeze({ id:2, title:'レベル2', label:'÷6〜9', description:'割る数6〜9・あまりなし', divisors:[6,7,8,9], remainder:false }),
  3: Object.freeze({ id:3, title:'レベル3', label:'あまりなしランダム', description:'割る数2〜9・ランダム', divisors:[2,3,4,5,6,7,8,9], remainder:false }),
  4: Object.freeze({ id:4, title:'レベル4', label:'あまりあり', description:'割る数2〜9・あまりあり', divisors:[2,3,4,5,6,7,8,9], remainder:true })
});

export function divisionQuestion(divisor, quotient, remainder = 0) {
  const d = Number(divisor);
  const q = Number(quotient);
  const r = Number(remainder);
  return {
    dividend: d * q + r,
    divisor: d,
    quotient: q,
    remainder: r,
    key: String(d * q + r) + '/' + String(d)
  };
}

export const question = divisionQuestion;

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function levelQuestions(level, random = Math.random) {
  const config = LEVELS[level];
  if (!config) return [];
  const rows = [];
  for (const divisor of config.divisors) {
    for (let quotient = 1; quotient <= 9; quotient += 1) {
      if (config.remainder) {
        for (let remainder = 1; remainder < divisor; remainder += 1) {
          rows.push(divisionQuestion(divisor, quotient, remainder));
        }
      } else {
        rows.push(divisionQuestion(divisor, quotient, 0));
      }
    }
  }
  return shuffle(rows, random);
}

export function stageQuestions(level, random = Math.random) {
  return levelQuestions(Number(level), random);
}

export function bossQuestions(levels, random = Math.random) {
  const requested = Array.isArray(levels) ? levels : [levels];
  const unique = new Map();
  requested.forEach((level) => {
    levelQuestions(Number(level), random).forEach((q) => unique.set(q.key, q));
  });
  return shuffle([...unique.values()], random);
}

export class QuestionBag {
  constructor(factory) {
    this.factory = factory;
    this.items = [];
    this.lastKey = '';
  }
  next() {
    if (!this.items.length) this.items = this.factory();
    if (!this.items.length) return null;
    if (this.items.length > 1 && this.items[0].key === this.lastKey) {
      const swapAt = this.items.findIndex((item) => item.key !== this.lastKey);
      if (swapAt > 0) [this.items[0], this.items[swapAt]] = [this.items[swapAt], this.items[0]];
    }
    const item = this.items.shift();
    this.lastKey = item.key;
    return item;
  }
}

export function comboAnimation(combo) {
  if (combo >= 10 && combo % 5 === 0) return 'special';
  return 'attack';
}

export function emptyStat() {
  return { attempts:0, correct:0, wrong:0, recentResults:[], lastAskedAt:null, lastWrongAt:null, reviewActive:false, reviewCorrectStreak:0 };
}

export function recordAttempt(state, q, isCorrect, now = new Date().toISOString()) {
  const stat = state.divisionStats[q.key] || emptyStat();
  stat.attempts += 1;
  stat.correct += isCorrect ? 1 : 0;
  stat.wrong += isCorrect ? 0 : 1;
  stat.recentResults = [...stat.recentResults, Boolean(isCorrect)].slice(-10);
  stat.lastAskedAt = now;
  if (!isCorrect) {
    stat.lastWrongAt = now;
    stat.reviewActive = true;
    stat.reviewCorrectStreak = 0;
    if (!state.reviewQueue.includes(q.key)) state.reviewQueue.push(q.key);
  } else if (stat.reviewActive) {
    stat.reviewCorrectStreak += 1;
    if (stat.reviewCorrectStreak >= 2) {
      stat.reviewActive = false;
      state.reviewQueue = state.reviewQueue.filter((key) => key !== q.key);
    }
  }
  state.divisionStats[q.key] = stat;
  state.recentAttempts = [...(state.recentAttempts || []), { key:q.key, correct:Boolean(isCorrect), at:now }].slice(-250);
  return stat;
}

export function parseKey(key) {
  const [dividend, divisor] = String(key).split('/').map(Number);
  const d = Number(divisor);
  const n = Number(dividend);
  const quotient = Math.floor(n / d);
  const remainder = n % d;
  return divisionQuestion(d, quotient, remainder);
}

function keysForLevel(level) {
  return new Set(levelQuestions(level, () => 0.5).map((q) => q.key));
}

export function levelSummary(state, level) {
  const keys = keysForLevel(level);
  const stats = [...keys].map((key) => state.divisionStats[key]).filter(Boolean);
  const attempts = stats.reduce((sum, s) => sum + s.attempts, 0);
  const correct = stats.reduce((sum, s) => sum + s.correct, 0);
  const recent = (state.recentAttempts || []).filter((item) => keys.has(item.key)).slice(-30).map((item) => item.correct);
  const currentRate = recent.length ? Math.round(recent.filter(Boolean).length / recent.length * 100) : 0;
  const weakCount = stats.filter((s) => s.reviewActive).length;
  let grade = { mark:'－', label:'まだデータ不足' };
  if (attempts >= 10) {
    if (currentRate < 70 || weakCount >= 3) grade = { mark:'△', label:'特訓おすすめ' };
    else if (currentRate >= 90 && weakCount === 0) grade = { mark:'◎', label:'とくい' };
    else grade = { mark:'○', label:'もう少し' };
  }
  return { attempts, accuracy:attempts ? Math.round(correct / attempts * 100) : 0, recentRate:currentRate, weakCount, ...grade };
}

export const factorSummary = levelSummary;

export function recommendedKeys(state, limit = 5) {
  return Object.entries(state.divisionStats)
    .filter(([, stat]) => stat.reviewActive)
    .sort(([, a], [, b]) => Number(b.reviewActive) - Number(a.reviewActive) || b.wrong - a.wrong || new Date(b.lastWrongAt || 0) - new Date(a.lastWrongAt || 0))
    .slice(0, limit)
    .map(([key]) => key);
}

export function isBossUnlocked() {
  return true;
}

export function isMaster(state, level) {
  const progress = state.stageProgress[level];
  return Boolean(progress?.cleared && progress?.noMiss);
}

export function defaultState() {
  const stageProgress = {};
  const mastery = {};
  LEVEL_IDS.forEach((level) => {
    stageProgress[level] = { cleared:false, noMiss:false };
    mastery[level] = false;
  });
  return {
    schemaVersion:SCHEMA_VERSION,
    selectedCharacter:'sora',
    trainingPartner:'kai',
    playerLevel:1,
    exp:0,
    supportMode:false,
    stageProgress,
    bossProgress:{ mid1:{defeated:false}, mid2:{defeated:false}, final:{defeated:false} },
    divisionStats:{},
    recentAttempts:[],
    reviewQueue:[],
    mastery,
    bestTimes:{ normal:{}, support:{} },
    maxCombos:{},
    monsterBook:{},
    monsterDefeatCounts:{},
    collections:[],
    settings:{muted:false, volume:0.24},
    adventureReward:{date:'', byLevel:{}},
    trainingExp:{date:'', earned:0}
  };
}

function mergeProgress(base, saved) {
  LEVEL_IDS.forEach((level) => {
    base[level] = { ...base[level], ...(saved?.[level] || {}) };
  });
  return base;
}

export function migrateState(saved) {
  const base = defaultState();
  if (!saved || typeof saved !== 'object') return base;
  const merged = { ...base, ...saved };
  merged.schemaVersion = SCHEMA_VERSION;
  merged.stageProgress = mergeProgress(base.stageProgress, saved.stageProgress);
  merged.bossProgress = {
    mid1:{...base.bossProgress.mid1,...saved.bossProgress?.mid1},
    mid2:{...base.bossProgress.mid2,...saved.bossProgress?.mid2},
    final:{...base.bossProgress.final,...saved.bossProgress?.final}
  };
  merged.settings = { ...base.settings, ...(saved.settings || {}) };
  merged.adventureReward = { ...base.adventureReward, ...(saved.adventureReward || {}), byLevel:{ ...(saved.adventureReward?.byLevel || {}) } };
  merged.divisionStats = saved.divisionStats && typeof saved.divisionStats === 'object' ? saved.divisionStats : {};
  merged.recentAttempts = Array.isArray(saved.recentAttempts) ? saved.recentAttempts.slice(-250) : [];
  merged.reviewQueue = [...new Set((saved.reviewQueue || []).filter((key) => /^\d+\/\d+$/.test(key)))];
  merged.collections = Array.isArray(saved.collections) ? [...new Set(saved.collections)] : [];
  merged.monsterBook = saved.monsterBook && typeof saved.monsterBook === 'object' ? saved.monsterBook : {};
  merged.monsterDefeatCounts = saved.monsterDefeatCounts && typeof saved.monsterDefeatCounts === 'object' ? saved.monsterDefeatCounts : {};
  return merged;
}

export function getStageRewardExp(state, level, baseAmount, today = new Date().toISOString().slice(0,10)) {
  if (state.adventureReward.date !== today) state.adventureReward = { date:today, byLevel:{} };
  const count = Number(state.adventureReward.byLevel[level] || 0);
  const multiplier = [1, 0.75, 0.5, 0.25][Math.min(count, 3)];
  state.adventureReward.byLevel[level] = count + 1;
  return Math.max(3, Math.round(baseAmount * multiplier));
}

export function addExp(state, amount) {
  state.exp = Math.max(0, state.exp + Math.max(0, Number(amount) || 0));
  state.playerLevel = Math.min(100, Math.floor(state.exp / 100) + 1);
  return state.playerLevel;
}

export function trainingSeed(state, type, level = null, preferredKeys = [], random = Math.random) {
  let pool = [];
  if (type === 'stage') {
    pool = levelQuestions(Number(level), random);
  } else {
    const keys = preferredKeys.length ? preferredKeys : state.reviewQueue;
    pool = keys.map(parseKey);
    if (type === 'auto') pool.push(...recommendedKeys(state, 9).map(parseKey));
  }
  if (!pool.length) pool = bossQuestions([1,2,3,4], random);
  const bag = shuffle([...new Map(pool.map((q) => [q.key, q])).values()], random);
  const result = [];
  while (result.length < 10) result.push(...shuffle(bag, random));
  return result.slice(0,10);
}

export class TrainingScheduler {
  constructor(seed, limit = 10) {
    this.queue = [...seed].slice(0,limit);
    this.limit = limit;
    this.index = 0;
  }
  current() { return this.queue[this.index] || null; }
  advance(needsReview = false) {
    const current = this.current();
    this.index += 1;
    if (needsReview && current && this.index < this.limit) {
      const insertAt = Math.min(this.index + 3, this.limit - 1);
      this.queue.splice(insertAt, 0, current);
      this.queue = this.queue.slice(0,this.limit);
    }
    return this.current();
  }
}
