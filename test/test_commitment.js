const RatingSystem = artifacts.require("RatingSystemFramework");
const Storage = artifacts.require("AssetStorage");
const User = artifacts.require("User");
const Item = artifacts.require("Item");
const FunctionRegistry = artifacts.require("./FunctionRegistry");
const SimpleFunction = artifacts.require("./SimpleAvarageFunction");
const WeightFunction = artifacts.require("./WeightedAverageFunction");
const WeightSkillFunction = artifacts.require("./WeightedAverageSkillFunction");
const DatabaseSkills = artifacts.require("./DatabaseSkills");
const ERC20 = artifacts.require("-/Token/ERC20");

//RatingSystem.numberFormat = "BN";

contract("Item", accounts => {

    const alice = accounts[1]; // System creator
    const bob = accounts[8];   // User of the System
    const carl = accounts[7];  // Rater EOA user
    const dave = accounts[6];  // Error Test user

    const bobName = "Bob";
    const bobItemName = "Bobs content";
    const bobItemTokenName = "Bob Item Token";
    const bobItemTokenSymbol = "BTK";
    const totalSupply = 1000000;
    const bobItemTokenValue = 100;
    const bobItemSkill = "Vegetarian";
    
    const score = 5;

    const carlName = "Carl";
    
    const newSkill = "Skill5";
    const carl2bobPayment = web3.utils.toWei('0.5', 'ether');


    /////////////////
    // Tests concerning Users
    /////////////////


    describe("Testing the commitment functionality", function() {

        let ratingSystem;
        let bobUserAddress, bobObject, bobItemAddress, bobItemObject;
        let carlUserAddress, carlObject;
        
        beforeEach(async function() {
            let tx1, tx2;
            
            ratingSystem = await RatingSystem.new({from: alice});
            // const avgPc = await deployer.deploy(SimpleFunction, {from: alice});
            // const registryAddress = await ratingSystem.functionRegistry();
            // const registry = await FunctionRegistry.at(registryAddress);            
            // await registry.pushFunction(avgPc.address, web3.utils.fromUtf8("Simple Average"), {from: alice});

            // Populate DatabaseSkills
            const dbSkillsAddress = await ratingSystem.dbSkills();
            const dbSkills = await DatabaseSkills.at(dbSkillsAddress);
            await dbSkills.addSkill(web3.utils.fromUtf8("Vegetarian"), {from:alice});
            await dbSkills.addSkill(web3.utils.fromUtf8("Meat"), {from:alice});
            await dbSkills.addSkill(web3.utils.fromUtf8("Sushi"), {from:alice});
            await dbSkills.addSkill(web3.utils.fromUtf8("Fish"), {from:alice});
             
            // Create User Bob, Carl
            tx1 = await ratingSystem.createUser(web3.utils.fromUtf8(bobName), {from: bob});
            bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            bobObject = await User.at(bobUserAddress);
                
            await ratingSystem.createUser(web3.utils.fromUtf8(carlName), {from: carl});
            carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            carlObject = await User.at(carlUserAddress);
            
            // Create Item Bob
            tx2 = await bobObject.createItem(web3.utils.fromUtf8(bobItemName), web3.utils.fromUtf8(bobItemSkill), bobItemTokenName, bobItemTokenSymbol, bobItemTokenValue, {from: bob});
            const itemList = await bobObject.getItems();
            bobItemAddress = itemList[0];
            bobItemObject = await Item.at(bobItemAddress);

            console.log("User creation: " + tx1.receipt.gasUsed);
            console.log("Item creation: " + tx2.receipt.gasUsed);
        });
        
        it("Successful commitment", async() => {

            // Test Commitment (no tokens)
            let tx;
            tx = await bobItemObject.commitPermission(carlUserAddress, carl2bobPayment, {from: bob});
            console.log("CommitPermission gas: " + tx.receipt.gasUsed);

            const commit = await bobItemObject.isCommited(carlUserAddress, carl2bobPayment);
            assert.equal(commit, true);

            // Test payItem cost with grantPermission
            tx = await carlObject.payItem(bobItemAddress, carl2bobPayment, {from:carl, value: carl2bobPayment});
            console.log("PayItem gas: " + tx.receipt.gasUsed);
            await carlObject.addRate(bobItemAddress, score, {from: carl});

            assert.equal(await bobItemObject.ratingCount(), 1);

            // Test payItem cost with grantPermission
            tx = await bobItemObject.grantPermission(carlUserAddress, {from: bob});
            console.log("GrantPermission gas: " + tx.receipt.gasUsed);

            // tx = await carlObject.payItem(bobItemAddress, carl2bobPayment, {from:carl, value: carl2bobPayment});
            // console.log("PayItem gas: " + tx.receipt.gasUsed);
            // tx = await carlObject.addRate(bobItemAddress, score, {from: carl});
            // console.log("addRate gas: " + tx.receipt.gasUsed);

        });
        // Ok

        
        it("Successful commitment with tokens", async() => {

            // Test Commitment
                // Let carl have at least a token
                // DEV: unfortunately is not possible to issue him tokens directly because the owner of the ERC20 is the contract and not Bob EOA
                // carl gest 1 token after second rating (because the Item first gives tokens, then improves skill)
            let tx1, tx2, tx3;
            let token = await bobItemObject.tokenContract();
            token = await ERC20.at(token);            
            await bobItemObject.commitPermission(carlUserAddress, carl2bobPayment, {from: bob});
            tx1 = await carlObject.payItem(bobItemAddress, carl2bobPayment, {from:carl, value: carl2bobPayment});
            await carlObject.addRate(bobItemAddress, score, {from: carl});

            await bobItemObject.commitPermission(carlUserAddress, carl2bobPayment, {from: bob});
            tx2 = await carlObject.payItem(bobItemAddress, carl2bobPayment, {from:carl, value: carl2bobPayment});
            await carlObject.addRate(bobItemAddress, score, {from: carl});

            await bobItemObject.commitPermission(carlUserAddress, carl2bobPayment, {from: bob});

            // Test payItem to successfully check the commitment with amount and tokens
            tx3 = await carlObject.payItem(bobItemAddress, carl2bobPayment, {from:carl, value: carl2bobPayment});

            console.log(tx1.receipt.gasUsed, tx2.receipt.gasUsed, tx3.receipt.gasUsed);
            // No execptions => ok
        });
        // Ok

        it("addRate with commitment, no permission", async() => {

            // Test Commitment
            let tx;
            tx = await bobItemObject.commitPermission(carlUserAddress, carl2bobPayment, {from: bob});
            await carlObject.addRate(bobItemAddress, score, {from: carl}).then(assert.fail).catch(function(error) {
                // Should fail because dave is not an User contract address
                assert(error.message.indexOf('revert') >= 0);
            });
        });
        // Ok
    
    });
});