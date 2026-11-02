import assert from 'node:assert/strict';
import {proposalDefaults,validateProposal,brandInk} from './branding.mjs';
import {defaults,validate} from './geometry.mjs';
import {snapshotBase} from './share.mjs';
const p=proposalDefaults();validateProposal(p);assert.equal(p.appendix,false);assert.equal(p.budget,'');assert.equal(brandInk('#ffffff'),25);assert.equal(brandInk('#000000'),255);
assert.throws(()=>validateProposal({...p,budget:'-10'}));assert.throws(()=>validateProposal({...p,colour:'red'}));assert.throws(()=>validateProposal({...p,objectives:'x'.repeat(3001)}));assert.throws(()=>validateProposal({...p,logo:{data:'https://example.com/logo.png',width:100,height:100}}));
const s={...defaults(),proposal:{...p,company:'Northline Demo',budget:'25000.50',objectives:'Present the product range.'}};validate(s);assert.deepEqual(validate(JSON.parse(JSON.stringify(s))).proposal,s.proposal);assert.equal(snapshotBase(s).proposal,undefined);console.log('Branding validation, budget, contrast, project persistence and snapshot privacy checks passed.');
