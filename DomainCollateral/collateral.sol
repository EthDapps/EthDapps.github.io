
/**
 * @title Deed to hold ether in exchange for ownership of a node
 * @dev The deed can be controlled only by the registrar and can only send ether back to the owner.
 */
contract Deed {
    address public registrar;
    address constant burn = 0xdead;
    uint public creationDate;
    address public owner;
    address public previousOwner;
    uint public value;
    event OwnerChanged(address newOwner);
    event DeedClosed();


    modifier onlyRegistrar {
        if (msg.sender != registrar) throw;
        _;
    }

    modifier onlyActive {
        if (!active) throw;
        _;
    }

    function Deed(address _owner) payable {
        owner = _owner;
        registrar = msg.sender;
        creationDate = now;
        active = true;
        value = msg.value;
    }

    function setOwner(address newOwner) onlyRegistrar {
        if (newOwner == 0) throw;
        previousOwner = owner;  // This allows contracts to check who sent them the ownership
        owner = newOwner;
        OwnerChanged(newOwner);
    }

    function setRegistrar(address newRegistrar) onlyRegistrar {
        registrar = newRegistrar;
    }

    function setBalance(uint newValue, bool throwOnFailure) onlyRegistrar onlyActive {
        // Check if it has enough balance to set the value
        if (value < newValue) throw;
        value = newValue;
        // Send the difference to the owner
        if (!owner.send(this.balance - newValue) && throwOnFailure) throw;
    }

    /**
     * @dev Close a deed and refund a specified fraction of the bid value
     *
     * @param refundRatio The amount*1/1000 to refund
     */
    function closeDeed(uint refundRatio) onlyRegistrar onlyActive {
        active = false;
        if (! burn.send(((1000 - refundRatio) * this.balance)/1000)) throw;
        DeedClosed();
        destroyDeed();
    }

    /**
     * @dev Close a deed and refund a specified fraction of the bid value
     */
    function destroyDeed() {
        if (active) throw;
        
        // Instead of selfdestruct(owner), invoke owner fallback function to allow
        // owner to log an event if desired; but owner should also be aware that
        // its fallback function can also be invoked by setBalance
        if (owner.send(this.balance)) {
            selfdestruct(burn);
        }
    }
}


contract Collateral {

    enum State { Nothing, StartedBorrowing, Available, LenderPaidBack }

    struct BorrowEntry {
        // Address of the deed in question
        Deed deed;
        // The owner of the deed who wants to borrow Ether.
        address deedOwner;
        address lender;
        // How much the deed owner wants to borrow
        uint etherRequested;
        // The amount the deed owner needs to pay back
        uint paybackAmount;
        // By what timestamp the deedOwner must pay back.
        uint paybackBy;

        State state;
    }

    Registrar registrar;

    BorrowEntry public entries;

    // Mapping from Deed to BorrowEntry
    mapping(deed => BorrowEntry) entries;

    function startBorrowing(bytes32 _hash,,
                            uint etherRequested, 
                            uint payBackAmount, 
                            uint payBackBy) {
        Deed deed = registrar.entries(_hash);
        if (msg.sender != deed.previousOwner) throw;
        if (entries[deed].state != State.Nothing) throw;
        if (deed.owner != address(this)) throw;
        BorrowEntry entry = entries[deed];
        entry.deed = deed;
        entry.deedOwner = deed.previousOwner;
        entry.enterRequested = etherRequested;
        entry.payBackAmount = payBackAmount;
        entry.payBackBy = payBackBy;
        entry.state = State.StartedBorrowing;
    }

    function cancelBorrowing(bytes32 _hash) {
        Deed deed = registrar.entries(_hash);
        if (msg.sender != deed.previousOwner) throw;
        BorrowEntry entry = entries[deed];
        if (entry.state != State.StartedBorrowing) throw;
        entry.state = State.Nothing;
    }

    function getDeedBack(Deed deed) {
        // Only previous owner of the deed can call this.
        if (entries[deed].state != State.Nothing) throw;
        if (msg.sender != deed.previousOwner) throw;
        registrar.transfer



    }

    function lendEther() {
        // Anyone can call this function. They need to send etherRequested amount.
    }

    function payBack() {
        // The original owner sends paybackAmount to the contract and can reclaim their domain
        // The name gets transferred back to the deedOwner
    }

    function lenderClaim() {
        // After the owner paid back, the lender can withdraw paybackAmount
    }

    function ownerFailedToPayBack() {
        // If lendingPeriod expired, the lender can transfer the domain to himself
    }


}
