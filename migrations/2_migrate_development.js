
/**
 * 
 * > truffle migrate (--reset)
 * 
 * This script migrates the contract in the "development" test network
 * 
 * The development test network can be used for live testing. 
 * The script deploys only the minimal set of contracts
 */


// Artifacts == truffle's contract abstraction
const Framework = artifacts.require("./RatingSystemFramework");
const User = artifacts.require("./User");
const Item = artifacts.require("./Item");
const FunctionRegistry = artifacts.require("./FunctionRegistry");
const SimpleFunction = artifacts.require("./SimpleAvarageFunction");
const WeightFunction = artifacts.require("./WeightedAverageFunction");
const WeightSkillFunction = artifacts.require("./WeightedAverageSkillFunction");

const DatabaseSkills = artifacts.require("./DatabaseSkills");

module.exports = function(deployer, network, accounts) {

    deployer.then(async () => {

        if(network=="development") {

            // Deploy on test network for testing scripts

            // Get accounts from Ganache
            const alice = accounts[1]; // System creator

            // Get instance of Framework            
            const system = await deployer.deploy(Framework, {from: alice});

            // Populate FunctionRegistry
            const avgPc = await deployer.deploy(SimpleFunction, {from: alice});
            const wgtPc = await deployer.deploy(WeightFunction, {from: alice});
            const wgtSkillPc = await deployer.deploy(WeightSkillFunction, {from: alice});
            const registryAddress = await system.functionRegistry();
            const registry = await FunctionRegistry.at(registryAddress);            
            await registry.pushFunction(avgPc.address, web3.utils.fromUtf8("Simple Average"), {from: alice});
            await registry.pushFunction(wgtPc.address, web3.utils.fromUtf8("Weighted Average"), {from: alice});
            await registry.pushFunction(wgtSkillPc.address, web3.utils.fromUtf8("Weighted Skill Average"), {from: alice});

            // Populate DatabaseSkills
            const dbSkillsAddress = await system.dbSkills();
            const dbSkills = await DatabaseSkills.at(dbSkillsAddress);
            await dbSkills.addSkill(web3.utils.fromUtf8("Vegetarian"), {from:alice});
            await dbSkills.addSkill(web3.utils.fromUtf8("Meat"), {from:alice});
            await dbSkills.addSkill(web3.utils.fromUtf8("Sushi"), {from:alice});
            await dbSkills.addSkill(web3.utils.fromUtf8("Fish"), {from:alice});
        }
    }); 
};