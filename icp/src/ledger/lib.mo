import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Option "mo:base/Option";

persistent actor {
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

  // ===== Stable state (persist across upgrades) =====
  stable var txCounter : Nat = 0;
  stable var txStore   : [Transaction] = [];
  // simpan reputasi sebagai pasangan (key,value) supaya bisa distabilkan
  stable var repEntries : [(Text, Nat)] = [] : [(Text, Nat)];

  // runtime map (tidak stable), direkonstruksi dari repEntries
  transient let repMap = HashMap.HashMap<Text, Nat>(32, Text.equal, Text.hash);

  // simpan map -> array sebelum upgrade
  system func preupgrade() {
    repEntries := Iter.toArray(repMap.entries());
  };

  // rekonstruksi map dari array setelah upgrade / deploy berikutnya
  system func postupgrade() {
    for ((k, v) in repEntries.vals()) { repMap.put(k, v) };
  };

  // ===== Helpers =====
  private func pushTx(t : Transaction) {
    txStore := Array.append<Transaction>(txStore, [t]);
  };

  // terapkan delta bertanda ke Nat (diklamp ke >= 0)
  private func applyDelta(cur : Nat, delta : Int) : Nat {
    if (delta >= 0) {
      cur + Nat64.fromInt(delta)
    } else {
      let dec = Nat64.fromInt(-delta);
      if (cur <= dec) 0 else cur - dec
    }
  };

  // ===== Public methods =====

  // catat transaksi + auto +1 reputasi provider
  public shared func log_transaction(input : TxInput) : async Nat {
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

    let current = Option.get(repMap.get(input.provider_id), 0);
    let newScore = current + 1;
    repMap.put(input.provider_id, newScore);

    txCounter
  };

  // ambil semua transaksi (query)
  public query func get_transactions() : async [Transaction] {
    txStore
  };

  // ambil transaksi dengan id > sinceId (query)
  public query func get_logs_since(sinceId : Nat) : async [Transaction] {
    Array.filter<Transaction>(txStore, func (t) { t.id > sinceId })
  };

  // ambil reputasi provider (query)
  public query func get_reputation(provider_id : Text) : async Nat {
    Option.get(repMap.get(provider_id), 0)
  };

  // ubah reputasi dengan delta (+/-)
  public shared func update_reputation(provider_id : Text, delta : Int) : async Nat {
    let cur  = Option.get(repMap.get(provider_id), 0);
    let next = applyDelta(cur, delta);
    repMap.put(provider_id, next);
    next
  };

  // set reputasi absolut
  public shared func set_reputation(provider_id : Text, new_score : Nat) : async Nat {
    repMap.put(provider_id, new_score);
    new_score
  };

  // DEV: reset semua data (pakai di local saja)
  public shared func reset_all() : async () {
    txStore := [];
    txCounter := 0;
    let keys = Iter.toArray(repMap.keys());
    for (k in keys.vals()) { ignore repMap.remove(k) };
  };
}
