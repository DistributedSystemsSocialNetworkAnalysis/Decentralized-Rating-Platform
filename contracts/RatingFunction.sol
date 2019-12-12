pragma solidity >=0.4.21 <0.6.0;

/// @author Andrea Lisi, Samuel Fabrizi
/// @title RatingFunction
/// @notice This contract interface defines the method to compute the final score of a list of scores
interface RatingFunction {

    modifier haveEqualLength(uint[] memory _s, uint[] memory _b) {

        require(_s.length == _b.length);
        _;
    }

    /// @notice Compute     the final score given a bundle of rating information
    /// @param _scores      The array of scores
    /// @param _blocks      The array of blocks containing the scores
    /// @param _valuesSkill The array of values about skill of item rated
    function compute(uint[] calldata _scores, 
                     uint[] calldata _blocks,
                     uint[] calldata _valuesSkill
                     ) external pure returns(uint);
}


/// @title SimpleAverageFunction
/// @notice Compute the final score with simple average on the score values
contract SimpleAvarageFunction is RatingFunction {
    
    /// @notice Compute     the final score given a bundle of rating information
    /// @param _scores      The array of scores
    /// @param _blocks      The array of blocks containing the scores
    /// @param _valuesSkill The array of values about skill of item rated
    function compute(uint[] calldata _scores, 
                     uint[] calldata _blocks,
                     uint[] calldata _valuesSkill) haveEqualLength(_scores, _blocks) external pure returns(uint) {

        uint len = _scores.length;

        if (len <= 0) 
            return 0;
 
        // Simple average
        uint total = 0;

        for (uint i=0; i<len; i++)
            total += _scores[i];

        return total / len;
    }
}


/// @title WeightedAverageFunction
/// @notice Compute the final score with a weighted average using the blocks
contract WeightedAverageFunction is RatingFunction {

    /// @notice Compute     the final score given a bundle of rating information
    /// @param _scores      The array of scores
    /// @param _blocks      The array of blocks containing the scores
    /// @param _valuesSkill The array of values about skill of item rated
    function compute(uint[] calldata _scores, 
                     uint[] calldata _blocks,
                     uint[] calldata _valuesSkill
                     ) haveEqualLength(_scores, _blocks) external pure returns(uint) {

        uint len = _scores.length;

        if (len <= 0) 
            return 0;
 
        // Weighted average w.r.t. blocks
        uint last = _blocks[len-1];
        uint weightedScore = 0;
        uint weightSum = 0;

        for (uint i=0; i<len; i++) {

            uint s = _scores[i];
            uint b = _blocks[i];
            uint weight = (b*100)/last;

            weightedScore += s * weight;
            weightSum += weight;
        }

        if (weightSum == 0 || weightedScore == 0)
            return 0;

        return weightedScore / weightSum;
    }
}


/// @title WeightedAverageFunction
/// @notice Compute the final score with a weighted average using the skill values
contract WeightedAverageSkillFunction is RatingFunction {

    /// @notice Compute     the final score given a bundle of rating information
    /// @param _scores      The array of scores
    /// @param _blocks      The array of blocks containing the scores
    /// @param _valuesSkill The array of values about skill of item rated
    function compute(uint[] calldata _scores, 
                     uint[] calldata _blocks,
                     uint[] calldata _valuesSkill
                     ) haveEqualLength(_scores, _valuesSkill) external pure returns(uint) {
        
        uint len = _scores.length;

        if (len <= 0) 
            return 0;

        // Weighted average based on skill values 
        uint totalWeight = 0;
        uint totalValues = 0;        

        for (uint i=0; i<len; i++){
            totalValues += _valuesSkill[i];
            totalWeight += _scores[i]*_valuesSkill[i];
        }
        if (totalValues == 0 || totalWeight == 0)
            return 0;
        return totalWeight / totalValues;
    }
    
}

/// @title BlocksAndSkillsWeightFunction
/// @notice Compute the final score with a weighted average using the blocks and skill values
/// @dev Array as parameter is needed to avoid StackTooDeep exception due to many local variables 
contract BlocksAndSkillsWeightFunction is RatingFunction {

    /// @notice Compute     the final score given a bundle of rating information
    /// @param _scores      The array of scores
    /// @param _blocks      The array of blocks containing the scores
    /// @param _valuesSkill The array of values about skill of item rated
    function compute(uint[] calldata _scores, 
                     uint[] calldata _blocks,
                     uint[] calldata _valuesSkill
                     ) haveEqualLength(_scores, _blocks)
                       haveEqualLength(_scores, _valuesSkill) external pure returns(uint result) {

        uint[5] memory data;

        data[0] = 0;                      // i      : iterator
        data[1] = _scores.length;         // len    : number of scores
        data[2] = _blocks[ data[1] -1];   // last   : last block value

        for (data[0] = 0; data[0] < data[1]; data[0]++){

            uint s = _scores[ data[0] ];
            uint b = _blocks[ data[0] ];
            uint v = _valuesSkill[ data[0] ];
            uint weight = (b*v*100) / data[2];

            data[3] += weight;             // sum of weights
            data[4] += weight * s;         // Weighted sum of scores 
        }

        if (data[3] == 0 || data[4] == 0)
            return 0;
        
        result = data[4] / data[3];         // Weighted sum / sum of weights
    }
}