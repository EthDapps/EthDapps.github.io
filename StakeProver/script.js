$(function(){
    var contract_address = '0xb31d8314f7e1477493f3F600ddC344BB4b822706';

    var contractABI = [ { "constant": true, "inputs": [ { "name": "", "type": "bytes32" } ], "name": "hash_db", "outputs": [ { "name": "publisher", "type": "address", "value": "0x0000000000000000000000000000000000000000" }, { "name": "stake", "type": "uint256", "value": "0" }, { "name": "timestamp", "type": "uint256", "value": "0" } ], "type": "function" }, { "constant": false, "inputs": [ { "name": "s", "type": "string" } ], "name": "publish_str", "outputs": [], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_publisher", "outputs": [ { "name": "", "type": "address", "value": "0x0000000000000000000000000000000000000000" } ], "type": "function" }, { "constant": true, "inputs": [ { "name": "s", "type": "string" } ], "name": "get_str_hash", "outputs": [ { "name": "", "type": "bytes32", "value": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470" } ], "type": "function" }, { "constant": false, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "publish", "outputs": [], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_timestamp", "outputs": [ { "name": "", "type": "uint256", "value": "0" } ], "type": "function" }, { "constant": true, "inputs": [ { "name": "hashed_val", "type": "bytes32" } ], "name": "get_stake", "outputs": [ { "name": "", "type": "uint256", "value": "0" } ], "type": "function" } ];

    if(typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {
      // If there's a web3 library loaded, then make your own web3
      web3 = new Web3(web3.currentProvider);
    } else if (typeof Web3 !== 'undefined') {
      // If there isn't then set a provider
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    var contract_interface = web3.eth.contract(contractABI);
    var contract = contract_interface.at(contract_address);

    $("#btn_publish").click(function(){
      var amount_to_burn = web3.toWei($("#inp_burn_amount").val(), "ether");
      contract.publish(web3.sha3($("#inp_text").val()), {from: web3.eth.accounts[0], value: amount_to_burn});
    });

    $("#btn_extract").click(function() {
      var text_hash = web3.sha3($("#inp_text").val());

      contract.get_stake(text_hash, function(err, result) {
        $("#result_stake").text(web3.fromWei(result, "ether"));
      });

      contract.get_publisher(text_hash, function(err, result) {
        $("#result_publisher").text(result);
      });

      // add publisher user name
      
      contract.get_timestamp(text_hash, function(err, result) {
        $("#result_timestamp").text(result);
      });

      /*
      contract.get_burned(text_hash, function(err, result) {
        $("result_timestamp").text(result);
      });
      */

    });

});
