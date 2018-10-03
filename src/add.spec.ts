import { add } from "./add";
import intern from "intern";

const { suite, test } = intern.getPlugin("interface.tdd");
const { assert } = intern.getPlugin("chai");

suite("Test add(x,y)", () => {
  const tests = [
    {
      x: 1,
      y: 3,
      result: 4,
    },
    {
      x: 4,
      y: 7,
      result: 11,
    },
    {
      x: 5,
      y: 3,
      result: 8,
    },
    {
      x: 1,
      y: 9,
      result: 10,
    },
    {
      x: 25,
      y: 25,
      result: 50,
    },
    {
      x: 25,
      y: 27,
      result: 52,
    },
  ];

  tests.forEach(t => {
    test(`${t.x} + ${t.y} == ${t.result}`, () => {
      const result = add(t.x, t.y);

      assert.equal(result, t.result);
    });
  });
});

// import {describe, it} from 'mocha';
// import {expect} from 'chai';

// describe('Test add(x,y)', () => {
//   const tests = [
//     {
//       x: 1,
//       y: 3,
//       result: 4,
//     },
//     {
//       x: 4,
//       y: 7,
//       result: 11,
//     },
//     {
//       x: 5,
//       y: 3,
//       result: 8,
//     },
//     {
//       x: 1,
//       y: 9,
//       result: 10,
//     }
//   ];

//   tests.forEach(t => {
//     it(`${t.x} + ${t.y} == ${t.result}` , () => {
//       expect(add(t.x, t.y)).to.equal(t.result);
//     });
//   });
// });
