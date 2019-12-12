pragma solidity >=0.4.21 <0.6.0;


import "./User.sol";
import "./Interfaces.sol";
import "./AssetStorage.sol";
import "./FunctionRegistry.sol";
import "./DatabaseSkills.sol";

/// @author Andrea Lisi, Samuel Fabrizi
/// @title RatingSystemFramework
/// @notice This contract is the top stack actor, it interfaces with the users providing methods to insert/remove users
contract RatingSystemFramework is Ownable {

    // Data
    FunctionRegistry            public  functionRegistry;  // Registry for the RatingFunction contracts
    OwnableStoragePointer       private users;             // Structure to store users
    DatabaseSkills              public  dbSkills;          // Structure to store the available skills 
    mapping(address => User)    private userAddresses;     // Ensure that a single account can instantiate only a single User contract

    // Events
    event UserCreated(User _userContract);


    /// @dev The constructor simply calls the Ownable constructor to store the owner which is the creator of this contract
    constructor () Ownable(msg.sender) public {

        functionRegistry = new FunctionRegistry(msg.sender);    // The owner of RatingSystemFramework is the owner of the Registry
        users = new OwnableStoragePointer(address(this));       // Because (this) interacts with the storage
        dbSkills = new DatabaseSkills(msg.sender);              // Creates the instances of DatabaseSkill contract (Unique in an instance of RatingSystem)
    }


    /// @notice Creates a User with an username
    /// @param _name the username of the user willing to subscribe
    /// @dev If the sender has not already a User contract, stores inside users a new User contract, and then updates the map userAddresses to connect sender-User 
    function createUser(bytes32 _name) external {

        require(address(userAddresses[msg.sender]) == address(0x0), "This address has already a User registered");

        User user = new User(_name, msg.sender);     /// <= This line raises up the cost of the contract deployment by a lot (almost 6M gas)
        userAddresses[msg.sender] = user;
        users.insert(address(user));

        emit UserCreated(user);
    }


    /// @notice Removes a User
    /// @param _user The address of the User contract to remove
    /// @dev This function removes from the storage the User contract and then removes from the map of addresses the attached User contract. The User contract is still alive, its destruction depends on its owner
    function deleteUser(User _user) external  {

        require(userAddresses[msg.sender] == _user, "You cannot remove other's user's contracts");

        delete userAddresses[msg.sender];
        users.remove(address(_user));
    }


    /// @notice Get the User contract attached to the sender
    /// @return A User contract
    function getMyUserContract() external view returns(User) {

        return userAddresses[msg.sender];
    }


    /// @notice Get the list of the addresses of stored User contracts 
    /// @return The list of stored Users contracts
    /// @dev Returning here a User[] would involve a loop cycle to cast address=>User
    function getUsers() external view returns(address[] memory) {

        return users.getAssets();
    }


    /// @notice Check if a User contract is present
    /// @param _user Contract User to check the presence
    /// @return true if _user is present
    function isIn(User _user) external view returns(bool) {

        return users.isIn(address(_user));
    }


    // May be deleted

    /// @notice Get the number of stored User contracts in this System
    /// @return The number of stored User contracts
    function userCount() external view returns(uint) {

        return users.getCount();
    }

    /// @notice checks if the input skill is alredy stored in DatabaseSkills contract
    /// @param _skill The sought skill
    function checkSkillExistence(bytes32 _skill) public view returns (bool) {
        return dbSkills.checkSkillExistence(_skill);
    }

    


    // /// @notice Get the address of the User contract at a given index
    // /// @param _index The index to check
    // /// @return The User contract address
    // /// @dev Debug function    
    // function getUserByIndex(uint _index) external view returns(User) {

    //     return User(users.getKeyAt(_index));
    // }


}