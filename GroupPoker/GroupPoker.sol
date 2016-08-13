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

    // Account that holds chips.
    TokenInterface token_interface;

    Game[] public games;

    struct Game {
        Stages stage;
        uint ante_size;
        mapping(address => bytes32) hidden_hands;
        mapping(address => bytes32) hidden_bids;
        mapping(address => bytes32) hidden_calls;
        mapping(address => uint) max_bid_amounts;
        mapping(address => bool) eligible_to_win;
        bytes32 hand_shift;
        address bettor;
        uint bet_size;
        uint pot_size;
        uint best_hand;
        address winner;
        uint time_of_last_stage_change;
        uint time_per_stage;
    }

    function next_stage(Game g) internal {
        if (now > g.time_of_last_stage_change + g.time_per_stage) {
            g.stage = Stages(uint(g.stage) + 1);
            g.time_of_last_stage_change = now;
        }
    }

    
    function calculate_hand(uint hand, bytes32 hand_shift) constant returns (uint) {
        return uint(sha3(hand, hand_shift));
    }

    function get_current_hand_value(uint game_num, uint hand) constant returns(uint) {
        Game g = games[game_num];
        return calculate_hand(hand, g.hand_shift);
    }

    function GroupPoker(TokenInterface token_interface_) {
        token_interface = token_interface_;
    }

    function new_game(uint ante_size_, uint time_per_stage_) {
        games.length++;
        Game g = games[games.length - 1];
        g.ante_size = ante_size_;
        g.time_of_last_stage_change = now;
        g.time_per_stage = time_per_stage_;
    }

    function submit_hidden_hand(uint game_num, bytes32 hidden_hand) {
        Game g = games[game_num];
        next_stage(g);
        if (g.stage != Stages.submit_hidden_hand) {
            throw;
        }
        g.hidden_hands[msg.sender] = hidden_hand;
        g.hand_shift = sha3(g.hand_shift, block.blockhash(block.number));
        g.pot_size += g.ante_size;
        bool result = token_interface.transferFrom(msg.sender, address(this), g.ante_size);
        if (!result) {
            throw;
        }
    }

    function submit_hidden_bid(uint game_num, uint max_bid_amount, bytes32 hidden_bid) {
        Game g = games[game_num];
        next_stage(g);
        if (g.stage != Stages.submit_hidden_bid) {
            throw;
        }
        g.hidden_bids[msg.sender] = hidden_bid;
        g.max_bid_amounts[msg.sender] = max_bid_amount;
        g.pot_size += max_bid_amount;
        bool result = token_interface.transferFrom(msg.sender, address(this), max_bid_amount);
        if (!result) {
            throw;
        }
    }

    function reveal_bid(uint game_num, uint bid_amount, bytes32 nonce) {
        Game g = games[game_num];
        next_stage(g);
        if (g.stage != Stages.reveal_bid) {
            throw;
        }
        if (sha3(bid_amount, nonce) != g.hidden_bids[msg.sender] || bid_amount > g.max_bid_amounts[msg.sender]) {
            throw;
        }
        uint refund_amount = g.max_bid_amounts[msg.sender] - bid_amount;
        if (bid_amount > g.bet_size) {
            g.bet_size = bid_amount;
            g.eligible_to_win[g.bettor] = false;
            g.bettor = msg.sender;
            g.eligible_to_win[msg.sender] = true;
        }
        if (refund_amount > 0) {
            g.pot_size -= refund_amount;
            bool result = token_interface.transfer(msg.sender, refund_amount);
            if (!result) {
                throw;
            }
        }
    }

    function submit_hidden_call(uint game_num, bytes32 hidden_call) {
        Game g = games[game_num];
        next_stage(g);
        if (g.stage != Stages.submit_hidden_call) {
            throw;
        }
        if (g.eligible_to_win[msg.sender]) {
            throw;
        }
        g.hidden_calls[msg.sender] = hidden_call;
        g.pot_size += g.bet_size;
        bool result = token_interface.transferFrom(msg.sender, address(this), g.bet_size);
        if (!result) {
            throw;
        }
    }

    function reveal_call(uint game_num, bool call, bytes32 nonce) {
        Game g = games[game_num];
        next_stage(g);
        if (g.stage != Stages.reveal_call) {
            throw;
        }
        if (sha3(call, nonce) != g.hidden_calls[msg.sender]) {
            throw;
        }
        if (call) {
            g.eligible_to_win[msg.sender] = true;
        } else {
            g.pot_size -= g.bet_size;
            bool result = token_interface.transfer(msg.sender, g.bet_size);
            if (!result) {
                throw;
            }
        }
    }
    
    function reveal_hand(uint game_num, uint hand, bytes32 nonce) returns (bool success)  {
        Game g = games[game_num];
        next_stage(g);
        if (g.stage != Stages.reveal_hand) {
            throw;
        }
        if (sha3(hand, nonce) != g.hidden_hands[msg.sender]) {
            throw;
        }
        if (!g.eligible_to_win[msg.sender]) {
            throw;
        }
        uint hand_value = calculate_hand(hand, g.hand_shift);
        if (hand_value <= g.best_hand) {
            return false;
        }
        g.best_hand = hand_value;
        g.winner = msg.sender;
        return true;
    }

    function collect_winnings(uint game_num) {
        Game g = games[game_num];
        if (g.stage == Stages.reveal_hand) {
            next_stage(g);
        }
        if (g.stage != Stages.collect_winnings) {
            throw;
        }
        if (msg.sender != g.winner) {
            throw;
        }
        g.stage = Stages.finished;
        token_interface.transfer(msg.sender, g.pot_size);
    }
}
