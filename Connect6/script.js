$(function(){
    var board = new WGo.Board(document.getElementById("board"), {
        width: 50,
    });

    var turn = 1;
    var move_history;
    var history_move_num;
    var moves_left = 1;
    var contract_address = '0xcf00354366bca2f2cd49007bfaeac49d97463200';

    var contractABI = [{"constant":true,"inputs":[{"name":"game_num","type":"uint256"},{"name":"x","type":"uint8"},{"name":"y","type":"uint8"}],"name":"board","outputs":[{"name":"","type":"uint8"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"games","outputs":[{"name":"turn","type":"uint8"},{"name":"winner","type":"uint8"},{"name":"time_per_move","type":"uint256"},{"name":"deadline","type":"uint256"},{"name":"player_1_stake","type":"uint256"},{"name":"player_2_stake","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"player_2","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"x1","type":"uint8"},{"name":"y1","type":"uint8"},{"name":"x2","type":"uint8"},{"name":"y2","type":"uint8"},{"name":"wx","type":"uint8"},{"name":"wy","type":"uint8"},{"name":"dir","type":"uint8"}],"name":"make_move_and_claim_victory","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"player_1","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"x","type":"uint8"},{"name":"y","type":"uint8"},{"name":"dir","type":"uint8"}],"name":"claim_victory","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"}],"name":"join_game","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"game_num","type":"uint256"}],"name":"move_history","outputs":[{"name":"","type":"uint8[]"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"},{"name":"x1","type":"uint8"},{"name":"y1","type":"uint8"},{"name":"x2","type":"uint8"},{"name":"y2","type":"uint8"}],"name":"make_move","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_time_per_move","type":"uint256"},{"name":"opponent_stake","type":"uint256"}],"name":"new_game","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"board_size","outputs":[{"name":"","type":"uint8"}],"type":"function"},{"constant":false,"inputs":[{"name":"game_num","type":"uint256"}],"name":"claim_time_victory","outputs":[],"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"game_num","type":"uint256"}],"name":"LogGameCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"game_num","type":"uint256"}],"name":"LogGameStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"game_num","type":"uint256"},{"indexed":false,"name":"winner","type":"uint8"}],"name":"LogVictory","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"game_num","type":"uint256"},{"indexed":false,"name":"x1","type":"uint8"},{"indexed":false,"name":"y1","type":"uint8"},{"indexed":false,"name":"x2","type":"uint8"},{"indexed":false,"name":"y2","type":"uint8"}],"name":"LogMoveMade","type":"event"}];

    var registry_contract_address = '0xa35fc4d3ea15e0d9272dc181ee1c2761d5d0cabd';
    var registryContractABI = [{"constant":true,"inputs":[{"name":"username","type":"string"}],"name":"get_address","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"get_username","outputs":[{"name":"","type":"string"}],"type":"function"},{"constant":false,"inputs":[{"name":"username","type":"string"}],"name":"register","outputs":[],"type":"function"}];
    
    if(typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {
        // If there's a web3 library loaded, then make your own web3
        web3 = new Web3(web3.currentProvider);
    } else if (typeof Web3 !== 'undefined') {
        // If there isn't then set a provider
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    } else {
      //alert("You are not using an Ethereum enabled browser. Please install Mist.");
    }

    var connectsix_contract = web3.eth.contract(contractABI);
    var connectsix = connectsix_contract.at(contract_address);

    var registry_contract = web3.eth.contract(registryContractABI);
    var registry = registry_contract.at(registry_contract_address);

    var current_game_num = 0;

    var my_moves = [];

    // mode can be normal or move_replay
    var mode = "normal";

    var game_metadata;
    var board_state = new Array(19);
    var player_board = new Array(19);
    for (var i = 0; i < 19; i++) {
        board_state[i] = new Array(19);
        player_board[i] = new Array(19);
    }

    var get_username = function(addr) {
      if (addr == "0x" || addr == "0x0") {
        return addr;
      }
      var MAX_LEN = 10;
      name = registry.get_username(addr);
      if (name == "") {
        return addr.substring(0, MAX_LEN);
      }
      return name.substring(0, MAX_LEN);
    }

    var get_player_names = function(game_num) {
        var p1 = get_username(connectsix.player_1(game_num));
        var p2 = get_username(connectsix.player_2(game_num));
        return [p1, p2];
    }

    var sync_state = function() {
        game_metadata = connectsix.games(current_game_num);
        var player_names = get_player_names(current_game_num);
        player_1 = player_names[0];
        player_2 = player_names[1];
        turn = game_metadata[0].toNumber();
        winner = game_metadata[1].toNumber();
        time_per_move = game_metadata[2].toNumber();
        deadline = game_metadata[3].toNumber();
        move_history = connectsix.move_history(current_game_num);
        player_1_stake = game_metadata[4];
        player_2_stake = game_metadata[5];
        if (move_history.length > 0) {
          x1 = move_history[move_history.length - 4].toNumber();
          y1 = move_history[move_history.length - 3].toNumber();
          x2 = move_history[move_history.length - 2].toNumber();
          y2 = move_history[move_history.length - 1].toNumber();
        } else {
          x1 = -1;
          y1 = -1;
          x2 = -1;
          y2 = -1;
        }
        for (var x = 0; x < 19; x++) {
            for (var y = 0; y < 19; y++) {
                board_state[x][y] = connectsix.board(current_game_num, x, y).toNumber();
            }
        }
    }

    var draw_my_moves = function() {
        for (var i = 0; i < my_moves.length; i++) {
            if (board_state[my_moves[i].x][my_moves[i].y] != 0) {
                my_moves = [];
                break;
            }
        }
        var color;
        if (turn == 1) {
            color = WGo.B;
        } else {
            color = WGo.W;
        }
        for (var i = 0; i < my_moves.length; i++) {
            board.addObject({
                x: my_moves[i].x,
                y: my_moves[i].y,
                c: color
            });
            board.addObject({
                x: my_moves[i].x,
                y: my_moves[i].y,
                type: "CR"
            });
        }
        // draw last 2 moves
        if (x1 >= 0) {
          // if at least one move was played
          board.addObject({
              x: x1,
              y: y1,
              type: "CR"
          });
          board.addObject({
              x: x2,
              y: y2,
              type: "CR"
          });
        }
    }

    var set_up_player_board = function() {
        for (var x = 0; x < 19; x++) {
            for (var y = 0; y < 19; y++) {
                player_board[x][y] = 0;
            }
        }
        for (var i = 0; i < my_moves.length; i++) {
            player_board[my_moves[i].x][my_moves[i].y] = turn;
        }
    }

    var check_direction = function(x, y, dir) {
        if (board_state[x][y] + player_board[x][y] == 0) {
            return 0;
        }
        var dx = 0;
        var dy = 0;
        if (dir == 3) {
            if (x < 5 || y > 19 - 6) return 0;
            dx = -1;
            dy = 1;
        } else if (dir == 2) {
            if (x > 19 - 6 || y > 19 - 6) return 0;
            dx = 1;
            dy = 1;
        } else if (dir == 1) {
            if (y > 19 - 6) return 0;
            dy = 1;
        } else {
            if (x > 19 - 6) return 0;
            dx = 1;
        }
        for (var i = 0; i < 6; i++) {
            if (player_board[x][y] + board_state[x][y] !=
                    player_board[x + i * dx][y + i * dy] + board_state[x + i * dx][y + i * dy]) {
                return 0;
            }
        }
        return board_state[x][y] + player_board[x][y];
    }

    var find_winner = function() {
        // returns {x, y, dir}
        set_up_player_board();
        for (var x = 0; x < 19; x++) {
            for (var y = 0; y < 19; y++) {
                for (var dir = 0; dir < 4; dir++) {
                    if (check_direction(x, y, dir) != 0) {
                    }
                    if (check_direction(x, y, dir) == turn) {
                        return {x:x, y:y, dir:dir};
                    }
                }
            }
        }
        return false;
    }

    var update_status = function() {
        
        if (mode == "replay") {
            $("#status").text("You are in replay mode. Click on the board to back to normal mode.");
        } else if (player_1 == "0x0") {
            $("#status").text("Game not created");
        } else if (winner == 1) {
            $("#status").text("Player 1 wins");
        } else if (winner == 2) {
            $("#status").text("Player 2 wins");
        } else if (turn == 0) {
            $("#status").text("Game did not start yet");
        } else if (turn == 1) {
            $("#status").text("Player 1's turn");
        } else if (turn == 2) {
            $("#status").text("Player 2's turn");
        } else {
            $("#status").text("Unexpected State");
        }
    }

    var formatTime = function(milisecs) {
      // Given time in miliseconds, convert it to a pretty string like "2:25:04"
      if(milisecs < 0) {
          return "0:00";
      }
      var seconds = milisecs/1000;
      var minutes = Math.floor(seconds/60);
      var hours = Math.floor(seconds/3600);
      seconds = Math.floor(seconds) % 60;
      minutes = minutes % 60;

      result = "";
      if(hours > 0){
          result += hours + ":";
          if(minutes < 10) result += "0";
      }
      result += minutes + ":";
      if(seconds < 10) result += "0";
      result += seconds;
      return result;
    }

    var update_time = function() {
        if (turn == 1) {
            $("#p1_time").text(formatTime(deadline * 1000 - Date.now()));
            $("#p2_time").text(formatTime(time_per_move * 1000));
        } else if (turn == 2) {
            $("#p1_time").text(formatTime(time_per_move * 1000));
            $("#p2_time").text(formatTime(deadline * 1000 - Date.now()));
        } else {
            $("#p1_time").text(formatTime(time_per_move * 1000));
            $("#p2_time").text(formatTime(time_per_move * 1000));
        }
    }

    var refresh = function() {
        update_status();
        if (deadline * 1000 - Date.now() > 0) {
          $("#btn_time_victory").prop('disabled', true);
        } else {
          // if time ran out
          $("#btn_time_victory").prop('disabled', false);
        }
        if (turn == 0) {
          $("#btn_join").prop('disabled', false);
          $("#btn_time_victory").prop('disabled', true);
        } else {
          // disable the button if the game already started
          $("#btn_join").prop('disabled', true);
        }
        $("#p1_name").text(player_1);
        $("#p2_name").text(player_2);
        if (mode == "normal") {
            for (var x = 0; x < 19; x++) {
                for (var y = 0; y < 19; y++) {
                    var r = board_state[x][y];
                    board.removeObjectsAt(x, y);
                    if (r == 1) {
                        board.addObject({
                            x: x,
                            y: y,
                            c: WGo.B
                        });
                    } else if (r == 2) {
                        board.addObject({
                            x: x,
                            y: y,
                            c: WGo.W
                        });
                    }
                }
            }
            draw_my_moves();
        }
    }

    board.addEventListener("click", function(x, y) {
        mode = "normal";
        if (my_moves.length >= 2
                || (my_moves.length == 1 && my_moves[0].x == x && my_moves[0].y == y)
                || board_state[x][y] != 0) {
            my_moves = [];
        } else {
            my_moves.push({x:x, y:y});
        }
        refresh();
    });

    $("#btn_make_move").click(function(){
        check_accounts();
        if (my_moves.length == 2) {
            w = find_winner();
            if (w == false) {
                connectsix.make_move(current_game_num, my_moves[0].x, my_moves[0].y, my_moves[1].x, my_moves[1].y,
                        {from: web3.eth.accounts[0]});
            } else {
                connectsix.make_move_and_claim_victory(
                        current_game_num,
                        my_moves[0].x,
                        my_moves[0].y,
                        my_moves[1].x,
                        my_moves[1].y,
                        w.x,
                        w.y,
                        w.dir,
                        {from: web3.eth.accounts[0]});
            }
        }
    });

    var check_accounts = function() {
      if (web3.eth.accounts.length < 1) {
        alert ("Make sure 1 Ethereum account is selected.");
      }
    }

    $("#btn_join").click(function() {
        check_accounts();
        if (player_2_stake != 0) {
          alert("Warning: you are about to send Ether because this room requires stake.");
        }
        if (turn == 0) {
            connectsix.join_game(current_game_num, {from: web3.eth.accounts[0], value: player_2_stake});
        }
    });

    $("#btn_time_victory").click(function() {
        check_accounts();
        if (deadline * 1000 - Date.now() > 0) {
            alert("Your opponent still has some time left.");
        } else {
            connectsix.claim_time_victory(current_game_num, {from: web3.eth.accounts[0]});
        }
    });

    $("#btn_switch").click(function(){
        current_game_num = $("#new_game_num").val();
        sync_state();
        refresh();
    });

    $("#btn_host_game").click(function(){
        check_accounts();
        $("#newGameModal").modal('show');
    });

    $("#btn_open_register").click(function(){
        $("#registerModal").modal('show');
    });

    var register_account = function(username) {
        if(registry.get_address(username) == "0x0000000000000000000000000000000000000000") {
          registry.register(username, {from: web3.eth.accounts[0]});
        } else {
          alert("Username taken");
        }
    }

    $("#btn_register").click(function(){
        check_accounts();
        register_account($("#username_inp").val());
        $("#registerModal").modal('hide');
    });

    $("#btn_start").click(function(){
        var sec_per_move = $("#time_init").val();
        var p1_stk = web3.toWei($("#p1_stake").val(), "ether");
        var p2_stk = web3.toWei($("#p2_stake").val(), "ether");
        connectsix.new_game(sec_per_move, p2_stk, {from: web3.eth.accounts[0], value: p1_stk});
        $("#newGameModal").modal('hide');
        alert("Create game transaction is sent. Refresh the list in a few seconds");
    });

    (function(){
        // regular updates
        sync_state();
        refresh();
        setTimeout(arguments.callee, 5000);
    })();

    (function(){
        update_time()
        setTimeout(arguments.callee, 500);
    })();


    $('#game_tab').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
        board.setWidth($("#board").width());
    })

    var get_game_status = function(game_num) {
        game_metadata = connectsix.games(game_num);
        turn = game_metadata[0].toNumber();
        winner = game_metadata[1].toNumber();
        if (winner != 0) {
            return "finished";
        } else if (turn == 0) {
            return "waiting";
        } else {
            return "playing";
        }
    }

    var check_my_game = function(game_num) {
        if (get_game_status(game_num) == "finished") {
          return false;
        }
        if (connectsix.player_1(game_num) == web3.eth.accounts[0] || 
            connectsix.player_2(game_num) == web3.eth.accounts[0]) {
          return true;
        }
        return false;
    }

    var refresh_games = function() {
        $('#games_table').find("tr:gt(0)").remove();
        var i = 0;
        for (var i = 0; i < 100; i++) {
          if ($('#only_my_games').prop('checked') && !check_my_game(i)) {
            continue;
          }
          var game_status = get_game_status(i);
          if (game_status == "finished") {
            row = "<td>" + '<button type="button" class="btn btn-danger">' + i + "</button>" + "</td>";
          } else if (game_status == "waiting") {
            row = "<td>" + '<button type="button" class="btn btn-success">' + i + "</button>" + "</td>";
          } else {
            row = "<td>" + '<button type="button" class="btn btn-primary">' + i + "</button>" + "</td>";
          }
          var player_names = get_player_names(i);
          var p1 = player_names[0];
          var p2 = player_names[1];
          var game_metadata = connectsix.games(i);
          var p1_stake = web3.fromWei(game_metadata[4], "ether");
          var p2_stake = web3.fromWei(game_metadata[5], "ether");
          if (p1 == "0x") {
              break;
          }
          row += "<td>" + formatTime(connectsix.games(i)[2].toNumber() * 1000) + "</td>" // time per move
          row += "<td>" + p1 + "</td>"
          row += "<td>" + p1_stake + "</td>"
          row += "<td>" + p2 + "</td>"
          row += "<td>" + p2_stake + "</td>"
          $('#games_table tbody').append("<tr>" + row + "</tr>");
        }

        $('#games_table').on('click', 'tr button', function (event) {
            $("#game_tab").tab('show')
            current_game_num = $(this).text();
            sync_state();
            refresh();
            board.setWidth($("#board").width());
        });
    }

    $("#btn_refresh").click(function(){
        refresh_games();
    });

    var clear_board = function() {
        for (var x = 0; x < 19; x++) {
            for (var y = 0; y < 19; y++) {
                board.removeObjectsAt(x, y);
            }
        }
    }

    var draw_history = function() {
        if (move_history.length == 0) {
          return;
        }
        update_status();
        clear_board();
        board.addObject({
            x: 9,
            y: 9,
            c: WGo.B
        });
        for (var i = 0; i < history_move_num; i++) {
            var col;
            if (i % 2 == 0) {
                col = WGo.W;
            } else {
                col = WGo.B;
            }
            board.addObject({
                x: move_history[i * 4],
                y: move_history[i * 4 + 1],
                c: col
            });
            board.addObject({
                x: move_history[i * 4 + 2],
                y: move_history[i * 4 + 3],
                c: col
            });
        }
    }

    $("#btn_history_start").click(function(){
        if (mode == "normal") {
            mode = "replay";
        } 
        history_move_num = 0;
        draw_history();
    });

    $("#btn_history_back").click(function(){
        if (mode == "normal") {
            history_move_num = move_history.length / 4;
            mode = "replay";
        } 
        history_move_num--;
        if (history_move_num < 0) {
            history_move_num = 0;
        }
        draw_history();
    });

    $("#btn_history_next").click(function(){
        if (mode == "normal") {
            history_move_num = move_history.length / 4;
            mode = "replay";
        } 
        history_move_num++;
        if (history_move_num > move_history.length / 4) {
            history_move_num = move_history.length / 4;
        }
        draw_history();
    });

    $("#btn_history_end").click(function(){
        if (mode == "normal") {
            mode = "replay";
        } 
        history_move_num = move_history.length / 4;
        draw_history();
    });

    refresh_games();

});
