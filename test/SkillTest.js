const RatingSystem = artifacts.require("RatingSystemFramework");
const FunctionRegistry = artifacts.require("FunctionRegistry");
const DatabaseSkills = artifacts.require("DatabaseSkills");

contract("RatingSystemFramework: correctness test", accounts => {

    const alice = accounts[1]; // System creator
    const bob = accounts[8];   // User of the System
    const carl = accounts[7];  // Rater EOA user
    const dave = accounts[6];  // Error Test user

    const newSkill = "Vegan";

    /////////////////
    // Deployment ownership test
    /////////////////


    it("Should test RatingSystemFramework and FunctionRegistry ownership", async() => {

        const ratingSystem = await RatingSystem.deployed();
        const functionRegistryAddress = await ratingSystem.functionRegistry();
        const functionRegistry = await FunctionRegistry.at(functionRegistryAddress);
        const dbSkillsAddress = await ratingSystem.dbSkills();
        const dbSkills = await DatabaseSkills.at(dbSkillsAddress);

        assert.equal(await ratingSystem.owner(), alice, "The owner of RatingSystemFramework should be " + alice);
        assert.equal(await functionRegistry.owner(), alice, "The owner of the FunctionRegistry should be " + alice);
        assert.equal(await dbSkills.owner(), alice, "The owner of the FunctionRegistry should be " + alice);
    });
    

    /////////////////
    // Tests add skill
    /////////////////


    describe("Testing add skills", function() {

        it("Should add a new skill called " + newSkill, async() => {
            const ratingSystem = await RatingSystem.deployed();
            const dbSkillsAddress = await ratingSystem.dbSkills();
            const dbSkills = await DatabaseSkills.at(dbSkillsAddress);

            await dbSkills.addSkill(web3.utils.fromUtf8(newSkill), {from:alice});
            assert.equal(await dbSkills.getSkillsNumber(), 5, "Skill number should be 5");
            assert.equal(await dbSkills.checkSkillExistence(web3.utils.fromUtf8(newSkill)), true, "Skill search should return true");
            assert.equal(await dbSkills.checkSkillExistence(web3.utils.fromUtf8("NotExistingSkill")), false, "Skill search should return false");
        });
    
    });

});