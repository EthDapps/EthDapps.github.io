pragma solidity ^0.4.11;

contract SafeWallet {

  struct KeyHolder {
    // How long this keyholder has to wait before his release can be finalized.
    uint delay;
    bool active;
  }

  mapping(address => KeyHolder) public key_holders;
  address public admin;

  address public release_initiator;
  uint public release_amount;
  uint public release_date;
  bool public release_pending;

  modifier onlyAdmin () {
    require(msg.sender == admin);
    _;
  }

  modifier onlyKeyholder () {
    require(key_holders[msg.sender].active);
    _;
  }

  function SafeWallet (address initial_admin) {
    admin = initial_admin;
    // The admin has no delay.
    add_key(admin, 0);
  }

  function () payable {
    // Anyone can send Ether to this account.
  }

  function initiate_release (uint amount) onlyKeyholder {
    // Only key holders can initiate a release.
    require(!release_pending);
    require(amount <= address(this).balance);

    release_initiator = msg.sender;
    release_amount = amount;
    release_date = now + key_holders[msg.sender].delay;
    release_pending = true;
  }

  function finalize_release () onlyKeyholder {
    // Only the keyholder who initiated the release can finalize it.
    require(msg.sender == release_initiator);
    require(release_pending);
    require(now > release_date);

    release_pending = false;
    release_initiator.transfer(release_amount);
  }

  function cancel_release () onlyKeyholder {
    require(release_pending);
    // The delay of the key must be smaller than the delay of the key that initiated it.
    require(key_holders[msg.sender].delay <= key_holders[release_initiator].delay);

    release_pending = false;
  }

  function add_key (address addr, uint delay) onlyAdmin {
    key_holders[addr].delay = delay;
    key_holders[addr].active = true;
  }

  function remove_key (address addr) onlyAdmin {
    key_holders[addr].active = false;
  }

  function change_admin (address addr) onlyAdmin {
    remove_key(admin);
    admin = addr;
    add_key(addr, 0);
  }
}

contract SafeWalletFactory {

  address[] safeWallets;

  function SafeWalletFactory () {}

  function createSafeWallet (address admin) returns (address) {
    address newSafeWallet = new SafeWallet(admin);
    safeWallets.push(newSafeWallet);
    return newSafeWallet;
  }

  function createSafeWallet () returns (address) {
    return createSafeWallet(msg.sender);
  }
}
