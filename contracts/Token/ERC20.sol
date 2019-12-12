pragma solidity ^0.5.0;

import "./IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @author Samuel Fabrizi
/// @title ERC20
/// @notice This contract represents an ERC20 token  
contract ERC20 is IERC20 {
    using SafeMath for uint256;

	string                                          public name;                    // token name
    string                                          public symbol;                  // symbol of token
    uint256                                         public _totalSupply;            // total supply
    mapping(address => uint256)                     public _balances;               // map of balances
    mapping(address => mapping(address => uint256)) public _allowance;              // map of allowance 
    

    
    constructor (string memory _name, string memory _symbol, uint256 _initialSupply) public {
        name = _name;
        symbol = _symbol;
        _balances[msg.sender] = _initialSupply;
        _totalSupply = _initialSupply;
    }

    
    function totalSupply() external view returns (uint256){
        
        return _totalSupply;
    }

    
    function balanceOf(address account) external view returns (uint256){

        return _balances[account];
    }


    function allowance(address owner, address spender) external view returns (uint256){

        return _allowance[owner][spender];
    }


    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_balances[msg.sender] >= _value);
        
        _balances[msg.sender] = _balances[msg.sender].sub(_value);
        _balances[_to] = _balances[_to].add(_value);
        
        emit Transfer(msg.sender, _to, _value);
        
        return true;
    }
    

    function approve(address _spender, uint256 _value) public returns (bool){
        _allowance[msg.sender][_spender] = _value;
        
        emit Approval(msg.sender, _spender, _value);
        
        return true;
    }
    

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool){
        require(_balances[_from] >= _value);
        require(_allowance[_from][msg.sender] >= _value);
        
        _balances[_from] = _balances[_from].sub(_value);
        _balances[_to] = _balances[_to].add(_value);
        
        _allowance[_from][msg.sender] = _allowance[_from][msg.sender].sub(_value);
        
        emit Transfer(_from, _to, _value);
        
        return true;
    }


}