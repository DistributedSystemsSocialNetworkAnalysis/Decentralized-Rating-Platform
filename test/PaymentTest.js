const RatingSystem = artifacts.require("RatingSystemFramework");
const Storage = artifacts.require("AssetStorage");
const User = artifacts.require("User");
const Item = artifacts.require("Item");
const FunctionRegistry = artifacts.require("FunctionRegistry");
const DatabaseSkills = artifacts.require("DatabaseSkills");

contract("RatingSystemFramework: correctness test", accounts => {

    const alice = accounts[1]; // System creator
    const bob = accounts[2];   // User of the System
    const carl = accounts[3];  // Rater EOA user

    const bobName = "Bob";
    const bobItemName = "Bobs content";
    const bobItemSkill = "Vegetarian";
    const bobItemTokenName = "Bob Item Token";
    const bobItemTokenSymbol = "BTK";
    const totalSupply = 1000000;

    const carlName = "Carl";
    
    const newSkill = "Skill5";
    const carl2bobPayment = web3.utils.toWei('0.5', 'ether');
    
    const score = 5;


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
    // Tests add Bob's user and Carl's user and send payment
    /////////////////


    describe("Testing add user and send payment", function() {

        it("Should add a new user called " + bobName, async() => {
            const ratingSystem = await RatingSystem.deployed();
            const dbSkillsAddress = await ratingSystem.dbSkills();
            const dbSkills = await DatabaseSkills.at(dbSkillsAddress);

            const tx = await ratingSystem.createUser(web3.utils.fromUtf8(bobName), {from: bob});
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // Check User's data inside RatingSystemFramework
            let userList = [];
            userList.push(bobUserAddress);
            assert.equal(await ratingSystem.userCount(), 1, "The RatingSystemFramework should have 1 User stored");
            assert.deepEqual(await ratingSystem.getUsers(), userList, "The RatingSystemFramework should have this list of Users: " + userList);
            assert.equal(await ratingSystem.isIn(bobUserAddress), true, bobUserAddress + " should belong to RatingSystemFramework");

        });
    

        it("Should add a new user called " + carlName, async() => {
            const ratingSystem = await RatingSystem.deployed();
            const dbSkillsAddress = await ratingSystem.dbSkills();
            const dbSkills = await DatabaseSkills.at(dbSkillsAddress);


            // create user for Carl
            await ratingSystem.createUser(web3.utils.fromUtf8(carlName), {from:carl});
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress); 

            // Check User's data inside RatingSystemFramework
            let userList = [];
            userList.push(carlUserAddress);
            assert.equal(await ratingSystem.userCount(), 2, "The RatingSystemFramework should have 2 User stored");
            assert.equal(await ratingSystem.isIn(carlUserAddress), true, carlUserAddress + " should belong to RatingSystemFramework");
        });


        it("Carl should pay in ether Bob's item, total amount: " + web3.utils.fromWei(carl2bobPayment, 'ether') + " ether", async() => {
            const ratingSystem = await RatingSystem.deployed();
            
            // retrieve user for Bob
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // retrieve user for Carl
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress); 

            // create item for Bob
            await bobObject.createItem(web3.utils.fromUtf8(bobItemName), web3.utils.fromUtf8(bobItemSkill), bobItemTokenName, bobItemTokenSymbol, totalSupply, {from: bob});
    
            // Retrieve item's contract instance
            const itemList = await bobObject.getItems();
            const deployedItemAddress = itemList[0];
            const itemObject = await Item.at(deployedItemAddress);

            // ho provato a registrare un listener per ascoltare gli eventi ma non funziona
            // itemObject.SuccessfulPayment().on('data', event => console.log(event));

    
            // Carl send an amout of ether to Bob's item    
            const payTx = await carlObject.payItem(deployedItemAddress, carl2bobPayment, {from:carl, value: carl2bobPayment});
            assert.equal(await web3.eth.getBalance(deployedItemAddress), 0, "Bob's item balance doesn't match, it should be 0");
            
        });

        it("Bob's item should grant permission to Carl", async() => {
            const ratingSystem = await RatingSystem.deployed();
            
            // retrieve user for Bob
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // retrieve user for Carl
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress); 

            // Retrieve item's contract instance
            const itemList = await bobObject.getItems();
            const deployedItemAddress = itemList[0];
            const bobItem = await Item.at(deployedItemAddress);


            await bobItem.grantPermission(carlUserAddress, {from: bob});
            // Check policy's flag of Carl's User contract
            const carlPolicy = await bobItem.getPolicy(carlUserAddress);
            assert.equal(carlPolicy._granted, true, "Carl (User) should have its policy term equal to true");

        });

    });

});