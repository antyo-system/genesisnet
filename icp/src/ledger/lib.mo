import Array "mo:base/Array";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

actor {
  public type TxInput = {
    tx_id : Text;
    provider_id : Text;
    amount : Nat;
    ts : Int;
    data_hash : Text;
  };

  public type Transaction = {
    id : Nat;
    tx_id : Text;
    provider_id : Text;
    amount : Nat;
    ts : Int;
    data_hash : Text;
  };

  stable var nextId : Nat = 0;
  stable var transactions : [Transaction] = [];
  stable var reputations : [(Text, Nat)] = [];

  public func log_transaction(tx : TxInput) : async Nat {
    let id = nextId;
    nextId += 1;
    let record : Transaction = {
      id;
      tx_id = tx.tx_id;
      provider_id = tx.provider_id;
      amount = tx.amount;
      ts = tx.ts;
      data_hash = tx.data_hash;
    };
    transactions := Array.append(transactions, [record]);
    ignore update_reputation(tx.provider_id, 1);
    id
  };

  public query func get_reputation(provider_id : Text) : async Nat {
    switch (Array.find<(Text,Nat)>(reputations, func (p) { p.0 == provider_id })) {
      case (?pair) pair.1;
      case null 0;
    }
  };

  public func update_reputation(provider_id : Text, delta : Int) : async Nat {
    let current : Nat = await get_reputation(provider_id);
    let nextInt = Int.fromNat(current) + delta;
    let nextNat = if (nextInt < 0) 0 else Nat.fromInt(nextInt);

    var updated = false;
    reputations := Array.map<(Text,Nat), (Text,Nat)>(reputations, func (p) {
      if (p.0 == provider_id) {
        updated := true;
        (provider_id, nextNat)
      } else p
    });
    if (!updated) {
      reputations := Array.append(reputations, [(provider_id, nextNat)]);
    };
    nextNat
  };
}
