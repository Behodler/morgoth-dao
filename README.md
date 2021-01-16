# Morgoth Dao
Controlling DAO for Behodler Liquidity Protocol

# Nomenclature
Morgoth is governed by roles. Each role is represented by a Minion from Tolkien's Legendarium.
Governance actions are encapsulated in abstractions called Powers.
The actual contracts to be governed are called Domains. The implementation of the powers are contracts called PowerInvokers. Each PowerInvoker expects precisely one domain contract.  
Angband is the owner of all contracts. From Angband issues forth all actions. When a power invoker wishes to act on a domain, it must request temporary ownership from Angband for the duration of 1 transaction.

Minions are assigned powers and accounts are mapped to minions. The accounts can be either externally owned or contracts.
For instance, suppose minion Gothmog has powers "UPDATE_TOKEN" and "CONFIGURE_SCARCITY". Then suppose that Gothmog is assigned to Bob. This means Bob now has the power to update tokens and configure scarcity. The intent of Morgoth is that each minion is controlled by a DAO.

# Steps to Govern
If a user wishes to perform a governance action, they can write a powerInvoker that attempts to act according to a registered power. They then pass the invoker to Angband. Angband requests the power being invoked from the invoker and checks if msg.sender is mapped to a minion which can execute the power. If so, Angband transfers ownership of the domain contract to the invoker and calls invoke(). After execution, Angband verifies that the invoker returned ownership of the domain contract to Angband. If not, all execution is reverted

# Distribution of powers.
At first the minion Melkor will have the power to create new powers. Over time, he is expected to 'pour' his power into other minions.

# Dispute resolution - yet to be implemented
While no powerInvoker is inherently required to submit its actions to dispute resolution, by convention Melkor will only approve those that do.
Dispute resolution in Morgoth is at once simple and effective. The mechanism is an implentation of the Ulex procedural rules: https://github.com/proftomwbell/Ulex/tree/master/versions/1.2

## Terminology 
1. Judge - a minion who is responsible for jointly approving or rejecting actions.
2. Jury - the class of all possible judges. All minions in Morgoth are part of the jury.
3. Veto - certain minions have the ability to reject a decision at any point along the adjudication pipeline   
4. Dispute timeout - A period in minutes during which an action taken by a minion can be disputed. 
5. Disputable power - a power which is subject to adjudication.
6. Plaintiff - the disputing party
7. Defendant - the party attempting to execute a disputable power
6. Bonded collateral - When a disputable decision is lodged, 
7. Temporal bonding curve - The temporal bonding curve is used to price disputable decisions. The price increases the more frequently governance decisions are made and falls as decision frequency falls. The intent is to have a mechanism to prevent Morgoth from being choked up with governance decisions while still balancing against the need for effective governance. Morgoth prices this equilibrium as efficiently as gas prices allow. 
8. Eye - the Morgoth governance token is deposited in the temporal bonding curve. Disputes are made by matching the staked Eye.

## Dispute mechanism

Suppose Ungoliant wishes to set the burn fee on Scarcity to 10% on the grounds that this will promote the functioning of Liquid Vault. The first thing that Ungoliant needs is the CONFIGURE_SCARCITY power. From there Ungoliant must create a power invoker for CONFIGURE_SCARCITY which sets the fee to 100 (the total is 1000). From there the power invoker needs to be authorized on Angband by someone with the AUTHORIZE_INVOKER power. In this case, we will only authorize power invokers that are disputable. Ungoliant observes the current price of a decision on the temporal bonding curve and notes it is 20 EYE. To be safe, they load the power invoker with 30 EYE. 
The user then invokes the power through Angband. 
At the time of invocation in our fictional scenario, the price of decisions is 25 EYE so the invocation succeeds. 
An event is emitted allowing other minions to scan through a service such as The Graph that a pending decision is in the pipeline.
The dispute timeout is 10080 minutes (7 days).
In our example Sauron is controlled by a simple democracy DAO, Barad-dûr. The participants vote using the Ring token. A simple majority votes to dispute the decision made by Ungoliant. They have a mechanism in place which automatically swaps Ring for 25 Eye which is then staked in the dispute contract.
At this point the dispute timeout is reset. 
We now enter a phase in which the defendant and the plaintiff must each select a judge from the remaining minions within a given timeout. Failure to do so results in forefeiting deposit, part of which is burnt, the rest given to the winning party.

If they both successfully select judges, the judges are each requested to bond half of the dispute price. This is held against them failing to adjudicate in time. The two judges then have to select a third. They must both agree on a third. This forces all three judges to be as fair as possible through game theoretic incentices. The judges must then confer and together agree on a third judge. 
The final verdict must be unanimous.

### Outcomes
1. Hung parliament. If one of more of the judges fails to provide a judgement or if the two initial judges fail to appoint a third judge within a given timeout, the judicial deposits are all forfeit and the case is reset into the state of judge appointment.
2. Plaintiff wins. The defandants deposit is split 4 ways between the 3 judges and the plaintiff. All parties are free to unstake their bonded Eye. The power is set to failed state and therefore cannot be executed.
3. Defendant wins. The plaintiff's deposit is split 4 ways and the power is executed by the court successfully.
4. Appeals process. For simplicity there is no appeals process. Instead, aggrieved parties who disagree with the verdict can lodge a counter governance decision. The nature of the temporal bonding curve will naturally increase the price of the appeal process.
