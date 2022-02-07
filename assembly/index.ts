import { PersistentMap, PersistentVector, PersistentUnorderedMap, context, u128, logging } from 'near-sdk-as';
import { Token, TokenMetadata, Order, SimpleArtState } from './model';

@nearBindgen
class NFTContractMetadata {

  constructor(
    public spec: string = 'nft-2.0.0',
    public name: string = 'Simple Art NFT',
    public symbol: string = 'SIMPLEART',
    public icon: string = '',
    public base_uri: string = '', // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    public reference: string = '', // URL to a JSON file with more info
    public reference_hash: string = '' // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  ) { }

}


@nearBindgen
export class Contract {

  OWN: string = "mic.testnet";

  owner_id: string = context.contractName;
  simple_art_state: PersistentUnorderedMap<string, SimpleArtState> = new PersistentUnorderedMap<string, SimpleArtState>("a");
  get_simple_art_state(): Array<SimpleArtState> { return this.simple_art_state.values() };
  all_nft_token_ids: PersistentVector<string> = new PersistentVector<string>('all_nft_token_ids');

  tokens_per_owner: PersistentMap<string, Array<string>> = new PersistentMap<string, Array<string>>('tokens_pr_owner');
  tokens_by_id: PersistentMap<string, Token> = new PersistentMap<string, Token>('tokens_by_id');
  token_metadata_by_id: PersistentMap<string, TokenMetadata> = new PersistentMap<string, TokenMetadata>('token_metadata_by_id');
  orders_for_token_id: PersistentMap<string, Order> = new PersistentMap<string, Order>('orders_for_token_id');


  get_all_orders(): Array<Order> {

    const orders_for_these_token_ids: Array<Order> = new Array<Order>();

    for (let i = 0; i < this.all_nft_token_ids.length; i++) {
      let order: Order = this.orders_for_token_id.getSome(this.all_nft_token_ids[i]);
      orders_for_these_token_ids.push(order);
    }

    return orders_for_these_token_ids;
  };

  nft_total_supply(): string {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      return current_simple_art_state.mint_count.toString();
    } else {
      return "0";
    }
  };

  nft_tokens(from_index: string, limit: u64): Array<Token> {
    const tokens_for_these_token_ids: Array<Token> = new Array<Token>();

    for (let i = 0; i < this.all_nft_token_ids.length; i++) {
      let this_token: Token = this.tokens_by_id.getSome(this.all_nft_token_ids[i]);
      tokens_for_these_token_ids.push(this_token);
    }

    return tokens_for_these_token_ids;
  };

  nft_supply_for_owner(account_id: string): string {
    assert(this.tokens_per_owner.contains(account_id));
    return this.tokens_per_owner.getSome(account_id).length.toString();
  };

  // should be a view function
  nft_tokens_for_owner(account_id: string, from_index: u64 = 0, limit: i32 = 0): Token[] {

    //get the tokens for the account ids
    const token_ids: string[] = this.tokens_per_owner.getSome(account_id);
    const this_users_tokens: Array<Token> = new Array<Token>();

    for (let i = 0; i < token_ids.length; i++) {
      const token: Token = this.tokens_by_id.getSome(token_ids[i]);
      this_users_tokens.push(token);
    }

    return this_users_tokens;
  };

  nft_metadata(): NFTContractMetadata {
    return new NFTContractMetadata();
  };

  nft_token(token_id: string): Token {
    return this.tokens_by_id.getSome(token_id);
  };


  // changing description
  update_nft_token(token_id: string, description: string): Token {
    assert(this.tokens_by_id.contains(token_id), 'token with given ID does not exist');
    const token = this.tokens_by_id.getSome(token_id);
    token.metadata.description = description;
    this.tokens_by_id.set(token_id, token);
    this.token_metadata_by_id.set(token_id, token.metadata);
    return token;
  };

  initialize_simple_art(): void {
    assert((context.predecessor == this.OWN), "Only owner may initialize.");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
        logging.log("already initialized");
    } else {
      this.simple_art_state.set("simple_art_state", new SimpleArtState());
      logging.log("initializing simple art state");
    }

  };

  // minting new token
  nft_mint(token_id: string, metadata: TokenMetadata): void {
    assert(!this.tokens_by_id.contains(token_id), 'ID is already used, use another ID');
    assert(!this.orders_for_token_id.contains(token_id), "This nft already has an order!");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    assert(current_simple_art_state != null, "simple art state was null");
    if (current_simple_art_state != null) {

      let this_user_token_ids: string[];

      if (this.tokens_per_owner.contains(context.predecessor)) {
        this_user_token_ids = this.tokens_per_owner.getSome(context.predecessor);
      } else {
        this_user_token_ids = [];
      }
      this_user_token_ids.push(token_id);

      const token = new Token(token_id, metadata, context.predecessor);
      let new_order_item = new Order(token_id, context.predecessor);
      this.orders_for_token_id.set(token_id, new_order_item);
      this.tokens_per_owner.set(context.predecessor, this_user_token_ids);
      this.tokens_by_id.set(token_id, token);
      this.token_metadata_by_id.set(token_id, token.metadata);
      this.all_nft_token_ids.push(token_id);
      current_simple_art_state.increase_mint_count();
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
      logging.log("set new mint");
    } else {
      logging.log("art state was null");
    }
  };


  // transfer nft token
  nft_transfer(receiver_id: string, token_id: string): void {
    const token: Token = this.tokens_by_id.getSome(token_id);
    assert(token.owner_id == context.sender, 'only allowed to send your own token');

    assert(this.tokens_by_id.contains(token_id), 'no token found by this id');
    assert(context.sender == context.predecessor, 'not allowing cross contract calls');

    // transfer ownership
    token.owner_id = receiver_id;
    this.tokens_by_id.set(token_id, token);

    // Remove id from existing owner
    const oldOwnerTokenIds: Array<string> = this.tokens_per_owner.getSome(context.sender);
    let indexToRemove = -1;
    for (let i = 0; i < oldOwnerTokenIds.length; i++) {
      if (oldOwnerTokenIds[i] == token_id) {
        indexToRemove = i;
        break;
      }
    }
    oldOwnerTokenIds.splice(indexToRemove, 1);
    this.tokens_per_owner.set(context.sender, oldOwnerTokenIds);

    // Add id to new owner
    let newOwnerTokenIds = new Array<string>();
    if (this.tokens_per_owner.contains(receiver_id)) {
      newOwnerTokenIds = this.tokens_per_owner.getSome(receiver_id);
    }
    newOwnerTokenIds.push(token_id);
    this.tokens_per_owner.set(receiver_id, newOwnerTokenIds);
  };

  update_nft_for_sale(token_id: string, price_for_sale: u128): void {

    assert(this.tokens_per_owner.contains(context.predecessor), "This nft art is not owned by you.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    this_order.setItemForSale(price_for_sale);

    this.orders_for_token_id.set(token_id, this_order);

  };


}


