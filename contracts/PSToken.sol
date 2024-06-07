// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Power Stake Token smart contract
 * @dev This contract extends ERC20 token with 'minter' and 'burner' roles management.
 */
contract PSToken is Context, AccessControl, ERC20 {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
		bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
		constructor(string memory _name, string memory _symbol) public ERC20(_name, _symbol) {
    	_setRoleAdmin(DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
			_setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
			_setRoleAdmin(BURNER_ROLE, DEFAULT_ADMIN_ROLE);
			
			_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
      _setupRole(MINTER_ROLE, _msgSender());
			_setupRole(BURNER_ROLE, _msgSender());
    }
		
		/**
    * @dev Throws if called by any account other than user with 'admin' role.
    * NOTE: Optimized by calling an internal function as modifiers are 'inlined'
    * and code is copy-pasted in target functions using them.
    */
    modifier adminRequired() {
        _adminRequired();
        _;
    }
		
    /**
    * @dev Throws if called by any account other than user with 'minter' role.
    * NOTE: Optimized by calling an internal function as modifiers are 'inlined'
    * and code is copy-pasted in target functions using them.
    */
    modifier minterRequired() {
        _minterRequired();
        _;
    }
		
		/**
    * @dev Throws if called by any account other than user with 'burner' role.
    * NOTE: Optimized by calling an internal function as modifiers are 'inlined'
    * and code is copy-pasted in target functions using them.
    */
    modifier burnerRequired() {
        _burnerRequired();
        _;
    }
		
		// require current msg sender to have 'admin' role, reverts otherwise
    function _adminRequired() internal view {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "AdminRole: admin role required");
    }
		
    // require current msg sender to have 'minter' role, reverts otherwise
    function _minterRequired() internal view {
        require(hasRole(MINTER_ROLE, _msgSender()), "MinterRole: minter role required");
    }
		
		// require current msg sender to have 'burner' role, reverts otherwise
    function _burnerRequired() internal view {
        require(hasRole(BURNER_ROLE, _msgSender()), "BurnerRole: burner role required");
    }

    /**
     * @dev Add minter role to address
     * Requirements:
     * - the caller must be admin
     */
    function addMinter(address to) external adminRequired {
        grantRole(MINTER_ROLE, to);
    }

    /**
     * @dev Remove minter role from address
     * Requirements:
     * - the caller must be admin 
     */
    function removeMinter(address to) external adminRequired {
        revokeRole(MINTER_ROLE, to);
    }
		
		/**
     * @dev Add burner role to address
     * Requirements:
     * - the caller must be admin
     */
    function addBurner(address to) external adminRequired {
        grantRole(BURNER_ROLE, to);
    }
		
		/**
     * @dev Remove burner role from address
     * Requirements:
     * - the caller must be admin 
     */
    function removeBurner(address to) external adminRequired {
        revokeRole(BURNER_ROLE, to);
    }
		
		
		
		/**
     * @dev Creates `amount` tokens to `account`
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     * - the caller must have minter role
     */
		function mint(address account, uint256 amount) external minterRequired {
        _mint(account, amount);
    }
		
		
		
		/**
     * @dev Destroys `amount` tokens from `account`
     *
     * See {ERC20-_burn}.
     *
     * Requirements:
     * - the caller must have burner role
     */
		function burnFrom(address account, uint256 amount) external burnerRequired {
        uint256 decreasedAllowance = allowance(account, _msgSender()).sub(amount, "ERC20: burn amount exceeds allowance");

        _approve(account, _msgSender(), decreasedAllowance);
        _burn(account, amount);
    }
}
