
/**
 * 
 * > truffle migrate --network ropsten
 * 
 * This script migrates the contract in the "ropsten" test network
 * 
 * The ropsten network is used for experiments. 
 * The script deploys the minimal set of contracts that a  system owner needs
 * 
 * It's normal that it takes a while due to the mining process
 */

// Artifacts == truffle's contract abstraction
const Framework = artifacts.require("./RatingSystemFramework");
const FunctionRegistry = artifacts.require("./FunctionRegistry");
const SimpleFunction = artifacts.require("./SimpleAvarageFunction");
const WeightFunction = artifacts.require("./WeightedAverageFunction");
const WeightSkillFunction = artifacts.require("./WeightedAverageSkillFunction");
const DatabaseSkills = artifacts.require("./DatabaseSkills");

module.exports = function(deployer, network, accounts) {

    deployer.then(async () => {

        if(network=="ropsten") {

            // Deploy on ropsten
            let system, avgPc, wgtPc;
            let functionRegistry, dbSkills;
            let promises = []

            promises.push(deployer.deploy(Framework));
            promises.push(deployer.deploy(SimpleFunction));
            promises.push(deployer.deploy(WeightFunction));

            [system, avgPc, wgtPc] = await Promise.all(promises);

            // Get addresses
            promises = [];
            promises.push(system.functionRegistry());
            promises.push(system.dbSkills());

            [functionRegistry, dbSkills] = await Promise.all(promises);

            // Get instances
            promises = [];
            promises.push(FunctionRegistry.at(functionRegistry));
            promises.push(DatabaseSkills.at(dbSkills));

            [functionRegistry, dbSkills] = await Promise.all(promises);

            promises = [];
            // Populate with rating functions
            promises.push(functionRegistry.pushFunction(avgPc.address, web3.utils.fromUtf8("Simple Average")));
            promises.push(functionRegistry.pushFunction(wgtPc.address, web3.utils.fromUtf8("Weighted Average")));
            // Populate with sample skills
            promises.push(dbSkills.addSkill(web3.utils.fromUtf8("Vegan Cusine")));
            promises.push(dbSkills.addSkill(web3.utils.fromUtf8("Wine Tasting")));
            promises.push(dbSkills.addSkill(web3.utils.fromUtf8("Beer Drinks")));

            await Promise.all(promises);
        }        
	});
}