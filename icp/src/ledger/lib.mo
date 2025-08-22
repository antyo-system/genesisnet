import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";

actor {
  // ===== Types =====
  public type TxInput = {
    provider_id : Text;
    requester_id: Text;
    price       : Nat64;
    data_hash   : Text;
  };

  public type Transaction = {
    id          : Nat;
    provider_id : Text;
    requester_id: Text;
    price       : Nat64;
    data_hash   : Text;
    timestamp   : Int;
  };

  // ===== Stable State =====
  stable var txCounter : Nat = 0;
  stable var txStore   : [Transaction] = [];

  // reputasi disimpan di HashMap (key: provider_id)
  stable var repEntries : [(Text, Nat)] = [];

  // non-stable runtime map (direkonstruksi dari repEntries)
  let repMap = HashMap.HashMap<Text, Nat>(16, Text.equal, Text.hash);

  // Rekonstruksi repMap dari stable entries saat init
  system func postupgrade() { /* nothing */ };
  system func preupgrade() {
    // simpan repMap -> repEntries
    repEntries := Iter.toArray(repMap.entries());
  };
  system func init() {
    for ((k, v) in repEntries.vals()) { repMap.put(k, v); };
  };

  // ===== Helpers =====
  private func pushTx(t : Transaction) {
    txStore := Array.append<Transaction>(txStore, [t]);
  };

  // ===== Public Methods =====

  // -- LOG TRANSACTION --
  public shared({ caller }) func log_transaction(input : TxInput) : async Nat {
    txCounter += 1;
    let now = Time.now();

    let tx : Transaction = {
      id = txCounter;
      provider_id = input.provider_id;
      requester_id = input.requester_id;
      price = input.price;
      data_hash = input.data_hash;
      timestamp = now;
    };

    pushTx(tx);

    // Naikkan reputasi provider +1 untuk setiap transaksi sukses (kamu bisa ganti logikanya).
    let current = Option.get(repMap.get(input.provider_id), 0);
    let newScore = current + 1;
    repMap.put(input.provider_id, newScore);

    return txCounter;
  };

  // -- GET ALL TRANSACTIONS (query) --
  public query func get_transactions() : async [Transaction] {
    txStore
  };

  // -- GET LOGS SINCE ID (query) --
  public query func get_logs_since(sinceId : Nat) : async [Transaction] {
    Array.filter<Transaction>(txStore, func (t) { t.id > sinceId })
  };

  // -- GET REPUTATION (query) --
  public query func get_reputation(provider_id : Text) : async Nat {
    Option.get(repMap.get(provider_id), 0)
  };

  // -- UPDATE REPUTATION (delta + / -) --
  public shared({ caller }) func update_reputation(provider_id : Text, delta : Int) : async Nat {
    let cur : Int = Int.fromNat(Option.get(repMap.get(provider_id), 0));
    let nxt : Int = cur + delta;
    let clamped : Nat = if (nxt <= 0) 0 else Int.abs(nxt);
    repMap.put(provider_id, clamped);
    clamped
  };

  // -- SET REPUTATION (absolute) --
  public shared({ caller }) func set_reputation(provider_id : Text, new_score : Nat) : async Nat {
    repMap.put(provider_id, new_score);
    new_score
  };

  // -- DEV ONLY: RESET (local) --
  public shared({ caller }) func reset_all() : async () {
    txStore := [];
    txCounter := 0;
    // clear map
    let ks = Iter.toArray(repMap.keys());
    for (k in ks.vals()) { ignore repMap.remove(k); };
  };
}
