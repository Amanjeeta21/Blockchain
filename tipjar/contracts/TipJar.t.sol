
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {TipJar} from "./TipJar.sol";

contract TipJarTest is Test {
    TipJar tipJar;

    address owner = address(this);
    address user = address(0x1234);

    // Allows this test contract to receive ETH.
    receive() external payable {}

    function setUp() public {
        tipJar = new TipJar();
    }

    function test_TipIncreasesBalanceAndCount() public {
        vm.deal(user, 1 ether);

        vm.prank(user);
        tipJar.tip{value: 0.1 ether}("Great work!");

        assertEq(address(tipJar).balance, 0.1 ether);
        assertEq(tipJar.getTipCount(), 1);
    }

    function test_ZeroTipReverts() public {
        vm.expectRevert(TipJar.ZeroTip.selector);
        tipJar.tip{value: 0}("No tip");
    }

    function test_NonOwnerWithdrawReverts() public {
        vm.prank(user);
        vm.expectRevert(TipJar.NotOwner.selector);
        tipJar.withdraw();
    }

    function test_OwnerWithdrawsFullBalance() public {
        vm.deal(address(tipJar), 1 ether);

        uint256 initialBalance = owner.balance;

        tipJar.withdraw();

        assertEq(address(tipJar).balance, 0);
        assertEq(owner.balance, initialBalance + 1 ether);
    }
}
