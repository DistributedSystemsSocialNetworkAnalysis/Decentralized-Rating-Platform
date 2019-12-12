pragma solidity >=0.4.21 <0.6.0;


import "./User.sol";
import "./Interfaces.sol";
import "./RatingFunction.sol";
import "./AssetStorage.sol";
import "./Token/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @author Andrea Lisi, Samuel Fabrizi
/// @title Item
/// @notice This contract represents an item of the RatingSystemFramework. Items can be rated by external accounts or contract only if they have the permissions to do that
/// @dev The Item contract inherits from Permissioned. It defines the structure of a Rating and it keeps a RatingFunction instance to let the users know how its final score will be computed
contract Item is Permissioned {
    using SafeMath for uint256;

    // Data
    bytes32         public name;                // Item nickname
    address         public RSF;                 // The RatingSystemFramework the Item belongs to
    uint[]          public scoreArray;          // Array of scores
    uint[]          public blockArray;          // Array of blocks the scores belong to
    User[]          public raterArray;          // Array of raters
    uint[]          public valueSkillArray;     // Array of rater skill value
    bytes32         public skill;               // Item skill
    IERC20          public tokenContract;       // Item token contract address
    uint256         public tokenValue;          // Item token value


    // Events
    event ItemRated(Item _item, uint8 _score, uint _block, User _rater, uint _valueSkill);
    event SuccessfulPayment(Item _item, User _user, uint _amount, uint256 _numberOfToken);


    /// @param _name the nickname of the Item
    /// @param _owner the owner's address of the Item
    /// @param _rsf The RatingSystemFramework the Item belongs to
    /// @param _skill The skill of the item
    /// @param _nameToken The name of the tokens owned by the item
    /// @param _symbolToken The symbol of the tokens owned by the item
    /// @param _tokenValue The value of the tokens owned by the item
    /// @dev The constructor calls the Permisioned constructor
    constructor (bytes32 _name,             
                 address _owner,            
                 address _rsf,
                 bytes32 _skill,
                 string memory _nameToken,
                 string memory _symbolToken,
                 uint256 _tokenValue
                 )               
                 
                 Permissioned(_owner)
                 
                 public {
        RatingSystemFramework rsf = RatingSystemFramework(_rsf);
        require(rsf.checkSkillExistence(_skill), "Skill declared doesn't exist");
        require(_tokenValue > 0, "Token value must be greater then 0");
        RSF = _rsf;
        name = _name;
        skill = _skill;
        tokenContract = new ERC20(_nameToken, _symbolToken, 1000000);
        tokenValue = _tokenValue;
    }


    /// @notice De-activate this contract
    function destroy() external isOwner {
        // We don't assume User contracts to store ether
        selfdestruct(address(uint160(0x0))); // cast 0x0 to address payable
    }


    /// @notice Grant the permission to access to this contract to only User contract belonging to the same RatingSystemFramework
    /// @param _to The address meant to have permission
    /// @dev After checking _to is a correct User contract call the parent function
    function grantPermission(address _to) public isOwner {

        // Check if the User and this Item belong to the same RSF
        User u = User(_to);
            // Require sender is User of RSF
        require(u.iAmRegisteredUser(), "Rating can be done only by registered User contracts");
            // Require User's RSF == my RSF
        require(u.RSF() == RSF, "User should rate only Items beloning to its RSF");
        require(u.owner() != owner, "Cannot grant permissions to User itself");

        // Call parent
        super.grantPermission(_to);
    }


    /// @notice Rate this Item
    /// @param _score The score to assign to this item
    /// @param _valueSkill The skill value of the rater
    /// @dev Check whether caller has the permission on this contract (since it's an extension of Permissioned)
    function addRate(uint8 _score, uint _valueSkill) external {

        address _sender = msg.sender;   // Store the sender as "address"
        User _rater = User(_sender);    // Store the sender as "User"
        uint _block = block.number;

        // Check for permissions to rate and the score interval

        require(checkForPermission(_sender) == 0, "No permission to rate this Item");
        require(_score >= 1 && _score <= 10, "Score out of scale");

        revokePermission(_sender);

        scoreArray.push(_score);
        blockArray.push(_block);
        raterArray.push(_rater);
        valueSkillArray.push(_valueSkill);


        assert(scoreArray.length == blockArray.length);        
        assert(blockArray.length == raterArray.length);
        assert(raterArray.length == valueSkillArray.length);

        // if value skill is greater then zero, item issues an amount of token to the rater
        if (_valueSkill > 0)
            issueToken(_sender, _valueSkill);
        
        emit ItemRated(this, _score, _block, _rater, _valueSkill);
    }
    

    /// @notice Compute the final score
    /// @param _function The RatingFunction to use to compute the final score
    /// @return The final score of this Item
    function computeScore(RatingFunction _function) external view returns (uint) {

        return _function.compute(scoreArray, blockArray, valueSkillArray);
    }


    /// @notice Get all the ratings information of this Item
    /// @return _scores: the array of scores
    /// @return _blocks: the array of blocks
    /// @return _raters: the array of User addresses which rated this Item
    /// @return _raters: the array of skill values of raters
    function getAllRatings() public view returns (  uint[] memory _scores, 
                                                    uint[] memory _blocks, 
                                                    User[] memory _raters,
                                                    uint[] memory _userValueSkills
                                                    ) {

        _scores = scoreArray;
        _blocks = blockArray;
        _raters = raterArray;
        _userValueSkills = valueSkillArray;
    }


    /// @notice Get the number of ratings performed on this Item
    /// @return The number of ratings
    function ratingCount() external view returns(uint) {

        return scoreArray.length;
    }


    /// @notice Confirm user payment and transfer token 
    /// @param _user User that sends the payment
    /// @param _amount Amount of payment
    /// @param _totalTokenAmount Amount of token to transfer
    function successfulPayment(User _user, uint _amount, uint256 _totalTokenAmount) external {

        if (_amount > 0){
            address payable ownerItem = address(uint160(owner));
            ownerItem.transfer(_amount);
        }
        if (_totalTokenAmount > 0)
            tokenContract.transferFrom(msg.sender, address(this), _totalTokenAmount);
        emit SuccessfulPayment(this, _user, _amount, _totalTokenAmount);
    }


    /// @notice Get the value of tokens owned by function caller
    /// @return The value of tokens owned by function caller
    function getTokenOwnedValue() external view returns(uint256){

        return tokenContract.balanceOf(msg.sender).mul(tokenValue);
    }


    /// @notice Get the number of tokens owned by function caller
    /// @return The number of tokens owned by function caller
    function getTokenOwned() external view returns(uint256){

        return tokenContract.balanceOf(msg.sender);
    }

    /// @notice Transfer a number of tokens to an address
    /// @param _to Address that receives the tokens
    /// @param _numberOfToken Number of tokens to transfer
    function issueToken(address _to, uint256 _numberOfToken) private {

        tokenContract.transfer(_to, _numberOfToken);
    }


    function () external payable {}


}
