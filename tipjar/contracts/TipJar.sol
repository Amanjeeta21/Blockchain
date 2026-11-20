
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TipJar {

    address public owner;

    struct Tip {
        address from;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    Tip[] public tips;

    error ZeroTip();
    error NotOwner();
    error TransferFailed();

    event TipSent(
        address indexed from,
        uint256 amount,
        string message
    );

    event Withdrawn(
        address indexed owner,
        uint256 amount
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    function tip(string calldata message) external payable {
        if (msg.value == 0) {
            revert ZeroTip();
        }

        tips.push(
            Tip({
                from: msg.sender,
                amount: msg.value,
                message: message,
                timestamp: block.timestamp
            })
        );

        emit TipSent(msg.sender, msg.value, message);
    }

    function getTipCount() external view returns (uint256) {
        return tips.length;
    }

    function getTip(uint256 index) external view returns (Tip memory) {
        return tips[index];
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;

        (bool success, ) = payable(owner).call{value: amount}("");

        if (!success) {
            revert TransferFailed();
        }

        emit Withdrawn(owner, amount);
    }

}
