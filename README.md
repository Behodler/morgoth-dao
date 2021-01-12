# morgoth-dao
Controlling DAO for Behodler Liquidity Protocol

# Nomenclature
Morgoth is governed by roles. Each role is represented by a Minion from the Tolkien's Legendarium.
Governance actions are encapsulated in abstractions called Powers.
The actual contracts to be governed are called Domains. The implementation of the powers are contracts called PowerInvokers. Each PowerInvoker expects precisely one domain contract.  
Angband is the owner of all contracts. From Angband issues forth all actions.

Minions are assigned powers and accounts are mapped to minions. The accounts can be either externally owned or contracts.
For instance, suppose minion Gothmog has powers "UPDATE_TOKEN" and "CONFIGURE_SCARCITY". Then suppose that Gothmog is assigned to Bob. This means Bob now has the power to update tokens and configure scarcity.

# Steps to Govern
If a user wishes to perform a governance action, they can write a powerInvoker that attempts to act according to a registered power. They then pass the invoker to Angband. Angband requests the power being invoked from the invoker and checks if msg.sender is mapped to a minion which can execute the power. If so, Angband transfers ownership of the domain contract to the invoker and calls invoke(). After execution, Angband verifies that the invoker returned ownership of the domain contract to Angband. If not, all execution is reverted

# Distribution of powers.
At first the minion Melkor will have the power to create new powers. Over time, he is expected to 'pour' his power into other minions.



