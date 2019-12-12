
/**
 * 
 * Test the rating functions
 * 
 * To make the test reusable, I have re-created the same functions in JS
 * 
 * Deploy a contract and call the function compute() with a known input
 * 
 */
const SimpleAvg = artifacts.require("SimpleAvarageFunction");
const BlockAvg = artifacts.require("WeightedAverageFunction");
const SkillAvg = artifacts.require("WeightedAverageSkillFunction");
const BlockSkillAvg = artifacts.require("BlocksAndSkillsWeightFunction");

const simpleAvgJS = array => Math.floor(array.reduce((a,b) => a + b, 0) / array.length);

function weightedOnBlocksJS(scores, blocks) {

    const len = scores.length;
    const last = blocks[len-1];

    // Weighted average w.r.t. blocks
    let weightedScore = 0;
    let weightSum = 0;

    for (let i=0; i<len; i++) {

        let s = scores[i];
        let b = blocks[i];
        let weight = Math.floor((b*100)/last);

        weightedScore += s * weight;
        weightSum += weight;
    }

    if (weightSum == 0 || weightedScore == 0)
        return 0;

    return Math.floor(weightedScore / weightSum);    
}

function weightedOnSkillsJS(scores, skills) {

    const len = scores.length;

    // Weighted average based on skill values 
    let totalWeight = 0;
    let totalValues = 0;        

    for (let i=0; i<len; i++){
        totalValues += skills[i];
        totalWeight += scores[i]*skills[i];
    }
    if (totalValues == 0 || totalWeight == 0)
        return 0;

    return Math.floor(totalWeight / totalValues);    
}

function weightedOnBlocksSkillsJS(scores, blocks, skills) {

    const len = scores.length;
    const last = blocks[len-1];

    // Weighted average w.r.t. blocks
    let weightedScore = 0;
    let weightSum = 0;

    for (let i=0; i<len; i++) {

        let s = scores[i];
        let b = blocks[i];
        let v = skills[i];
        let weight = Math.floor((b*v*100)/last);

        weightedScore += s * weight;
        weightSum += weight;
    }

    if (weightSum == 0 || weightedScore == 0)
        return 0;

    return Math.floor(weightedScore / weightSum);     
}

const scores = [3, 7, 5, 8, 8];
const blocks = [1, 7, 10, 21, 22];
const skills = [10, 3, 4, 1, 1];

contract("Testing simple average rating function", accounts => {

    it("Should test compute() correctly", async() => {

        const func = await SimpleAvg.new();
        const expectedScore = simpleAvgJS(scores);

        const result = await func.compute(scores, blocks, skills);

        assert.equal(result.toNumber(), expectedScore, "The score should be " + expectedScore);
    });
});


contract("Testing rating function weighted on blocks", accounts => {

    it("Should test compute() correctly", async() => {

        const func = await BlockAvg.new();
        const expectedScore = weightedOnBlocksJS(scores, blocks);

        const result = await func.compute(scores, blocks, skills);

        assert.equal(result.toNumber(), expectedScore, "The score should be " + expectedScore);
    });
});

contract("Testing rating function weighted on blocks and skills", accounts => {

    it("Should test compute() correctly", async() => {

        const func = await SkillAvg.new();
        const expectedScore = weightedOnSkillsJS(scores, skills);

        const result = await func.compute(scores, blocks, skills);

        assert.equal(result.toNumber(), expectedScore, "The score should be " + expectedScore);
    });
});

contract("Testing rating function weighted on blocks", accounts => {

    it("Should test compute() correctly", async() => {

        const func = await BlockSkillAvg.new();
        const expectedScore = weightedOnBlocksSkillsJS(scores, blocks, skills);

        const result = await func.compute(scores, blocks, skills);

        assert.equal(result.toNumber(), expectedScore, "The score should be " + expectedScore);
    });
});

