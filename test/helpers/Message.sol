pragma solidity ^0.4.11;

contract Message {

  event Show(bytes32 b32, uint256 number, string text);

  function showMessage(
    bytes32 message, uint256 number, string text
  ) constant returns (bool) {
    Show(message, number, text);
    return true;
  }

  function fail() {
    throw;
  }

  function call(address to, bytes data) returns (bool) {
    if (to.call(data))
      return true;
    else
      return false;
  }

}
