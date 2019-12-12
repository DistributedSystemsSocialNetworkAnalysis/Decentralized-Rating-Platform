pragma solidity >=0.4.21 <0.6.0;


import "./RatingSystem.sol";
import "./Interfaces.sol";
import "./AssetStorage.sol";
import "./RatingLibrary.sol";
import "./Item.sol";
import "./RatingFunction.sol";
import "./UserSkills.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
Attributi non hanno classi, ma interfacce

Così non si carica il contratto, ma l'interfaccia
*/

/// @author AndreaLisi, Samuel Fabrizi
/// @title User
/// @notice This contract represents a user of the RatingSystemFramework. A user can create Items
contract User is Ownable {
    using SafeMath for uint256;
    
    // Data
    bytes32                 public  name;           // Username
    address                 public  RSF;            // The RatingSystemFramework the User belongs to
    OwnableStoragePointer   private items;          // Structure to store Items published by this user
    RatingLibrary.Rating[]  public  ratingArray;    // Structure to keep track of the ratings performed by this user
    UserSkills              public skills;          // Structure to store the values of User skills

    // Events
    event ItemCreated(Item _itemContract);
    event ItemRated(Item _item, uint8 _score, uint _block, User _rater);
    event ItemPaid(User _user, Item _item, uint _amount, uint256 _totalTokenUsed);


    /// @param _name the username of the User
    /// @param _owner the address of the User
    /// @dev The constructor calls the Ownable constructor to store the owner which should be passed by the RatingSystemFramework
    constructor (bytes32 _name, address _owner) Ownable(_owner)  public {

        RSF = msg.sender;
        items = new OwnableStoragePointer(address(this));
        name = _name;
        skills = new UserSkills();
    }


    /// @notice De-activate this contract
    function destroy() external isOwner {
        // We don't assume User contracts to store ether
        selfdestruct(address(uint160(0x0))); // cast 0x0 to address payable
    }
    

    /// @notice Rate an Item and keep track of the rating
    /// @param _item The Item to rate
    /// @param _score The score to assign to that Item
    function addRate(Item _item, uint8 _score) external isOwner {

        uint _block = block.number;
        bytes32 _itemSkill = _item.skill();
        uint _valueSkill = skills.getSkillValue(_itemSkill);

        _item.addRate(_score, _valueSkill);
        ratingArray.push(RatingLibrary.Rating({ isValid: true, 
                                                score: _score, 
                                                inBlock: _block, 
                                                rated: address(_item), 
                                                rater: address(this),
                                                skillName: _itemSkill,
                                                skillValue: _valueSkill }));

        emit ItemRated(_item, _score, _block, this);
        // update the value of the user skill after he rates the item
        skills.updateSkill(_itemSkill, 1);
    }


    /// @notice Creates an Item with a name
    /// @param _name the name of the Item to create
    function createItem(bytes32 _name, 
                        bytes32 _skill, 
                        string memory _nameToken,
                        string memory _symbolToken,
                        uint256 _tokenValue 
                        ) public isOwner {

        Item item = new Item(_name, owner, RSF, _skill, _nameToken, _symbolToken, _tokenValue);
        items.insert(address(item));

        emit ItemCreated(item);
    }


    /// @notice Removes the Item
    /// @param _item the address of the Item to remove
    function deleteItem(Item _item) external isOwner {

        items.remove(address(_item));
    }


    /// @notice Get all the ratings information connected to this Item
    /// @return _scores: the array of scores
    /// @return _blocks: the array of timestamps
    /// @return _rated: the array of addresses rated by this User
    function getAllRatings() external view returns(uint[] memory _scores, 
                                                    uint[] memory _blocks, 
                                                    address[] memory _rated) {

        uint ratingCount = ratingArray.length;

        _scores = new uint[](ratingCount);
        _blocks = new uint[](ratingCount);
        _rated = new address[](ratingCount);

        for(uint i=0; i<ratingCount; i++) {

            _scores[i] = ratingArray[i].score;
            _blocks[i] = ratingArray[i].inBlock;
            _rated[i] = ratingArray[i].rated;
        }
    }


    /// @notice Get all the Item of this User
    /// @return The array of Item
    function getItems() external view returns(address[] memory) {

        return items.getAssets();
    }


    /// @notice Check whether an Item belongs to this User
    /// @param _item The item to check
    /// @return True if the Item belongs to this User; false otherwise
    function isIn(address _item) external view returns(bool) {

        return items.isIn(_item);
    }


    /// @notice Check if I am a registered User of my RatingSystemFramework
    function iAmRegisteredUser() external view returns(bool) {

        RatingSystemFramework rsf = RatingSystemFramework(RSF);
        return rsf.isIn(this);
    }
    

    /// @notice Get the number of Item deployed by this User
    /// @return The number of Item
    function itemCount() external view returns(uint) {

        return items.getCount();
    }


    /// @notice Send a payment to an Item
    /// @param _item The Item that receives the payment
    /// @param _amount The amount to be sent to that specific Item
    /// @dev This function does not return back the change (_amount - totalTokenValueAmount). The User contract keeps it
    function payItem(Item _item, uint _amount) public payable {

        require(_amount > 0, "The amount must be greater then 0");
        require(_amount == msg.value, "The amount to be sent does not match");
        address payable item = address(uint160(address(_item)));
        uint256 totalTokenAmount = _item.getTokenOwned();
        uint256 totalTokenValueAmount = _item.getTokenOwnedValue();
        // Boring inequalities to checks all possible cases
        if (totalTokenValueAmount <= _amount) {
            _amount -= totalTokenValueAmount;
            _item.tokenContract().approve(address(_item), totalTokenAmount);    // return tokens to the item: item can withdraw from the User's "balance"
            item.transfer(_amount);
            _item.successfulPayment(this, _amount, totalTokenAmount);
        }
        else {
            totalTokenValueAmount -= _amount;
            totalTokenAmount = (totalTokenValueAmount / _item.tokenValue()) + 1; // tokens > price: return part of the tokens back to the item
            _item.tokenContract().approve(address(_item), totalTokenAmount);
            _item.successfulPayment(this, 0, totalTokenAmount);                  // User payed nothing: all was "payed" with tokens
        }
        
        emit ItemPaid(this, _item, _amount, totalTokenAmount);
    }



    /// @notice updates the value of a skill
    /// @param _skill2update Skill to update
    /// @param _value Value increment
    function updateSkill(bytes32 _skill2update, uint _value) external {
        
        skills.updateSkill(_skill2update, _value);
    }


}
