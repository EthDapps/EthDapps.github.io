contract TokenInterface {

    /// @return total amount of tokens
    function totalSupply() constant returns (uint256 supply) {}

    /// @param _owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address _owner) constant returns (uint256 balance) {}

    /// @notice send `_value` token to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address _to, uint256 _value) returns (bool success) {}

    /// @notice send `_value` token to `_to` from `_from` on the condition it is approved by `_from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {}

    /// @notice `msg.sender` approves `_addr` to spend `_value` tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _value The amount of wei to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address _spender, uint256 _value) returns (bool success) {}

    /// @param _owner The address of the account owning tokens
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {}

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract GroupPoker {

    enum Stages {
        submit_hidden_hand,
        submit_hidden_bid,
        reveal_bid,
        submit_hidden_call,
        reveal_call,
        reveal_hand,
        collect_winnings,
        finished
    }

    uint constant MAX_NUM = 1000000;
    TokenInterface token_interface;

    Game[] public games;

    struct Game {
        Stages stage;
        uint ante_size;
        mapping(address => bytes32) hidden_hands;
        mapping(address => bytes32) hidden_bids;
        mapping(address => uint) max_bid_amounts;
        uint bet_size;
        address bettor;
    }

    function GroupPoker(TokenInterface token_interface_) {
        token_interface = token_interface_;
    }

    function submit_hidden_hand(uint game_num, bytes32 hidden_hand) {
        Game g = games[game_num];
        if (g.stage != Stages.submit_hidden_hand) {
            throw;
        }
        // transfer ante from player's account
        result = token_interface.transferFrom(msg.sender, address(this), g.ante_size);
        if (!result) {
            throw;
        }
        g.hidden_hands[msg.sender] = hidden_hand;
    }

    function submit_hidden_bid(uint game_num, uint max_bid_amount, bytes32 hidden_bid) {
        Game g = games[game_num];
        if (g.stage != Stages.submit_hidden_bid) {
            throw;
        }
        result = token_interface.transferFrom(msg.sender, address(this), max_bid_amount);
        if (!result) {
            throw;
        }
        g.hidden_bids[msg.sender] = hidden_bid;
        g.max_bid_amounts[msg.sender] = max_bid_amount;
    }

    function reveal_bid(uint game_num, uint bid_amount, bytes32 nonce) {
        Game g = games[game_num];
        if (g.stage != Stages.reveal_bid) {
            throw;
        }
        if (sha3(bid_amount, nonce) != g.hidden_bids[msg.sender] || bid_amount > g.max_bid_amounts[msg.sender]) {
            throw;
        }
        uint refund_amount = g.max_bid_amounts[msg.sender] - bid_amount;
        if (bid_amount > g.bet_size) {
            g.bet_size = bid_amount;
            g.bettor = msg.sender;
        }
        if (refund_amount > 0) {
            result = token_interface.transfer(msg.sender, refund_amount);
            if (!result) {
                throw;
            }
        }
    }

    function submit_hidden_call(uint game_num, 

    // 
    // all pay auction, the highest amount is the bet that everyone has to match

    // multiple games

    //public is generated from block hash + maybe tx id, maybe submitter address
}
