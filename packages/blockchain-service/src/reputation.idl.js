export const idlFactory = ({ IDL }) =>
  IDL.Service({
    log_transaction: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Int, IDL.Text],
      [IDL.Nat],
      []
    ),
    get_reputation: IDL.Func([IDL.Text], [IDL.Nat], ["query"]),
    update_reputation: IDL.Func(
      [IDL.Text, IDL.Int],
      [IDL.Nat],
      []
    ),
  });

export const init = ({ IDL }) => { return []; };

export default idlFactory;
