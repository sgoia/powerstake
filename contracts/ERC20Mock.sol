pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20 Mock
 * @dev Mock class using ERC20
 * based on Sablier's ERC20Mock contract
 */
contract ERC20Mock is ERC20 {
	
	constructor(string memory _name, string memory _symbol, uint256 amount) public ERC20(_name, _symbol) {
		_mint(msg.sender, amount);
  }
	
    /**
     * @dev Allows anyone to mint tokens to any address
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
