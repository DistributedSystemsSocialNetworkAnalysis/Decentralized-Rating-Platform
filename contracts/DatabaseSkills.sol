pragma solidity >=0.4.21 <0.6.0;


import {Ownable} from "./Interfaces.sol";

/// @author Samuel Fabrizi
/// @title DatabaseSkills
/// @notice This contract stores the possibile skills available in the instance of a Rating System
contract DatabaseSkills is Ownable {

    mapping(bytes32=>bytes32)   private availableSkills;        // map that contains pairs of the form (Key, Key) where Kwy is the unique identifier of a skill
    bytes32[]                   public keys;                    // array used to implement mapping iterator pattern (future work)
    
    event SkillAdded(bytes32 newSkill);                         // Notify correct addition of new skill

    constructor(address _owner) Ownable(_owner) public {}

    /// @notice checks if the input skill is alredy stored in this contract
    /// @param _skill The sought skill
    function checkSkillExistence(bytes32 _skill) public view returns (bool) {
        if (availableSkills[_skill] == 0)
            return false;
        else
            return true;
    }
    
    /// @notice Add a new Skill to the database, only if the caller is the owner of this contract (avoid spam) and the skill isn't already stored 
    /// @param _newSkill The skill to add
    function addSkill(bytes32 _newSkill) external isOwner {
        require(checkSkillExistence(_newSkill) == false, "Skill alredy exists");
        keys.push(_newSkill);
        availableSkills[_newSkill] = _newSkill;
        emit SkillAdded(_newSkill);
    }


    /// @notice Returns the number of available skills
    function getSkillsNumber() external view returns(uint){
        return keys.length;
    }


    
}