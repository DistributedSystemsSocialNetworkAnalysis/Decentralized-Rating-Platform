pragma solidity >=0.4.21 <0.6.0;

/// @author Andrea Lisi, Samuel Fabrizi
library RatingLibrary {

    // Rating data bundle
    struct Rating {
        bool isValid;
        uint8 score;
        address rater;
        address rated;
        uint inBlock;
        bytes32 skillName;
        uint skillValue;
        // Other data to define
    }
}
