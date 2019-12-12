pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

/// @author Samuel Fabrizi
/// @title UserSkills
/// @notice This contract stores the skill values of a user
contract UserSkills {
	using SafeMath for uint;

	mapping(bytes32=>uint256)  	public 	skills;		// Structured that stores the pairs (Key, value) where Key is the skill e value is its value
	bytes32[] 					public	keys;		// array used to implement mapping iterator pattern (future work)

	event UpdatedSkill(bytes32 _skill, uint _newValue);


	/// @notice updates the value of a skill (if exists), It returns true if the skill exists, false otherwise
    /// @param _skill Skill to update
    /// @param _value Value increment
	function updateSkill(bytes32 _skill, uint _value) external returns (bool){
		bool exists = skills[_skill] != 0;
		if (!exists) {
			keys.push(_skill);
			skills[_skill] = _value;
		}
		else {
			skills[_skill] = skills[_skill].add(_value);
		}
		emit UpdatedSkill(_skill, skills[_skill]);
		return exists;
	}


	/// @notice returns the number of pairs stored
	function getSkillsNumber() external view returns(uint){
		return keys.length;
	}

	/// @notice returns the skill name stored in a specific index
    /// @param index Index of the sought skill
	function getSkillNameAtIndex(uint index) external view returns (bytes32){
		return keys[index];
	}

	/// @notice returns the value of the skill stored in a specific index
    /// @param index Index of the sought skill value
	function getSkillValueAtIndex(uint index) external view returns (uint){
		return skills[keys[index]];
	}

	/// @notice returns the value of a skill
    /// @param _skill Skill name
	function getSkillValue(bytes32 _skill) external view returns (uint){
		return skills[_skill];
	}

}