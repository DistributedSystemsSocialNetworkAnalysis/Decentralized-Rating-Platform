pragma solidity >=0.4.21 <0.6.0;


/// @author Andrea Lisi
/// @title Ownable
/// @notice This contract keeps the information of its owner, passed as parameter to the constructor. It provides a modifier to let only the owner to pass its guard
contract Ownable {

    address public owner;

    constructor (address _owner) public {

        owner = _owner;
    }

    modifier isOwner() {

        require(msg.sender == owner, "Not the owner");
        _;
    }

    /// @notice This function provides the possibility to change the owner
    /// @param _to The new owner of this contract 
    function changeOwner(address _to) external isOwner {

        owner = _to;
    }
}


/// @title Permissioned
/// @notice This contract defines a permission policy and provides the functions to grant/revoke permissions to certain users/contracts. A Permissioned contract should be a contract with the purpouse to be accessed only by authorized entities
contract Permissioned is Ownable {

    // The policies defined for this contract
    struct PermissionPolicy {
        
        bool granted;
        uint periodStart;
    }

    // For each address we have a PermissionPolicy defined
    mapping(address => PermissionPolicy) public permissionMap;
    uint constant interval = 100000; // 100K blocks, if 14 sec per block, then more or less 16 days

    // Events
    event NewPermission(address _to);
    event PermissionRevoked(address _to);

    constructor (address _owner) Ownable(_owner) public {}

    /// @notice Grant the permission to access to this contract to a certain address (contract or EOA)
    /// @param _to The address meant to have permission
    /// @dev The owner of this contract cannot grant permission to itself 
    function grantPermission(address _to) public isOwner {

        require(_to != owner, "The owner cannot grant permission to himself");

        permissionMap[_to] = PermissionPolicy({granted: true, periodStart: block.number});

        emit NewPermission(_to);
    }

    /// @notice Revoke the permission to access to this contract to a certain address (contract or EOA)
    /// @param _to The address to revoke permission
    /// @dev Only the owner of this contract or the receiver itself can revoke the permission to the receiver
    function revokePermission(address _to) public {

        require(msg.sender == _to || msg.sender == owner, "You cannot revoke permission to other users");

        permissionMap[_to] = PermissionPolicy({granted: false, periodStart: 0});

        emit PermissionRevoked(_to);
    }

    /// @notice Check the permission status of a certain address
    /// @param _of The address to check
    /// @dev 0: Permission granted; 1: No permission granted; 2: Permission granted but out of date
    function checkForPermission(address _of) public view returns (uint) {

        PermissionPolicy memory policy = permissionMap[_of];

        if (policy.granted == false) 
            return 1; // No permission to rate
        if (policy.periodStart + interval < block.number) 
            return 2; // Out of date

        return 0;
    }

    /// @notice Get current permission policy of the caller
    /// @return _deadline: the deadline period (block number)
    /// @return _granted: the flag "permission granted"
    function getPolicy(address _of) external view returns(uint _deadline, bool _granted) {

        _deadline = permissionMap[_of].periodStart + interval;
        _granted = permissionMap[_of].granted;
    }
}

/// @notice Similar to Permissioned but with a different semantic. This contract stores a commitment of user => amount that means
/// "This address owns me "amount" "
contract Commited is Ownable {

    struct CommitmentPolicy {        
        bool granted;
        uint amount;
    }

    mapping(address => CommitmentPolicy) public commitmentMap;

    event NewCommitment(address _to, uint _amount);
    event CommitmentRevoked(address _to);

    /// @notice Store a new commitment from the sender
    /// @param _to The commited address
    /// @param _amount The commited amount
    function commitPermission(address _to, uint _amount) public isOwner {

        require(_to != owner, "The owner cannot grant permission to himself");

        commitmentMap[_to] = CommitmentPolicy({granted: true, amount: _amount});

        emit NewCommitment(_to, _amount);
    }

    /// @notice Revoke the commitment
    /// @param _to The commited address
    /// @dev Only the owner of this contract or the receiver itself can revoke the permission to the receiver
    function revokeCommitment(address _to) public {

        require(msg.sender == _to || msg.sender == owner, "You cannot revoke permission to other users");

        commitmentMap[_to] = CommitmentPolicy({granted: false, amount: 0});

        emit CommitmentRevoked(_to);
    }

    /// @notice Check if an address has commited a certain amount
    /// @param _of The address to check
    /// @param _amount The amount to check
    function isCommited(address _of, uint _amount) public view returns (bool) {

        CommitmentPolicy memory policy = commitmentMap[_of];

        if(policy.amount == _amount && policy.granted == true)
            return true;
        else
            return false;
    }

}

