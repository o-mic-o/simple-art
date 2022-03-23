import { PersistentMap, PersistentVector, PersistentUnorderedMap, context, u128, logging, ContractPromiseBatch } from 'near-sdk-as';
import { Token, TokenMetadata, Order, SimpleArtState } from './model';

// Declares token metadata to standars of NEP
@nearBindgen
class NFTContractMetadata {

  constructor(
    public spec: string = 'nft-2.0.0',
    public name: string = 'Simple Art',
    public symbol: string = 'SIMPLEART',
    public icon: string = '',
    public base_uri: string = '', // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    public reference: string = '', // URL to a JSON file with more info
    public reference_hash: string = '' // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  ) { }

}

// Declares Contract class which contains the public methods available for this contract
@nearBindgen
export class Contract {

  // Maximum NFTs allowed (should be set to value)  // set in simple art state
  //MAX_NFTS_ALLOWED : u64 = 3333;

  // Owner of contract initializes the state
  OWN: string = "mic.testnet";
  SYSTEM_OWN: string = "simpleartclub.testnet";
  SELF_COMMUNITY: string = "simpleartclub.testnet";
  //owner_id: string = context.contractName;

  // Various state and property declarations for storage
  simple_art_state: PersistentUnorderedMap<string, SimpleArtState> = new PersistentUnorderedMap<string, SimpleArtState>("a");
  get_simple_art_state(): Array<SimpleArtState> { return this.simple_art_state.values() };
  all_nft_token_ids: PersistentVector<string> = new PersistentVector<string>('all_nft_token_ids');
  tokens_per_owner: PersistentMap<string, Array<string>> = new PersistentMap<string, Array<string>>('tokens_pr_owner');
  tokens_by_id: PersistentMap<string, Token> = new PersistentMap<string, Token>('tokens_by_id');
  token_metadata_by_id: PersistentMap<string, TokenMetadata> = new PersistentMap<string, TokenMetadata>('token_metadata_by_id');
  orders_for_token_id: PersistentMap<string, Order> = new PersistentMap<string, Order>('orders_for_token_id');

  // Methods for owners:
  // add_system_owner
  // initiate_or_append_this_variant_whitelisting
  // modify_variant_limit
  // add_new_variant
  // send_donations_to_vault
  // set_nft_is_blocked
  // unblock_this_nft
  // modify_variant_mint_price

  add_system_owner(incoming_new_system_owner: string) : void {
    assert((context.predecessor == this.OWN), "Must be owner to add new system owner");
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");

    if (current_simple_art_state != null) {
      current_simple_art_state.add_system_owner(incoming_new_system_owner);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }

  };

  initiate_or_append_this_variant_whitelisting(incoming_variant_name: string, incoming_whitelist_array_of_strings: Array<string>, incoming_is_initiate: boolean) : void {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");

    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Must be a system owner to append or initiate a variant");

      current_simple_art_state.initiate_or_append_this_variant_whitelisting(incoming_variant_name, incoming_whitelist_array_of_strings, incoming_is_initiate);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }

  };

  modify_variant_limit(incoming_variant_name: string, incoming_variant_new_max: u64): void {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Must be owner to modify variant limit for category");

      let this_variant_index = current_simple_art_state.get_this_nft_variant_index(incoming_variant_name);
      current_simple_art_state.modify_variant_limit(this_variant_index, incoming_variant_new_max);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }

  };

  is_on_this_variant_whitelist(incoming_variant_name: string, incoming_to_check_on_whitelist: string) : boolean {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      return current_simple_art_state.is_on_this_variant_whitelist(incoming_variant_name, incoming_to_check_on_whitelist);
    }
    return false;
  };

  this_whitelisted_users_current_minting_number_for_variant(incoming_variant_name: string, incoming_to_check_on_whitelist: string) : u64 {
      let current_simple_art_state = this.simple_art_state.get("simple_art_state");
      if (current_simple_art_state != null) {
        let this_variant_index = current_simple_art_state.get_this_nft_variant_index(incoming_variant_name);
        return current_simple_art_state.get_this_mint_count_number_for_whitelisted_user(this_variant_index, incoming_to_check_on_whitelist);
      } else {
        return -3;
      }
  };

  get_whitelisting_for_this_nft_variant(incoming_variant_name: string) : Array<string> {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      let this_variant_index = current_simple_art_state.get_this_nft_variant_index(incoming_variant_name);
      if (this_variant_index == -1) { return []; }
      else {
        return current_simple_art_state.mint_variant_whitelistings[this_variant_index];
      }
    } else {
      return [];
    }
  };

  add_new_variant(incoming_variant_name: string, incoming_variant_max_nfts: u64, incoming_variant_mint_donation_cost: string, incoming_variant_mint_max_per_user: u64): void {
    //Should set to 0 for incoming_variant_mint_max_per_user if wanting any amount! This is asserted on index.ts under nft_mint()

    //assert((context.predecessor == this.OWN), "Must be owner to add new variant");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Must be an owner to add new variant");

      current_simple_art_state.add_new_variant(incoming_variant_name, incoming_variant_max_nfts, incoming_variant_mint_donation_cost, incoming_variant_mint_max_per_user);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }

  };

  send_donations_to_vault(amount_in_near: u128): void {
    //assert((context.predecessor == this.OWN || context.predecessor == this.SYSTEM_OWN), "Must be owner to send donations to vault");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Must be an owner to send donations to vault");

      current_simple_art_state.increase_system_moved_to_vault(amount_in_near);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }

    ContractPromiseBatch.create(this.SYSTEM_OWN).transfer(amount_in_near);
  };

  /*initialize_dao_royalties() : void {
    assert((context.predecessor == this.OWN), "Only owner may initialize.");
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      current_simple_art_state.initialize_dao_royalties();
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }
  };*/

  /*initialize_nft_variants() : void {
    assert((context.predecessor == this.OWN), "Only owner may initialize.");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      current_simple_art_state.initialize_nft_variants();
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }
  };*/

  set_nft_is_blocked(token_id: string) : void {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Only owner may set blocked");

      let this_order = this.orders_for_token_id.getSome(token_id);
      this_order.set_is_blocked();
      this.orders_for_token_id.set(token_id, this_order);
    }
  };

  unblock_this_nft(token_id: string): void {
    //assert((context.predecessor == this.OWN), "Only owner may initialize.");
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Only owner may unblock");

      let this_order = this.orders_for_token_id.getSome(token_id);
      this_order.initialize_is_blocked();
      this.orders_for_token_id.set(token_id, this_order);
    }
  };

  modify_variant_mint_price(incoming_variant_name: string, incoming_mint_price: u128) : void {
    //assert((context.predecessor == this.OWN), "Only owner may initialize.");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      assert(current_simple_art_state.system_owners.includes(context.predecessor), "Only owner may modify variant mint price");

      let this_variant_index = current_simple_art_state.get_this_nft_variant_index(incoming_variant_name);
      current_simple_art_state.modify_variant_mint_price(this_variant_index, incoming_mint_price);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
    }

  }
  // Get all orders as a view method
  get_all_orders(from_index: i32 = 0, limit: i32 = 1000): Array<Order> {
    //must paginate with using mint_count from simple_art_state as limit!

    const orders_for_these_token_ids: Array<Order> = new Array<Order>();
    let to_this_limit = (limit < this.all_nft_token_ids.length) ? limit : this.all_nft_token_ids.length;

    for (let i = from_index; i < to_this_limit; i++) {
      let order: Order = this.orders_for_token_id.getSome(this.all_nft_token_ids[i]);
      orders_for_these_token_ids.push(order);
    }

    return orders_for_these_token_ids;

  };

  // Get NFT total supply
  nft_total_supply(): string {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    if (current_simple_art_state != null) {
      return current_simple_art_state.mint_count.toString();
    } else {
      return "0";
    }
  };

  // Get all NFT tokens
  nft_tokens(from_index: i32 = 0, limit: i32 = 1000): Array<Token> {
    const tokens_for_these_token_ids: Array<Token> = new Array<Token>();

    let to_this_limit = (limit < this.all_nft_token_ids.length) ? limit : this.all_nft_token_ids.length;

    for (let i = from_index; i < to_this_limit; i++) {
      let this_token: Token = this.tokens_by_id.getSome(this.all_nft_token_ids[i]);
      tokens_for_these_token_ids.push(this_token);
    }

    return tokens_for_these_token_ids;
  };

  // Get NFT supply for owner
  nft_supply_for_owner(account_id: string): string {
    assert(this.tokens_per_owner.contains(account_id),"There were no nfts for this owner");
    return this.tokens_per_owner.getSome(account_id).length.toString();
  };

  // Get NFT tokens for owner as a View function
  nft_tokens_for_owner(account_id: string, from_index: i32 = 0, limit: i32 = 1000): Token[] {
    assert(this.tokens_per_owner.contains(account_id), "There were no nfts for this owner.");

    //get the tokens for the account ids
    const token_ids: string[] = this.tokens_per_owner.getSome(account_id);
    const this_users_tokens: Array<Token> = new Array<Token>();

    let to_this_limit = (limit < token_ids.length) ? limit : token_ids.length;

    for (let i = from_index; i < to_this_limit; i++) {
      const token: Token = this.tokens_by_id.getSome(token_ids[i]);
      this_users_tokens.push(token);
    }

    return this_users_tokens;
  };

  // Required nft_metadata for viewing in wallet
  nft_metadata(): NFTContractMetadata {
    return new NFTContractMetadata();
  };

  // Returns a given token
  nft_token(token_id: string): Token {
    return this.tokens_by_id.getSome(token_id);
  };


  // Initializes the simple art state
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


  // Mint function for creating a new token with various assertations
  nft_mint(token_id: string, metadata: TokenMetadata, receiver_id: string, incoming_variant_name: string): void {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    assert(current_simple_art_state != null, "simple art state was null");
    if (current_simple_art_state != null) {

      let value_deposited = context.attachedDeposit;

      //assert(value_deposited == current_simple_art_state.mint_donation_cost, "Donation cost does not match");

      //Assign token id as just an increasing number
      token_id = (current_simple_art_state.mint_count+1).toString();

      let this_variant_index = current_simple_art_state.get_this_nft_variant_index(incoming_variant_name);
      assert(this_variant_index != -1, "No variant type found for this!");

      let this_variant_amount = current_simple_art_state.max_nfts_for_mint_variants[this_variant_index];
      let this_variant_mint_count = current_simple_art_state.mint_counts_for_variants[this_variant_index];
      assert((this_variant_mint_count + 1) <= this_variant_amount, "Max NFTs allowed for this nft variant!")
      //assert((current_simple_art_state.mint_count + 1) <= this.MAX_NFTS_ALLOWED, "Max NFTs allowed!")


      let this_variant_receipient_is_on_whitelist = current_simple_art_state.is_on_this_variant_whitelist(incoming_variant_name, (context.predecessor.toString()));
      assert(this_variant_receipient_is_on_whitelist, "Not on the whitelisting for this variant!");

      logging.log("Trying to get mint_count_number_for_whitelisted user");
      let this_variant_mint_counting_for_this_user = current_simple_art_state.get_this_mint_count_number_for_whitelisted_user(this_variant_index, (context.predecessor).toString());
      assert(this_variant_mint_counting_for_this_user != -1, "This user was not found on whitelist!")

      logging.log("Proceeding to check maximum amount for index");
      logging.log(this_variant_mint_counting_for_this_user.toString());
      let this_variant_mint_maximum_per_user = current_simple_art_state.mint_variant_mint_maximum_amount[this_variant_index];

      logging.log("This variant comparison:");
      logging.log(this_variant_mint_maximum_per_user.toString())
      logging.log((this_variant_mint_counting_for_this_user+1).toString());

      if (this_variant_mint_maximum_per_user != 0) {
        assert(((this_variant_mint_counting_for_this_user + 1) <= this_variant_mint_maximum_per_user), "The mint count for this user exceeds the maximum amount for this variant!");
      }


      assert(value_deposited == current_simple_art_state.mint_for_variant_donation_cost[this_variant_index], "Donation cost does not match for this nft variant!");


      assert(context.predecessor == receiver_id, "must mint to the originating address");
      assert(!this.tokens_by_id.contains(token_id), 'ID is already used, use another ID');
      assert(!this.orders_for_token_id.contains(token_id), "This nft already has an order!");


      let this_user_token_ids: string[];

      if (this.tokens_per_owner.contains(receiver_id)) {
        this_user_token_ids = this.tokens_per_owner.getSome(receiver_id);
      } else {
        current_simple_art_state.increase_artist_count();
        this_user_token_ids = new Array<string>();
      }
      this_user_token_ids.push(token_id);

      const token = new Token(token_id, metadata, receiver_id);
      let new_order_item = new Order(token_id, receiver_id);
      new_order_item.mintAction(context.blockTimestamp.toString());


      new_order_item.set_variant_type(incoming_variant_name)


      this.orders_for_token_id.set(token_id, new_order_item);
      this.tokens_per_owner.set(receiver_id, this_user_token_ids);
      this.tokens_by_id.set(token_id, token);
      this.token_metadata_by_id.set(token_id, token.metadata);
      this.all_nft_token_ids.push(token_id);
      current_simple_art_state.increase_mint_count();

      current_simple_art_state.increase_variant_mint_count(this_variant_index);
      current_simple_art_state.increase_mint_variant_mint_number_counting_for_whitelisted_user(this_variant_index, (context.predecessor).toString());
      current_simple_art_state.increase_system_earned(value_deposited);
      this.simple_art_state.set("simple_art_state", current_simple_art_state);
      logging.log("set new mint");

    } else {
      logging.log("art state was null");
    }
  };


  // NFT transfer function
  nft_transfer(receiver_id: string, token_id: string): void {
    const token: Token = this.tokens_by_id.getSome(token_id);
    let this_order = this.orders_for_token_id.getSome(token_id);

    assert(token.owner_id == context.predecessor, 'only allowed to send your own token');
    assert(!this_order.is_blocked, "This order is blocked.");
    assert(this.tokens_by_id.contains(token_id), 'no token found by this id');
    assert(context.sender == context.predecessor, 'not allowing cross contract calls');

    assert(context.predecessor == this_order.current_owner, "Order is not owned by you.");
    // Remove id from existing owner
    const oldOwnerTokenIds: Array<string> = this.tokens_per_owner.getSome(context.predecessor);
    let indexToRemove = -1;
    for (let i = 0; i < oldOwnerTokenIds.length; i++) {
      if (oldOwnerTokenIds[i] == token_id) {
        indexToRemove = i;
        break;
      }
    }

    assert(indexToRemove != -1, "This original owner does not have this token_id in tokens_per_owner. This should never happen!");
    if (indexToRemove != -1) {
      // transfer ownership
      token.owner_id = receiver_id;
      this.tokens_by_id.set(token_id, token);


      oldOwnerTokenIds.splice(indexToRemove, 1);
      this.tokens_per_owner.set(context.sender, oldOwnerTokenIds);

      // Add id to new owner
      let new_owner_token_ids: string[];
      if (this.tokens_per_owner.contains(receiver_id)) {
        logging.log("this owner already exists in map");
        new_owner_token_ids = this.tokens_per_owner.getSome(receiver_id);
      } else {
        logging.log("Init empty array");
        new_owner_token_ids = new Array<string>();
      }

      this_order.itemWasTransferred(receiver_id, context.blockTimestamp.toString());
      this.orders_for_token_id.set(token_id, this_order);

      new_owner_token_ids.push(token_id);
      this.tokens_per_owner.set(receiver_id, new_owner_token_ids);
    }
  };

  // Updates the order for the given NFT to be for sale
  update_nft_for_sale(token_id: string, price_for_sale: u128): void {

    assert(this.tokens_by_id.getSome(token_id).owner_id == context.predecessor, "This nft art is not owned by you.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    assert(!this_order.is_blocked, "This order is blocked.");
    assert(this_order.current_owner == context.predecessor, "This order is not owned by you. This should never happen.");

    this_order.setItemForSale(price_for_sale, context.blockTimestamp.toString());

    this.orders_for_token_id.set(token_id, this_order);

  };

  // Favourite this nft function
  favourite_this_nft(token_id: string, user_id: string) : void {
    assert(user_id == context.predecessor, "Must set your own favourite.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen unless specifying a token_id that does not exist.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    assert(!this_order.is_blocked, "This order is blocked.");
    this_order.set_favourite(user_id);

    this.orders_for_token_id.set(token_id, this_order);
  };

  // Cancel favourite of the NFT, removes this user from the array of likers
  cancel_favourite(token_id: string, user_id: string) : void {
    assert(user_id == context.predecessor, "Must cancel your own favourite.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen unless specifying a token_id that does not exist.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    assert(!this_order.is_blocked, "This order is blocked.");
    this_order.remove_my_favourite(user_id);

    this.orders_for_token_id.set(token_id, this_order);
  };

  // Cancels for sale status of a given order
  cancel_nft_for_sale(token_id: string): void {

    assert(this.tokens_by_id.getSome(token_id).owner_id == context.predecessor, "This nft art is not owned by you.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen unless specifying a token_id that does not exist.');

    let this_order = this.orders_for_token_id.getSome(token_id);

    assert(!this_order.is_blocked, "This order is blocked.");
    assert(this_order.current_owner == context.predecessor, "This order is not owned by you. This should never happen.");

    this_order.cancelItemForSale(context.blockTimestamp.toString());
    this.orders_for_token_id.set(token_id, this_order);

  };

  // Buy NFT functionality, various assertations, and transfers ownership of the nft if satisfied
  // This sends the royalty of the original artist to the original artist
  // This sends the resulting difference to the current owner who is selling the NFT
  // A second royalty difference is taken for the smart contract system itself, and deduced to get the resulting difference above
  buy_this_nft_from_owner(receiver_id: string, token_id: string): void {
    assert(this.tokens_by_id.getSome(token_id).owner_id != context.predecessor, "This nft art is already owned by you.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    let original_creator = this_order.original_creator;

    let value_deposited = context.attachedDeposit;

    assert(!this_order.is_blocked, "This order is blocked.");
    assert(this_order.current_owner != context.predecessor, "This order is already owned by you.");
    assert(receiver_id == context.predecessor, "Must purchase for yourself!");
    assert(this_order.forSale, "Not for sale");
    assert(this_order.price_for_sale == value_deposited, "Must be the correct amount, funds should return.");

    let current_simple_art_state = this.simple_art_state.get("simple_art_state");

    let old_owner_token_ids = this.tokens_per_owner.getSome(this_order.current_owner);
    let address_of_owner = this_order.current_owner;
    let address_of_new_owner = context.predecessor;

    let indexToRemove = -1;
    for (let i = 0; i < old_owner_token_ids.length; i++) {
      if (old_owner_token_ids[i] == token_id) {
        indexToRemove = i;
        break;
      }
    }

    assert(indexToRemove != -1, "This token was not found on the old_owner tokens_per_owner. This should never happen!");

    if (current_simple_art_state != null) {
      let this_variant_index = current_simple_art_state.get_this_nft_variant_index(this_order.variant_type);

      if (indexToRemove != -1) {
        let system_royalty_to_subtract = u128.muldiv(this_order.price_for_sale, current_simple_art_state.market_royalty_percent, u128.from("100"));
        let creator_royalty_to_subtract = u128.muldiv(this_order.price_for_sale, current_simple_art_state.creator_royalty_percent, u128.from("100"));
        let dao_royalty_to_subtract = u128.muldiv(this_order.price_for_sale, current_simple_art_state.creator_dao_royalty_percent, u128.from("100"));


        logging.log("Royalty to subtract ");
        logging.log(system_royalty_to_subtract);
        logging.log("value of deposit");
        logging.log(value_deposited);
        logging.log("creator royalty");
        logging.log(creator_royalty_to_subtract);
        logging.log("dao royalty to subtract");
        logging.log(dao_royalty_to_subtract);

        let difference_with_system_royalty = u128.sub(value_deposited, system_royalty_to_subtract);
        let difference_with_system_royalty_and_dao_royalty = u128.sub(difference_with_system_royalty, dao_royalty_to_subtract);

        let difference_with_creator_and_system_royalty = u128.sub(difference_with_system_royalty, creator_royalty_to_subtract);
        let difference_with_creator_and_system_royalty_and_dao = u128.sub(difference_with_creator_and_system_royalty, dao_royalty_to_subtract);


        const this_token: Token = this.tokens_by_id.getSome(token_id);
        // transfer ownership
        this_token.owner_id = address_of_new_owner;
        this.tokens_by_id.set(token_id, this_token);
        this.token_metadata_by_id.set(token_id, this_token.metadata);


        old_owner_token_ids.splice(indexToRemove, 1);
        this.tokens_per_owner.set(address_of_owner, old_owner_token_ids);

        // Add id to new owner
        let new_owner_token_ids: string[];
        if (this.tokens_per_owner.contains(address_of_new_owner)) {
          logging.log("new owner already exists in map");
          new_owner_token_ids = this.tokens_per_owner.getSome(address_of_new_owner);
        } else {
          logging.log("Init empty array");
          new_owner_token_ids = new Array<string>();
        }


        new_owner_token_ids.push(token_id);
        this.tokens_per_owner.set(address_of_new_owner, new_owner_token_ids);
        logging.log("Set tokens per owner with new address of new owner, and ")


        this_order.order_was_filled(this_order.price_for_sale, context.blockTimestamp.toString(), context.predecessor);

        current_simple_art_state.increase_system_earned(system_royalty_to_subtract);
        current_simple_art_state.increase_market_volume(this_order.price_for_sale);

        if ((context.predecessor != original_creator) && (address_of_owner != original_creator)) {
          this_order.increase_this_order_royalites_earned(creator_royalty_to_subtract)
          current_simple_art_state.increase_creator_royalites_earned(creator_royalty_to_subtract);
        }

        if (current_simple_art_state.mint_variants[this_variant_index] != this.SELF_COMMUNITY) {
          current_simple_art_state.increase_dao_royalties_earned(dao_royalty_to_subtract);
        }

        this.orders_for_token_id.set(token_id, this_order);
        this.simple_art_state.set("simple_art_state", current_simple_art_state);

        logging.log("Calling nft transfer to self to formalize into wallet");

        if ((context.predecessor != original_creator) && (address_of_owner != original_creator)) {
          //Send royalty payment to original nft creator when the original creator is not the one purchasing, and not the one buying directly from.
          if (current_simple_art_state.mint_variants[this_variant_index] == this.SELF_COMMUNITY) {
            ContractPromiseBatch.create(original_creator).transfer(creator_royalty_to_subtract);
            ContractPromiseBatch.create(address_of_owner).transfer(difference_with_creator_and_system_royalty);
          } else {
            ContractPromiseBatch.create(original_creator).transfer(creator_royalty_to_subtract);
            ContractPromiseBatch.create(current_simple_art_state.mint_variants[this_variant_index]).transfer(dao_royalty_to_subtract);
            ContractPromiseBatch.create(address_of_owner).transfer(difference_with_creator_and_system_royalty_and_dao);
          }
        } else {
          if (current_simple_art_state.mint_variants[this_variant_index] == this.SELF_COMMUNITY) {
            ContractPromiseBatch.create(address_of_owner).transfer(difference_with_system_royalty);
          } else {
            ContractPromiseBatch.create(current_simple_art_state.mint_variants[this_variant_index]).transfer(dao_royalty_to_subtract);
            ContractPromiseBatch.create(address_of_owner).transfer(difference_with_system_royalty_and_dao_royalty);
          }
        }
        //this.nft_transfer(context.predecessor, token_id);
      }
    }
  };
}


