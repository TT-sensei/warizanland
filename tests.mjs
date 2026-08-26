import assert from 'node:assert/strict';
import {
  defaultState, stageQuestions, getStageRewardExp, bossQuestions, comboAnimation,
  divisionQuestion, recordAttempt, TrainingScheduler, migrateState, isMaster
} from './logic.js';

const level1=stageQuestions(1);
assert.ok(level1.length===36);
assert.ok(level1.every((q)=>q.divisor>=2 && q.divisor<=5 && q.remainder===0 && q.dividend===q.divisor*q.quotient));
const level2=stageQuestions(2);
assert.ok(level2.every((q)=>q.divisor>=6 && q.divisor<=9 && q.remainder===0));
const level3=stageQuestions(3);
assert.ok(level3.every((q)=>q.divisor>=2 && q.divisor<=9 && q.remainder===0));
const level4=stageQuestions(4);
assert.ok(level4.every((q)=>q.remainder>0 && q.remainder<q.divisor && q.dividend===q.divisor*q.quotient+q.remainder));
assert.ok(bossQuestions([1,2]).every((q)=>q.remainder===0 && q.divisor>=2 && q.divisor<=9));
assert.ok(bossQuestions([4]).every((q)=>q.remainder>0));

for (const n of [10,15,20,25,30]) assert.equal(comboAnimation(n),'special');
for (const n of [1,2,3,4,5,6,7,8,9,11,12,13,14]) assert.equal(comboAnimation(n),'attack');

const rewardState=defaultState();
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),20);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),15);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),10);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),5);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-26'),20);

const state=defaultState();
const q=divisionQuestion(3,6,0);
recordAttempt(state,q,false,'2026-01-01T00:00:00Z');
assert.deepEqual(state.reviewQueue,['18/3']);
const filler=[divisionQuestion(2,2),divisionQuestion(4,4),divisionQuestion(5,5),divisionQuestion(6,6),divisionQuestion(7,7),divisionQuestion(8,8),divisionQuestion(9,9),divisionQuestion(2,3),divisionQuestion(3,4)];
const scheduler=new TrainingScheduler([q,...filler]);
assert.equal(scheduler.current().key,'18/3');
scheduler.advance(true);
assert.notEqual(scheduler.current().key,'18/3');
scheduler.advance(); scheduler.advance(); scheduler.advance();
assert.equal(scheduler.current().key,'18/3');
recordAttempt(state,q,true,'2026-01-01T00:01:00Z');
assert.equal(state.divisionStats['18/3'].reviewActive,true);
recordAttempt(state,q,true,'2026-01-01T00:02:00Z');
assert.equal(state.divisionStats['18/3'].reviewActive,false);
assert.deepEqual(state.reviewQueue,[]);

state.stageProgress[1].cleared=true;
state.stageProgress[1].noMiss=true;
assert.equal(isMaster(state,1),true);
const restored=migrateState(JSON.parse(JSON.stringify({...state,playerLevel:12,collections:['dragon']})));
assert.equal(restored.playerLevel,12);
assert.deepEqual(restored.collections,['dragon']);
assert.equal(restored.divisionStats['18/3'].wrong,1);
console.log('All division levels, remainder questions, SPECIAL, reviewQueue and persistence tests passed.');
