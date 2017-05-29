pragma solidity ^0.4.11;

contract LayeredWallet {

    struct KeyHolder {
        // How long this keyholder has to wait before his release can be finalized.
        uint delay;
        bool active;
    }

    struct Transaction {
        // Address of the account that initiated the transaciton. This address must
        // also call 'executeTransaction'.
        address initiator;
        address destination;
        // The transaction can be executed after this date.
        uint releaseDate;
        uint value;
        bytes data;
        bool executed;
        bool canceled;
    }

    event Submission(uint indexed transactionId);
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);
    event Deposit(address indexed sender, uint value);

    mapping(address => KeyHolder) public keyHolders;
    mapping(uint => Transaction) public transactions;
    address public admin;
    uint public transactionCount;

    modifier onlyAdmin() {
        require(msg.sender == admin);
        _;
    }

    modifier onlyKeyholder() {
        require(keyHolders[msg.sender].active);
        _;
    }

    function LayeredWallet(address initialAdmin) {
        admin = initialAdmin;
        // The admin has no delay.
        addKey(admin, 0);
    }


    /// Fallback function allows to deposit ether.
    function () payable {
        if (msg.value > 0) Deposit(msg.sender, msg.value);
    }

    function initiateTransaction(address destination, uint value, bytes data)
        public
        onlyKeyholder
        returns (uint transactionId)
    {
        require(keyHolders[msg.sender].active);
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            initiator: msg.sender,
            destination: destination,
            releaseDate: now + keyHolders[msg.sender].delay,
            value: value,
            data: data,
            executed: false,
            canceled: false
        });
        transactionCount += 1;
        Submission(transactionId);
    }

    function executeTransaction(uint transactionId)
        public
        onlyKeyholder
    {
        Transaction tx = transactions[transactionId];
        require(!tx.executed);
        require(!tx.canceled);
        require(now > tx.releaseDate);
        require(msg.sender == tx.initiator);
        tx.executed = true;
        if (tx.destination.call.value(tx.value)(tx.data)) {
            Execution(transactionId);
        } else {
            ExecutionFailure(transactionId);
            tx.executed = false;
        }
    }

    function cancelTransaction(uint transactionId)
        public
        onlyKeyholder
    {
        Transaction tx = transactions[transactionId];
        require(!tx.executed);
        require(!tx.canceled);
        // The delay of the key that's trying to cancel the transaction must be smaller
        // than the delay of the key that initiated it.
        require(keyHolders[msg.sender].delay <= keyHolders[tx.initiator].delay);
        tx.canceled = true;
    }

    function substituteSelf(address newAddr)
        public
        onlyKeyholder
    {
        require(!keyHolders[newAddr].active);
        keyHolders[msg.sender].active = false;
        keyHolders[newAddr].active = true;
        keyHolders[newAddr].delay = keyHolders[msg.sender].delay;
    }

    function increaseDelay(uint newDelay)
        public
        onlyKeyholder
    {
        // The delay can only be increased for self.
        require(newDelay > keyHolders[msg.sender].delay);
        keyHolders[msg.sender].delay = newDelay;
    }

    function changeDelay(address addr, uint newDelay)
        public
        onlyAdmin
    {
        require(keyHolders[addr].active);
        keyHolders[addr].delay = newDelay;
    }

    function addKey(address addr, uint delay)
        onlyAdmin
    {
        keyHolders[addr].delay = delay;
        keyHolders[addr].active = true;
    }

    function removeKey(address addr)
        onlyAdmin
    {
        require(keyHolders[addr].active);
        keyHolders[addr].active = false;
    }

    function changeAdmin(address addr)
        onlyAdmin
    {
        removeKey(admin);
        admin = addr;
        addKey(addr, 0);
    }
}

contract LayeredWalletFactory {

    address[] wallets;

    function LayeredWalletFactory () {}

    function createWallet(address admin)
        returns (address)
    {
        address wallet = new LayeredWallet(admin);
        wallets.push(wallet);
        return wallet;
    }

    function createWallet()
        returns (address)
    {
        return createWallet(msg.sender);
    }
}
