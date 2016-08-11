$(function(){
    var contract_address = '0x79ec9B050Ec82C31D4fc90FB169d968256C5Cb11';

    var info_obj = {};

    var contractABI = [ { "constant": true, "inputs": [ { "name": "", "type": "bytes32" } ], "name": "hash_db", "outputs": [ { "name": "publisher", "type": "address", "value": "0x0000000000000000000000000000000000000000" }, { "name": "stake", "type": "uint256", "value": "0" }, { "name": "burned", "type": "uint256", "value": "0" }, { "name": "timestamp", "type": "uint256", "value": "0" } ], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_publisher", "outputs": [ { "name": "", "type": "address", "value": "0x0000000000000000000000000000000000000000" } ], "type": "function" }, { "constant": false, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "publish", "outputs": [], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_timestamp", "outputs": [ { "name": "", "type": "uint256", "value": "0" } ], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_burned", "outputs": [ { "name": "", "type": "uint256", "value": "0" } ], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_stake", "outputs": [ { "name": "", "type": "uint256", "value": "0" } ], "type": "function" } ];

    if(typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {
      // If there's a web3 library loaded, then make your own web3
      web3 = new Web3(web3.currentProvider);
    } else if (typeof Web3 !== 'undefined') {
      // If there isn't then set a provider
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    var contract_interface = web3.eth.contract(contractABI);
    var contract = contract_interface.at(contract_address);

    var clear_info_obj = function() {
      info_obj.account_ether = "";
      info_obj.burned_ether = "";
      info_obj.publisher = "";
      info_obj.timestamp = "";
      info_obj.text_hash = "";
      info_obj.num_set = 0;
    }

    var show_info_obj = function() {
      if (info_obj.num_set != 5) {
        return;
      }
      var txt = "";
      txt += "<p>" + "Text Hash: " + info_obj.text_hash + "<\p>";
      if (info_obj.publisher == "0x0000000000000000000000000000000000000000" || info_obj.publisher == "0x") {
        txt += "<p>Not Found.</p>";
      } else { 
        txt += "<p>" + "Publisher: " + info_obj.publisher + "<\p>";
        txt += "<p>" + "Timestamp: " + info_obj.timestamp + "<\p>";
        txt += "<p>" + "Amount in account when published: " + info_obj.account_ether + " ETH<\p>";
        txt += "<p>" + "Burned: " + info_obj.burned_ether + " ETH<\p>";
      }
      $("#result_panel_body").html(txt);
    }

    $("#btn_publish").click(function(){
      var amount_to_burn = web3.toWei($("#inp_burn_amount").val(), "ether");
      if (amount_to_burn > 0) {
        alert("Warning, you are about to burn Ether");
      }
      contract.publish(web3.sha3($("#inp_text").val()), {from: web3.eth.accounts[0], value: amount_to_burn});
    });

    $("#btn_get_info").click(function() {
      clear_info_obj();
      show_info_obj();

      var text_hash = web3.sha3($("#inp_text").val());
      info_obj.text_hash = text_hash;
      info_obj.num_set += 1;

      contract.get_stake(text_hash, function(err, result) {
        info_obj.account_ether = Math.round(web3.fromWei(result, "ether") * 1000) / 1000;
        info_obj.num_set += 1;
        show_info_obj();
      });

      contract.get_burned(text_hash, function(err, result) {
        info_obj.burned_ether = Math.round(web3.fromWei(result, "ether") * 1000) / 1000;
        info_obj.num_set += 1;
        show_info_obj();
      });

      contract.get_publisher(text_hash, function(err, result) {
        info_obj.publisher = result;
        info_obj.num_set += 1;
        show_info_obj();
      });

      contract.get_timestamp(text_hash, function(err, result) {
        var d = new Date(result * 1000);
        var n = d.toUTCString();
        info_obj.timestamp = n;
        info_obj.num_set += 1;
        show_info_obj();
      });

    });

});
