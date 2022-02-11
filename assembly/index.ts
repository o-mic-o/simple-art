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

  // Maximum NFTs allowed (should be set to 10000)
  MAX_NFTS_ALLOWED: u64 = 10;

  // Owner of contract initializes the state
  OWN: string = "mic.testnet";

  //owner_id: string = context.contractName;

  // Various state and property declarations for storage
  simple_art_state: PersistentUnorderedMap<string, SimpleArtState> = new PersistentUnorderedMap<string, SimpleArtState>("a");
  get_simple_art_state(): Array<SimpleArtState> { return this.simple_art_state.values() };
  all_nft_token_ids: PersistentVector<string> = new PersistentVector<string>('all_nft_token_ids');
  tokens_per_owner: PersistentMap<string, Array<string>> = new PersistentMap<string, Array<string>>('tokens_pr_owner');
  tokens_by_id: PersistentMap<string, Token> = new PersistentMap<string, Token>('tokens_by_id');
  token_metadata_by_id: PersistentMap<string, TokenMetadata> = new PersistentMap<string, TokenMetadata>('token_metadata_by_id');
  orders_for_token_id: PersistentMap<string, Order> = new PersistentMap<string, Order>('orders_for_token_id');


  // Get all orders as a View method
  get_all_orders(): Array<Order> {

    const orders_for_these_token_ids: Array<Order> = new Array<Order>();

    for (let i = 0; i < this.all_nft_token_ids.length; i++) {
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
  nft_tokens(from_index: u64 = 0, limit: i32 = 1000): Array<Token> {
    const tokens_for_these_token_ids: Array<Token> = new Array<Token>();

    for (let i = 0; i < this.all_nft_token_ids.length; i++) {
      let this_token: Token = this.tokens_by_id.getSome(this.all_nft_token_ids[i]);
      tokens_for_these_token_ids.push(this_token);
    }

    return tokens_for_these_token_ids;
  };

  // Get NFT supply for owner
  nft_supply_for_owner(account_id: string): string {
    assert(this.tokens_per_owner.contains(account_id), "There were no nfts for this owner");
    return this.tokens_per_owner.getSome(account_id).length.toString();
  };

  // Get NFT tokens for owner as a View function
  nft_tokens_for_owner(account_id: string, from_index: u64 = 0, limit: i32 = 1000): Token[] {
    assert(this.tokens_per_owner.contains(account_id), "There were no nfts for this owner.");

    //get the tokens for the account ids
    const token_ids: string[] = this.tokens_per_owner.getSome(account_id);
    const this_users_tokens: Array<Token> = new Array<Token>();

    for (let i = 0; i < token_ids.length; i++) {
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


  // changing description
  //update_nft_token(token_id: string, description: string): Token {
  /* assert(this.tokens_by_id.contains(token_id), 'token with given ID does not exist');
   const token = this.tokens_by_id.getSome(token_id);
   token.metadata.description = description;
   this.tokens_by_id.set(token_id, token);
   this.token_metadata_by_id.set(token_id, token.metadata);
   return token;*/
  //};


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

  // Initializes favourited by, not needed to be used once deployed from scratch
  initialize_favourited_by(): void {
    assert((context.predecessor == this.OWN), "Only owner may initialize.");

    //const orders_for_these_token_ids: Array<Order> = new Array<Order>();
    for (let i = 0; i < this.all_nft_token_ids.length; i++) {
      let order: Order = this.orders_for_token_id.getSome(this.all_nft_token_ids[i]);
      order.initialize_favourited_by_users();
      this.orders_for_token_id.set(this.all_nft_token_ids[i], order);
    }

  }

  // Mint function for creating a new token with various assertations
  nft_mint(token_id: string, metadata: TokenMetadata, receiver_id: string): void {
    let current_simple_art_state = this.simple_art_state.get("simple_art_state");
    assert(current_simple_art_state != null, "simple art state was null");
    if (current_simple_art_state != null) {
      let value_deposited = context.attachedDeposit;
      assert(value_deposited == current_simple_art_state.mint_donation_cost, "Donation cost does not match");
      //Assign token id as just an increasing number
      token_id = (current_simple_art_state.mint_count + 1).toString();
      assert((current_simple_art_state.mint_count + 1) <= this.MAX_NFTS_ALLOWED, "Max NFTs allowed!")
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
      this.orders_for_token_id.set(token_id, new_order_item);
      this.tokens_per_owner.set(receiver_id, this_user_token_ids);
      this.tokens_by_id.set(token_id, token);
      this.token_metadata_by_id.set(token_id, token.metadata);
      this.all_nft_token_ids.push(token_id);
      current_simple_art_state.increase_mint_count();
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

    assert(token.owner_id == context.predecessor, 'only allowed to send your own token');

    assert(this.tokens_by_id.contains(token_id), 'no token found by this id');
    assert(context.sender == context.predecessor, 'not allowing cross contract calls');

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

      new_owner_token_ids.push(token_id);
      this.tokens_per_owner.set(receiver_id, new_owner_token_ids);
    }
  };

  // Updates the order for the given NFT to be for sale
  update_nft_for_sale(token_id: string, price_for_sale: u128): void {

    assert(this.tokens_by_id.getSome(token_id).owner_id == context.predecessor, "This nft art is not owned by you.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    assert(this_order.current_owner == context.predecessor, "This order is not owned by you. This should never happen.");

    this_order.setItemForSale(price_for_sale, context.blockTimestamp.toString());

    this.orders_for_token_id.set(token_id, this_order);

  };

  // Favourite this nft function
  favourite_this_nft(token_id: string, user_id: string): void {
    assert(user_id == context.predecessor, "Must set your own favourite.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen unless specifying a token_id that does not exist.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    this_order.set_favourite(user_id);

    this.orders_for_token_id.set(token_id, this_order);
  };

  // Cancel favourite of the NFT, removes this user from the array of likers
  cancel_favourite(token_id: string, user_id: string): void {
    assert(user_id == context.predecessor, "Must cancel your own favourite.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen unless specifying a token_id that does not exist.');

    let this_order = this.orders_for_token_id.getSome(token_id);
    this_order.remove_my_favourite(user_id);

    this.orders_for_token_id.set(token_id, this_order);
  };

  // Cancels for sale status of a given order
  cancel_nft_for_sale(token_id: string): void {

    assert(this.tokens_by_id.getSome(token_id).owner_id == context.predecessor, "This nft art is not owned by you.");
    assert(this.orders_for_token_id.contains(token_id), 'order type does not exist for this nft art. This should never happen unless specifying a token_id that does not exist.');

    let this_order = this.orders_for_token_id.getSome(token_id);
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
      if (indexToRemove != -1) {
        let system_royalty_to_subtract = u128.muldiv(this_order.price_for_sale, current_simple_art_state.market_royalty_percent, u128.from("100"));
        let creator_royalty_to_subtract = u128.muldiv(this_order.price_for_sale, current_simple_art_state.creator_royalty_percent, u128.from("100"));

        logging.log("Royalty to subtract ");
        logging.log(system_royalty_to_subtract);
        logging.log("value of deposit");
        logging.log(value_deposited);
        let difference_with_system_royalty = u128.sub(value_deposited, system_royalty_to_subtract);
        let difference_with_creator_and_system_royalty = u128.sub(difference_with_system_royalty, creator_royalty_to_subtract);




        const this_token: Token = this.tokens_by_id.getSome(token_id);
        // transfer ownership
        this_token.owner_id = address_of_new_owner;
        this.tokens_by_id.set(token_id, this_token);
        this.token_metadata_by_id.set(token_id, this_token.metadata);

        // Remove id from old owner
        /*const old_owner_token_ids: Array<string> = this.tokens_per_owner.getSome(address_of_owner);
        let indexToRemove = -1;
        for (let i = 0; i < old_owner_token_ids.length; i++) {
          if (old_owner_token_ids[i] == token_id) {
            indexToRemove = i;
            break;
          }
        }*/

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

        this.orders_for_token_id.set(token_id, this_order);
        this.simple_art_state.set("simple_art_state", current_simple_art_state);

        logging.log("Calling nft transfer to self to formalize into wallet");


        if ((context.predecessor != original_creator) && (address_of_owner != original_creator)) {
          //Send royalty payment to original nft creator when the original creator is not the one purchasing, and not the one buying directly from.
          ContractPromiseBatch.create(original_creator).transfer(creator_royalty_to_subtract);
          ContractPromiseBatch.create(address_of_owner).transfer(difference_with_creator_and_system_royalty);
        } else {
          ContractPromiseBatch.create(address_of_owner).transfer(difference_with_system_royalty);
        }
        //this.nft_transfer(context.predecessor, token_id);
      }
    }
  };
}


