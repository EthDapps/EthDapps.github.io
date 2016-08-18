$(function(){
    var contract_address = "0x0922A3B1B3DDD5DC681C5290374A92F9e8D4FA65";

    var contractABI = [{"constant":true,"inputs":[{"name":"a","type":"bool"},{"name":"b","type":"bytes32"}],"name":"constant_sha3_bool_bytes32","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"games","outputs":[{"name":"stage","type":"uint8"},{"name":"ante_size","type":"uint256"},{"name":"num_players","type":"uint256"},{"name":"hand_shift","type":"bytes32"},{"name":"bettor","type":"address"},{"name":"bet_size","type":"uint256"},{"name":"pot_size","type":"uint256"},{"name":"best_hand","type":"uint256"},{"name":"winner","type":"address"},{"name":"time_of_last_stage_change","type":"uint256"},{"name":"time_per_stage","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"},{"name":"hand","type":"uint256"}],"name":"get_current_hand_value","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"bid_amount","type":"uint256"},{"name":"nonce","type":"bytes32"}],"name":"reveal_bid","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"hand","type":"uint256"},{"name":"hand_shift","type":"bytes32"}],"name":"calculate_hand","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"hidden_call","type":"bytes32"}],"name":"submit_hidden_call","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"get_time_per_stage","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"}],"name":"collect_winnings","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"get_hand_shift","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"hand","type":"uint256"},{"name":"nonce","type":"bytes32"}],"name":"comb_sha3_uint_bytes32","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"hand","type":"uint256"},{"name":"nonce","type":"bytes32"}],"name":"reveal_hand","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"get_stage","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"max_bid_amount","type":"uint256"},{"name":"hidden_bid","type":"bytes32"}],"name":"submit_hidden_bid","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"a","type":"uint256"},{"name":"b","type":"bytes32"}],"name":"constant_sha3_uint_bytes32","outputs":[{"name":"","type":"bytes32"}],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"get_time_of_last_stage_change","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"call","type":"bool"},{"name":"nonce","type":"bytes32"}],"name":"reveal_call","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"ante_size_","type":"uint256"},{"name":"time_per_stage_","type":"uint256"}],"name":"new_game","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"hidden_hand","type":"bytes32"}],"name":"submit_hidden_hand","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"}],"name":"manual_next_stage","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"bid_amount","type":"uint256"},{"name":"nonce","type":"bytes32"}],"name":"reveal_bid_test","outputs":[],"type":"function"},{"inputs":[{"name":"token_interface_","type":"address"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"hidden_hand","type":"bytes32"}],"name":"LogPlayerJoined","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"max_bid_amount","type":"uint256"},{"indexed":false,"name":"hidden_bid","type":"bytes32"}],"name":"LogHiddenBid","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"bid_amount","type":"uint256"},{"indexed":false,"name":"nonce","type":"bytes32"}],"name":"LogBidRevealed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"hidden_call","type":"bytes32"}],"name":"LogHiddenCall","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"call","type":"bool"},{"indexed":false,"name":"nonce","type":"bytes32"}],"name":"LogCallRevealed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"hand","type":"uint256"},{"indexed":false,"name":"nonce","type":"bytes32"}],"name":"LogHandRevealed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"game_num","type":"uint256"},{"indexed":true,"name":"player","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"LogWinningsCollected","type":"event"}];

    if(typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {
      // If there's a web3 library loaded, then make your own web3
      web3 = new Web3(web3.currentProvider);
    } else if (typeof Web3 !== 'undefined') {
      // If there isn't then set a provider
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    var generate_bytes32 = function() {
        return web3.sha3("hello").substring(2, 66);
    }

    var contract_interface = web3.eth.contract(contractABI);
    var contract = contract_interface.at(contract_address);

    var player_array = [];
    var player_map = {};

    var initialize_player = function(player_address) {
        if (!(player_address in player_map)) {
            player_map[player_address] = {
                address: player_address,
                bid_amount: "",
                call: "",
                collected_amount: "",
                hand: "",
                hidden_call: "",
                hidden_hand: "",
                max_bid_amount: ""};
            player_array.push(player_address);
        }
    }

    var cur_game_num = 2;

    var player_joined_event = contract.LogPlayerJoined({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    player_joined_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].hidden_hand = result.args.hidden_hand;
        }
    });

    var player_bid_event = contract.LogHiddenBid({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    player_bid_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].max_bid_amount = result.args.max_bid_amount;
        }
    });

    var reveal_bid_event = contract.LogBidRevealed({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    reveal_bid_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].bid_amount = result.args.bid_amount;
        }
    });

    var hidden_call_event = contract.LogHiddenCall({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    hidden_call_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].hidden_call = true;
        }
    });

    var call_revealed_event = contract.LogCallRevealed({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    call_revealed_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].call = result.args.call;
        }
    });

    var hand_revealed_event = contract.LogHandRevealed({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    hand_revealed_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].hand = result.args.hand;
        }
    });

    var collected_event = contract.LogWinningsCollected({game_num: cur_game_num}, {fromBlock: 0, toBlock: 'latest'});
    collected_event.watch(function(error, result) {
        if (!error) {
            initialize_player(result.args.player);
            player_map[result.args.player].collected_amount = result.args.amount;
        }
    });

    BigNumber.config({ EXPONENTIAL_AT: 500});

    var refresh_player_table = function() {
        $('#player_table').find("tr:gt(0)").remove();
        var row;
        for (var i = 0; i < player_array.length; i++) {
            row = "<td>" + player_map[player_array[i]].address + "</td>";
            row += "<td>" + player_map[player_array[i]].max_bid_amount + "</td>";
            row += "<td>" + player_map[player_array[i]].bid_amount + "</td>";
            row += "<td>" + player_map[player_array[i]].hidden_call + "</td>";
            row += "<td>" + player_map[player_array[i]].call + "</td>";
            row += "<td>" + player_map[player_array[i]].hand + "</td>";
            row += "<td>" + player_map[player_array[i]].collected_amount + "</td>";
            $('#player_table tbody').append("<tr>" + row + "</tr>");
        }
    }

    $("#btn_get_hand").click(function() {
        var big_num = new BigNumber(generate_bytes32(), 16);
        $("#inp_hand").val(big_num);
    });

    $("#btn_get_hand_nonce").click(function() {
        $("#inp_hand_nonce").val(generate_bytes32());
    });

    $("#btn_get_hand_secret").click(function() {
        var hand = new BigNumber($("#inp_hand").val(), 10);
        var nonce = $("#inp_hand_nonce").val();
        $("#inp_hand_secret").val(web3.sha3(hand.toString(16) + nonce, {encoding: 'hex'}));
    });

    $("#btn_submit_hidden_hand").click(function() {
        contract.submit_hidden_hand(cur_game_num, $("#inp_hand_secret").val(), {from: web3.eth.accounts[0]});
    });

    $("#btn_refresh_table").click(function() {
        refresh_player_table();
    });

    $("#btn_calculate_hand_value").click(function() {
        var v = contract.get_current_hand_value(cur_game_num, $("#inp_hand").val());
        v2 = new BigNumber(v);
        $("#inp_hand_value").val(v2);
    });

    $("#btn_calculate_hand_value_perc").click(function() {
        var value = contract.get_current_hand_value(cur_game_num, $("#inp_hand").val());
        var max_possible = new BigNumber(2).toPower(256).minus(1);
        var big2 = new BigNumber(value);
        $("#inp_hand_value").val(big2.dividedBy(max_possible).toString().substring(2, 20));
    });

    $("#btn_bid_nonce").click(function() {
        $("#inp_bid_nonce").val(generate_bytes32());
    });

    var uint_to_hex = function(uint_string) {
        var num = new BigNumber(uint_string, 10);
        var hex = num.toString(16);
        while(hex.length < 64) {
            hex = "0" + hex;
        }
        return hex;
    }

    $("#btn_bid_secret").click(function() {
        var bid_amount = uint_to_hex($("#inp_bid_amount").val());
        var nonce = $("#inp_bid_nonce").val();
        $("#inp_bid_secret").val(web3.sha3(bid_amount + nonce, {encoding: 'hex'}));
    });

    $("#btn_submit_hidden_bid").click(function() {
        contract.submit_hidden_bid(cur_game_num, $("#inp_max_bid_amount").val(), $("#inp_bid_secret").val(), {from: web3.eth.accounts[0]});
    });

    $("#btn_reveal_bid").click(function() {
        contract.reveal_bid(cur_game_num, $("#inp_bid_amount").val(), "0x" + $("#inp_bid_nonce").val(), {from: web3.eth.accounts[0]});
    });

    $("#btn_call").click(function() {
        var secret = web3.sha3("01" + $("#inp_bid_nonce").val(), {encoding: 'hex'});
        contract.submit_hidden_call(cur_game_num, secret, {from: web3.eth.accounts[0]});
    });

    $("#btn_fold").click(function() {
        var secret = web3.sha3("00" + $("#inp_bid_nonce").val(), {encoding: 'hex'});
        contract.submit_hidden_call(cur_game_num, secret, {from: web3.eth.accounts[0]});
    });

    $("#btn_reveal_call").click(function() {
        contract.reveal_call(cur_game_num, true, "0x" + $("#inp_bid_nonce").val(), {from: web3.eth.accounts[0]});
    });

    $("#btn_reveal_fold").click(function() {
        contract.reveal_call(cur_game_num, false, "0x" + $("#inp_bid_nonce").val(), {from: web3.eth.accounts[0]});
    });

    $("#btn_reveal_hand").click(function() {
        contract.reveal_hand(cur_game_num, $("#inp_hand").val(), "0x" + $("#inp_hand_nonce").val(), {from: web3.eth.accounts[0]});
    });

    $("#btn_collect").click(function() {
        contract.collect_winnings(cur_game_num, {from: web3.eth.accounts[0]});
    });

});
