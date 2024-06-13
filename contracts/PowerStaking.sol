// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./utils/Ownable.sol";
import "./PSToken.sol";

// based on https://github.com/bepronetwork/bepro-js/blob/master/contracts/StakingContract.sol

contract PowerStaking is Pausable, Ownable {
    using SafeMath for uint256;

    mapping(uint256 => ProductAPR) public products; /* Available Products */
    uint256[] public productIds; /* Available Product Ids*/
    mapping(address => uint256[]) public mySubscriptions; /* Address Based Subcriptions */
    uint256 incrementId = 0;
    uint256 lockedTokens = 0;

    uint256 constant private year = 365 days;

    ERC20 public erc20;

    address public erc721;

    PSToken public psToken;

    struct SubscriptionAPR {
        uint256 _id;
        uint256 productId;
        uint256 startDate;
        uint256 endDate;
        uint256 amount;
        address subscriberAddress;
        uint256 APR; /* APR for this product */
        bool finalized;
        uint256 withdrawAmount;
    }

    struct ProductAPR {
        uint256 createdAt;
        uint256 startDate;
        uint256 endDate;
        uint256 totalMaxAmount;
        uint256 individualMinimumAmount;
        uint256 individualMaximumAmount; /* FIX PF */
        uint256 APR; /* APR for this product */
        uint256 currentAmount;
        bool lockedUntilFinalization; /* Product can only be withdrawn when finalized */
        address[] subscribers;
        uint256[] subscriptionIds;
    }

    /* Available Subscriptions for specific Product of type productId-subscriptionId-SubscriptionAPR mapping */
    mapping(uint256 => mapping(uint256 => SubscriptionAPR)) public subscriptions;



    constructor(address _tokenAddress, address _nftAddress, address _psTokenAddress) public {
        erc20 = ERC20(_tokenAddress);
        psToken = PSToken(_psTokenAddress);
        erc721 = _nftAddress;
    }

    /* Current Held Tokens */
    function heldTokens() public view returns (uint256) {
        return erc20.balanceOf(address(this));
    }

    /* Locked Tokens for the APR */
    function futureLockedTokens() public view returns (uint256) {
        return lockedTokens;
    }

    /* Available Tokens to the APRed by future subscribers */
    function availableTokens() public view returns (uint256) {
        return heldTokens().sub(futureLockedTokens());
    }

    

    function createProduct(
		uint256 _startDate, uint256 _endDate, 
		uint256 _totalMaxAmount, uint256 _individualMinimumAmount, uint256 _individualMaximumAmount, 
		uint256 _APR, bool _lockedUntilFinalization
	) external whenNotPaused onlyOwner returns (uint256) {

        /* Confirmations */
        require(block.timestamp < _endDate, "Err0");
        require(block.timestamp <= _startDate, "Err1");
        require(_startDate < _endDate, "Err2");
        require(_totalMaxAmount > 0, "Err3");
        require(_individualMinimumAmount > 0, "Err4");
        require(_individualMaximumAmount > 0, "Err5");
        require(_totalMaxAmount > _individualMinimumAmount, "Err6");
        require(_totalMaxAmount > _individualMaximumAmount, "Err7");
        require(_APR > 0, "Err8");

        address[] memory addressesI;
        uint256[] memory subscriptionsI;

        /* Create ProductAPR Object */
        ProductAPR memory productAPR = ProductAPR(block.timestamp, _startDate, _endDate, _totalMaxAmount, _individualMinimumAmount, _individualMaximumAmount, _APR, 0, _lockedUntilFinalization, addressesI, subscriptionsI);

        uint256 product_id = productIds.length + 1;

        /* Add Product to System */
        productIds.push(product_id);
        products[product_id] = productAPR;
        return product_id;
    }
		
    function getAPRAmount(uint256 _APR, uint256 _startDate, uint256 _endDate, uint256 _amount) public pure returns(uint256) {
        return ((_endDate.sub(_startDate)).mul(_APR).mul(_amount)).div(year.mul(100));
    }

    function getProductIds() public view returns(uint256[] memory) {
        return productIds;
    }

    function getMySubscriptions(address _address) public view returns(uint256[] memory) {
        return mySubscriptions[_address];
    }
		
	function subscribeProduct(uint256 _product_id, uint256 _amount) external whenNotPaused returns (bool) {

        uint256 time = block.timestamp;
        /* Confirm Amount is positive */
        require(_amount > 0, "Amount has to be bigger than 0");

        /* Confirm user has at least one NFT */
        if(address(erc721) != address(0)){
            require(IERC721(erc721).balanceOf(msg.sender) > 0, "Must hold at least 1 NFT");
        }

        /* Confirm product still exists */
        require(block.timestamp < products[_product_id].endDate, "Already ended the subscription");

        /* Confirm Subscription prior to opening */
        if(block.timestamp < products[_product_id].startDate){
            time = products[_product_id].startDate;
        }

        /* Confirm the user has funds for the transfer */
        require(_amount <= erc20.allowance(msg.sender, address(this)), "Spender not authorized to spend this tokens, allow first");

        /* Confirm Max Amount was not hit already */
        require(products[_product_id].totalMaxAmount > (products[_product_id].currentAmount + _amount), "Max Amount was already hit");

        /* Confirm Amount is bigger than minimum Amount */
        require(_amount >= products[_product_id].individualMinimumAmount, "Has to be highger than minimum");

        /* Confirm Amount is smaller than maximum Amount */ /* FIX PF */
        require(_amount <= products[_product_id].individualMaximumAmount, "Has to be smaller than maximum");

        uint256 futureAPRAmount = getAPRAmount(products[_product_id].APR, time, products[_product_id].endDate, _amount);

        /* Confirm the current funds can assure the user the APR is valid */
        require(availableTokens() >= futureAPRAmount, "Available Tokens has to be higher than the future APR Amount");

        /* Confirm the user has funds for the transfer */
        require(erc20.transferFrom(msg.sender, address(this), _amount), "Transfer Failed");

        /* Add to LockedTokens */
        lockedTokens = lockedTokens.add(_amount.add(futureAPRAmount));

        uint256 subscription_id = incrementId;
        incrementId = incrementId + 1;

        /* Create SubscriptionAPR Object */
        SubscriptionAPR memory subscriptionAPR = SubscriptionAPR(subscription_id, _product_id, time, products[_product_id].endDate, _amount,
        msg.sender, products[_product_id].APR, false, 0);

        /* Create new subscription */
        mySubscriptions[msg.sender].push(subscription_id);
        products[_product_id].subscriptionIds.push(subscription_id);
        subscriptions[_product_id][subscription_id] = subscriptionAPR;
        products[_product_id].currentAmount = products[_product_id].currentAmount + _amount;
        products[_product_id].subscribers.push(msg.sender);
		
		// send ps tokens for locked and future profit amounts to user/staker
		psToken.mint(msg.sender, _amount.add(futureAPRAmount));
		return true;
    }
		
    function withdrawSubscription(uint256 _product_id, uint256 _subscription_id) external whenNotPaused {

        /* Confirm Product exists */
        require(products[_product_id].endDate != 0, "Product has expired");

        /* Confirm Subscription exists */
        require(subscriptions[_product_id][_subscription_id].endDate != 0, "Product does not exist");

        /* Confirm Subscription is not finalized */
        require(subscriptions[_product_id][_subscription_id].finalized == false, "Subscription was finalized already");

        /* Confirm Subscriptor is the sender */
        require(subscriptions[_product_id][_subscription_id].subscriberAddress == msg.sender, "Not the subscription owner");

        SubscriptionAPR memory subscription = subscriptions[_product_id][_subscription_id];

        /* Confirm start date has already passed */
        require(block.timestamp > subscription.startDate, "Now is below the start date");

        /* Confirm end date for APR */
        uint256 finishDate = block.timestamp;
        /* Verify if date has passed the end date */
        if(block.timestamp >= products[_product_id].endDate){
            finishDate = products[_product_id].endDate;
        }else{
            /* Confirm the Product can be withdrawn at any time */
            require(products[_product_id].lockedUntilFinalization == false, "Product has to close to be withdrawn");
        }
				
		uint256 APRedAmount = getAPRAmount(subscription.APR, subscription.startDate, finishDate, subscription.amount);
        require(APRedAmount > 0, "APR amount has to be bigger than 0");
        uint256 totalAmount = subscription.amount.add(APRedAmount);
        uint256 totalAmountWithFullAPR = subscription.amount.add(getAPRAmount(subscription.APR, subscription.startDate, products[_product_id].endDate, subscription.amount));
        require(totalAmount > 0, "Total Amount has to be bigger than 0");

        /* Update Subscription */
        subscriptions[_product_id][_subscription_id].finalized = true;
        subscriptions[_product_id][_subscription_id].endDate = finishDate;
        subscriptions[_product_id][_subscription_id].withdrawAmount = totalAmount;

        /* Transfer funds to the subscriber address */
        require(erc20.transfer(subscription.subscriberAddress, totalAmount), "Transfer has failed");

        /* Sub to LockedTokens */
        lockedTokens = lockedTokens.sub(totalAmountWithFullAPR);
		
		// burn total ps tokens with APR staking profits
		psToken.burnFrom(subscription.subscriberAddress, totalAmountWithFullAPR);
    }

    function getSubscription(uint256 _subscription_id, uint256 _product_id) external view 
        returns (uint256, uint256, uint256, uint256, uint256, address, uint256, bool, uint256) {
        
        SubscriptionAPR memory subscription = subscriptions[_product_id][_subscription_id];

        return (subscription._id, subscription.productId, subscription.startDate, subscription.endDate,
            subscription.amount, subscription.subscriberAddress, subscription.APR, subscription.finalized, subscription.withdrawAmount);
    }

    function getProduct(uint256 _product_id) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, address[] memory, uint256[] memory){

        ProductAPR memory product = products[_product_id];

        return (product.createdAt, product.startDate, product.endDate, product.totalMaxAmount,
            product.individualMinimumAmount, product.individualMaximumAmount, product.APR, product.currentAmount, product.lockedUntilFinalization,
            product.subscribers, product.subscriptionIds
        );
    }
		
    function safeGuardAllTokens(address _address) external onlyOwner whenPaused  { /* In case of needed urgency for the sake of contract bug */
        require(erc20.transfer(_address, erc20.balanceOf(address(this))));
    }
		
    function changeTokenAddress(address _tokenAddress, address _psTokenAddress) external onlyOwner whenPaused  {
        /* If Needed to Update the Token Address (ex : token swap) */
        erc20 = ERC20(_tokenAddress);
		psToken = PSToken(_psTokenAddress);
    }
}
