const RatingSystem = artifacts.require("RatingSystemFramework");
const Storage = artifacts.require("AssetStorage");
const User = artifacts.require("User");
const Item = artifacts.require("Item");
const FunctionRegistry = artifacts.require("FunctionRegistry");

//RatingSystem.numberFormat = "BN";

contract("RatingSystemFramework: correctness test", accounts => {

    const alice = accounts[1]; // System creator
    const bob = accounts[8];   // User of the System
    const carl = accounts[7];  // Rater EOA user
    const dave = accounts[6];  // Error Test user

    const bobName = "Bob";
    const bobItemName = "Bobs content";
    const bobItemTokenName = "Bob Item Token";
    const bobItemTokenSymbol = "BTK";
    const totalSupply = 1000000;

    const bobItemSkill = "Vegetarian";
    
    const score = 5;



    /////////////////
    // Deployment ownership test
    /////////////////


    it("Should test RatingSystemFramework and FunctionRegistry ownership", async() => {

        const ratingSystem = await RatingSystem.deployed();
        const functionRegistryAddress = await ratingSystem.functionRegistry();
        const functionRegistry = await FunctionRegistry.at(functionRegistryAddress);

        assert.equal(await ratingSystem.owner(), alice, "The owner of RatingSystemFramework should be " + alice);
        assert.equal(await functionRegistry.owner(), alice, "The owner of the FunctionRegistry should be " + alice);
    });
    // Ok


    /////////////////
    // Tests concerning Users
    /////////////////


    describe("Testing the correctness of User contract", function() {

        it("Should create a user called " + bobName, async() => {

            const ratingSystem = await RatingSystem.deployed();
            const tx = await ratingSystem.createUser(web3.utils.fromUtf8(bobName), {from: bob});
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // Check ownership and name
            const owner = await bobObject.owner();
            const name = await bobObject.name();
            const rsf = await bobObject.RSF();
            assert.equal(bob, owner, "The owner is not " + bobName);
            assert.equal(web3.utils.toUtf8(name), bobName, "The User's name should be " + bobName);
            assert.equal(rsf, ratingSystem.address, "The User's RSF should be " + ratingSystem.address)

            // Check User's data inside RatingSystemFramework
            let userList = [];
            userList.push(bobUserAddress);
            assert.equal(await ratingSystem.userCount(), 1, "The RatingSystemFramework should have 1 User stored");
            assert.deepEqual(await ratingSystem.getUsers(), userList, "The RatingSystemFramework should have this list of Users: " + userList);
            assert.equal(await ratingSystem.isIn(bobUserAddress), true, bobUserAddress + " should belong to RatingSystemFramework");
        });
        // Ok
    
    
        it("Should remove and insert again " + bobName, async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            
            // Remove User contract Bob
            let bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            let bobObject = await User.at(bobUserAddress);
            await ratingSystem.deleteUser(bobObject.address, {from: bob});
            
            // Test RatingSystemFramework state after removal
            assert.equal(await ratingSystem.userCount(), 0, "The RatingSystemFramework should have no User stored");
            assert.deepEqual(await ratingSystem.getUsers(), [], "The RatingSystemFramework should have empty list of Users");
            assert.equal(await ratingSystem.isIn(bobUserAddress), false, bobUserAddress + " should NOT belong to RatingSystemFramework");
            
            // Add again a new User contract created by Bob
            await ratingSystem.createUser(web3.utils.fromUtf8(bobName), {from: bob});
            bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            bobObject = await User.at(bobUserAddress);
            // Check ownership and name
            const owner = await bobObject.owner();
            const name = await bobObject.name();
            assert.equal(bob, owner, "The owner is not " + bobName);
            assert.equal(web3.utils.toUtf8(name), bobName, "The User's name should be " + bobName);
            // Check User's data inside RatingSystemFramework
            let userList = [];
            userList.push(bobUserAddress);
            assert.equal(await ratingSystem.userCount(), 1, "The RatingSystemFramework should have 1 User stored");
            assert.deepEqual(await ratingSystem.getUsers(), userList, "The RatingSystemFramework should have this list of Users: " + userList);
            assert.equal(await ratingSystem.isIn(bobUserAddress), true, bobUserAddress + " should belong to RatingSystemFramework");
        });
        // Ok
    
    
        it("Should NOT insert duplicate Users / remove non-User in the Storage contract", async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
    
            await ratingSystem.createUser(web3.utils.fromUtf8(bobName+"2"), {from: bob}).then(assert.fail).catch(function(error) {
                // Should fail because User "bob" is already registered inside RatingSystem
                assert(error.message.indexOf('revert') >= 0, 'User ' + bob +  ' already registerd');
            });
    
            await ratingSystem.deleteUser(dave, {from: dave}).then(assert.fail).catch(function(error) {
                // Should fail because dave is not an User contract address
                assert(error.message.indexOf('revert') >= 0, 'User ' + dave +  ' does not exist');
            });
        });
        // Ok
    
    
        it("Dave should NOT remove Bob's User contract", async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
    
            await ratingSystem.deleteUser(bobUserAddress, {from: dave}).then(assert.fail).catch(function(error) {
                // Should fail because dave cannot remove bob's User contract
                assert(error.message.indexOf('revert') >= 0, 'User ' + bobUserAddress +  ' can be removed only by ' + bob);
            });        
        });
        // Ok
    });



    /////////////////
    // Tests concerning Items
    /////////////////


    describe("Test the correctness of Item contract", function() {

        it("Should create an item called " + bobItemName + " for " + bobName, async() => {

            // Retrieve bob's User contract instance
            const ratingSystem = await RatingSystem.deployed();
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // Retrieve FunctionRegistry and the address of the simple average function
            const functionRegistryAddress = await ratingSystem.functionRegistry();
            const functionRegistry = await FunctionRegistry.at(functionRegistryAddress);
            const functionAddress = await functionRegistry.getFunction(0); // first function, the only one deployed
    
            // Create Item for bob
            const tx = await bobObject.createItem(web3.utils.fromUtf8(bobItemName), web3.utils.fromUtf8(bobItemSkill), bobItemTokenName, bobItemTokenSymbol, totalSupply, {from: bob});

    
            // Retrieve item's contract instance
            const itemList = await bobObject.getItems();
            const deployedItemAddress = itemList[0];
            const itemObject = await Item.at(deployedItemAddress);
    
            // Check correctness of Item creation flow
            const rsf = await itemObject.RSF();
            const itemName = web3.utils.toUtf8(await itemObject.name());
            const expectedItemList = [deployedItemAddress];
            assert.equal(rsf, ratingSystem.address, "The item's RSF should be " + ratingSystem.address);
            assert.equal(itemName, bobItemName, "The item is not " + bobItemName);
            assert.equal(await itemObject.owner(), bob, "The owner of " + bobItemName + " should be " + bob);
            assert.equal(await bobObject.itemCount(), 1, "User " + bobUserAddress + " should have only 1 deployed Item");
            assert.deepEqual(await bobObject.getItems(), expectedItemList, "User " + bobUserAddress + " should have this list of Items: " + expectedItemList);
            assert.equal(await bobObject.isIn(deployedItemAddress), true, deployedItemAddress + " should belong to User " + bobUserAddress);
        }); 
        // Ok
    
    
        it("Should remove and insert again " + bobItemName, async() => {
    
            // Retrieve bob's User contract instance
            const ratingSystem = await RatingSystem.deployed();
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // Retrieve FunctionRegistry and the address of the simple average function
            const functionRegistryAddress = await ratingSystem.functionRegistry();
            const functionRegistry = await FunctionRegistry.at(functionRegistryAddress);
            const functionAddress = await functionRegistry.getFunction(0); // first function, the only one deployed
    
            // Retrieve item's contract address
            let itemList = await bobObject.getItems();
            let deployedItemAddress = itemList[0];
    
            // Remove "Bob's content"
            let tx = await bobObject.deleteItem(deployedItemAddress, {from: bob});
    
            // Test bob's User contract state after removal
            assert.equal(await bobObject.itemCount(), 0, "Bob's user contract should have no Item stored");
            assert.deepEqual(await bobObject.getItems(), [], "Bob's user contract should have empty list of Item");
            assert.equal(await bobObject.isIn(deployedItemAddress), false, deployedItemAddress + " should NOT belong to bob's User contract");
    
            // Insert again bob's content
            tx = await bobObject.createItem(web3.utils.fromUtf8(bobItemName), web3.utils.fromUtf8(bobItemSkill), bobItemTokenName, bobItemTokenSymbol, totalSupply, {from: bob});
    
            // Retrieve item's contract instance
            itemList = await bobObject.getItems();
            deployedItemAddress = itemList[0];
            const itemObject = await Item.at(deployedItemAddress);
    
            // Check correctness of Item creation flow
            const itemName = web3.utils.toUtf8(await itemObject.name());
            const expectedItemList = [deployedItemAddress];
            assert.equal(itemName, bobItemName, "The item is not " + bobItemName);
            assert.equal(await itemObject.owner(), bob, "The owner of " + bobItemName + " should be " + bob);
            assert.equal(await bobObject.itemCount(), 1, "User " + bobUserAddress + " should have only 1 deployed Item");
            assert.deepEqual(await bobObject.getItems(), expectedItemList, "User " + bobUserAddress + " should have this list of Items: " + expectedItemList);
            assert.equal(await bobObject.isIn(deployedItemAddress), true, deployedItemAddress + " should belong to User " + bobUserAddress);
        });
        // Ok
    
        
        it("Dave should NOT remove Bob's Item contract", async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
    
            // Retrieve item's contract address
            const itemList = await bobObject.getItems();
            const deployedItemAddress = itemList[0];
    
            await bobObject.deleteItem(deployedItemAddress, {from: dave}).then(assert.fail).catch(function(error) {
                // Should fail because dave cannot remove bob's Content contract
                assert(error.message.indexOf('revert') >= 0, 'Item ' + deployedItemAddress +  ' can be removed only by ' + bob);
            });        
        });
        // Ok
    });


    /////////////////
    // Tests concerning rates from User
    /////////////////


    describe("Test the correctness of the access policy and of rating operation", function() {


        it("Should create User contract for carl", async() => {

            const ratingSystem = await RatingSystem.deployed();
            const tx = await ratingSystem.createUser(web3.utils.fromUtf8("Carl"), {from: carl});
        });
        // Ok


        it("Should let Carl (User contract) to rate " + bobItemName + " " + score + " stars", async() => {

            const ratingSystem = await RatingSystem.deployed();
            // Get Carl User
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress);
            // Get Bob User
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            // Get Bob Item
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);
    
            // Supposing Bob and Carl agreed in some way that Carl can rate Bob's Item
            await bobItem.grantPermission(carlUserAddress, {from: bob});
    
            // Check policy's flag of Carl's User contract
            const carlPolicy = await bobItem.getPolicy(carlUserAddress);
            assert.equal(carlPolicy._granted, true, "Carl (User) should have its policy term equal to true");
    
            // Carl (User) rates Bob's item
            await carlObject.addRate(bobItemAddress, score, {from: carl});
    
            // Check that Carl cannot rate again
            assert.notEqual(await bobItem.checkForPermission(carlUserAddress), 0, "Carl's permission status should be 1 or 2");
            
            // Check item's ratings
            const ratingBundle = await bobItem.getAllRatings();
            assert.equal(await bobItem.ratingCount(), 1, bobItemName + " should have only 1 rating");
            assert.equal(ratingBundle._scores.length, 1, bobItemName + " should have only 1 score");
            assert.equal(ratingBundle._blocks.length, 1, bobItemName + " should have only 1 timestamp");
            assert.equal(ratingBundle._raters.length, 1, bobItemName + " should have only 1 rater");
            assert.equal(ratingBundle._scores[0], score, "The score should be " + score);
            assert.equal(ratingBundle._raters[0], carlUserAddress, "The rater should be Carl: " + carlUserAddress);
        });
        // Ok
    
    
        it("Should not let Carl to rate again", async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            // Get Carl User
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress);
            // Get Bob User
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            // Get Bob Item
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);

    
            await carlObject.addRate(bobItemAddress, score, {from: carl}).then(assert.fail).catch(function(error) {
                // Should fail because Carl has no permission to rate
                assert(error.message.indexOf('revert') >= 0, 'Carl ' + carl +  ' has no permission to rate ' + bobItemName);
            });
    
            // Check that the number of ratings of Bob's Item is still 1
            assert.equal(await bobItem.ratingCount(), 1, bobItemName + " should have only 1 rating");
        });
        // Ok
    
    
        it("Should check the revokePermission() from Bob to Carl", async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            // Get Carl User
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress);
            // Get Bob User
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            // Get Bob Item
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);
    
            // Suppose Bob and Carl agreed in some way that Carl can rate Bob's Item
            await bobItem.grantPermission(carlUserAddress, {from: bob});
            // Suppose Bob decided to revoke Carl's permission for some reason
            await bobItem.revokePermission(carlUserAddress, {from: bob});
    
            // Check policy's flag of Carl
            const carlPolicy = await bobItem.getPolicy(carlUserAddress);
            assert.equal(carlPolicy._granted, false, "Carl should have its policy term equal to false");
    
            // Carl tries to rate anyway
            await carlObject.addRate(bobItemAddress, score, {from: carl}).then(assert.fail).catch(function(error) {
                // Should fail because Carl has no permission to rate
                assert(error.message.indexOf('revert') >= 0, 'Carl ' + carl +  ' has no permission to rate ' + bobItemName);
            });
    
            // Check that the number of ratings of Bob's Item is still 1
            assert.equal(await bobItem.ratingCount(), 1, bobItemName + " should have only 1 rating");
        });
        // Ok
    
    
        it("Should avoid bugs in grantPermission() and revokePermission()", async() => {
    
            const ratingSystem = await RatingSystem.deployed();
            // Get Carl User
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress);
            // Get Bob User
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            // Get Bob Item
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);
    
            // Suppose Bob and Carl agreed in some way that Carl can rate Bob's Item
            await bobItem.grantPermission(carlUserAddress, {from: bob});
    
            // Check policy's flag of Carl
            let carlPolicy = await bobItem.getPolicy(carlUserAddress);
            assert.equal(carlPolicy._granted, true, "Carl should have its policy term equal to true");
    
            // Dave tries to revoke Carl's permissions
            await bobItem.revokePermission(carlUserAddress, {from: dave}).then(assert.fail).catch(function(error) {
                // Should fail because Carl has no permission to rate
                assert(error.message.indexOf('revert') >= 0, 'Dave ' + dave +  ' cannot revoke permissions to other');
            });
    
            // Dave tries to grant permissions to himself
            await bobItem.grantPermission(dave, {from: dave}).then(assert.fail).catch(function(error) {
                // Should fail because Carl has no permission to rate
                assert(error.message.indexOf('revert') >= 0, 'Dave ' + dave +  ' cannot grant permission to himself on ' + bobItemName);
            });
    
            // Dave tries to grant permissions to Alice
            await bobItem.grantPermission(alice, {from: dave}).then(assert.fail).catch(function(error) {
                // Should fail because Carl has no permission to rate
                assert(error.message.indexOf('revert') >= 0, 'Dave ' + dave +  ' cannot grant permission to Alice on ' + bobItemName);
            });
    
            // Check policy's flag of alice/dave/carl
            const alicePolicy = await bobItem.getPolicy(alice);
            const davePolicy = await bobItem.getPolicy(dave);
            carlPolicy = await bobItem.getPolicy(carlUserAddress);
            assert.equal(alicePolicy._granted, false, "Alice should have its policy term equal to false");
            assert.equal(davePolicy._granted, false, "Dave should have its policy term equal to false");
            assert.equal(carlPolicy._granted, true, "Carl should have its policy term equal to true");
        });
        // Ok


        it("Should check grantPermission() and addRate() to be called only by registered User contracts", async() => {

            const ratingSystem = await RatingSystem.deployed();
            // Get Carl User
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress);
            // Get Bob User
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            // Get Bob Item
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);

            // Should fail because carl is not User contract
            await bobItem.grantPermission(carl, {from: bob}).then(assert.fail).catch(function(error) {
                assert(error.message.indexOf('revert') >= 0, "address " + carl + " of Carl is not a User contract");
            });

            // Deploy User contract without attaching to RSF
            const daveUserContract = await User.new(web3.utils.fromUtf8("Malicious"), dave);
            const daveUserAddress = await daveUserContract.address;

            await daveUserContract.iAmRegisteredUser().then(assert.fail).catch(function(error) {
                // Should fail because daveUserContract's rsf field is the address of dave which is not RSF
                assert(error.message.indexOf('revert') >= 0, "address " + daveUserAddress + " of User of Dave is not a User contract of Alice's RSF");
            });
            
            // Should fail because carl is not User contract
            await bobItem.grantPermission(daveUserAddress, {from: bob}).then(assert.fail).catch(function(error) {
                assert(error.message.indexOf('revert') >= 0, "address " + daveUserAddress + " of User of Dave is not a User contract of Alice's RSF");
            });
        });
        // Ok

    });

    
    /////////////////
    // Tests concerning the score computation
    /////////////////


    describe("Testing the correctness of the score computation", function() {

        it("Should test the SimpleAverageFunction contract for " + bobItemName , async() => {

            const ratingSystem = await RatingSystem.deployed();
            // Get Carl User
            const carlUserAddress = await ratingSystem.getMyUserContract({from: carl});
            const carlObject = await User.at(carlUserAddress);
            // Get Bob User
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            // Get Bob Item
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);
            // Get function
            const registryAddress = await ratingSystem.functionRegistry();
            const registry = await FunctionRegistry.at(registryAddress);
            const bobFunction = await registry.getFunction(0); // 1st function is the simple average 

            // Perform a loop of rating
            let ratings = [];
            let expectedScore = score;
            ratings.push({score: 7, rater: carl});
            ratings.push({score: 4, rater: carl});
            ratings.push({score: 6, rater: carl});
    
            ratings.push({score: 1, rater: carl});
            ratings.push({score: 9, rater: carl});
            ratings.push({score: 10, rater: carl});
    
            ratings.push({score: 10, rater: carl});
            ratings.push({score: 8, rater: carl});
            ratings.push({score: 4, rater: carl});
    
            ratings.forEach(async (rating) => {
    
                expectedScore += rating.score;
                bobItem.grantPermission(carlUserAddress, {from: bob});
                carlObject.addRate(bobItemAddress, rating.score, {from: rating.rater});
            });
    
            // Check the number of registered ratings is ok
            assert.equal(await bobItem.ratingCount(), ratings.length+1, bobItemName + " should have " + (ratings.length+1) + " ratings");
    
            // Compute the final score
            expectedScore = Math.floor(expectedScore/(ratings.length+1)); // Solidity truncates uint
            // Check final score
            assert.equal(await bobItem.computeScore(bobFunction), expectedScore, bobItemName + " should have an average score of " + expectedScore);
        });
        // Ok

        it("Should test the WeightedAverageFunction contract for " + bobItemName , async() => {

            const ratingSystem = await RatingSystem.deployed();
            const bobUserAddress = await ratingSystem.getMyUserContract({from: bob});
            const bobObject = await User.at(bobUserAddress);
            const bobItemList = await bobObject.getItems();
            const bobItemAddress = bobItemList[0]; // Bob deployed only one Item
            const bobItem = await Item.at(bobItemAddress);

            const registryAddress = await ratingSystem.functionRegistry();
            const registry = await FunctionRegistry.at(registryAddress);
            const weightFunction = await registry.getFunction(1); // 2nd function is the weighted average 
               
            const ratings = await bobItem.getAllRatings();
            const len = ratings._blocks.length;
            const last = ratings._blocks[len-1];
            let total = 0;
            let weightSum = 0;

            for(let i=0; i<len; i++) {

                const s = ratings._scores[i];
                const b = ratings._blocks[i];
                const weight = (b/last)*100;

                total += s*weight;
                weightSum += weight;
            }

            const expectedScore = total / weightSum;
            assert.equal(await bobItem.computeScore(weightFunction), Math.floor(expectedScore), bobItemName + " should have a weighted average score of " + expectedScore);
        });
        // Ok  
    });

});