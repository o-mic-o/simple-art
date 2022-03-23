// implementation based on NEP-171
// https://nomicon.io/Standards/NonFungibleToken/Core.html

import { u128 } from "near-sdk-as";
import { ContractPromise } from 'near-sdk-as';

// Declares TokenMetadata, based on NEP Standards
@nearBindgen
export class TokenMetadata {
  title: string; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description: string; // free-form description
  media: string; // URL to associated media, preferably to decentralized, content-addressed storage
  media_hash: string; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies: string; // number of copies of this set of metadata in existence when token was minted.
  issued_at: string; // When token was issued or minted, Unix epoch in milliseconds
  expires_at: string; // When token expires, Unix epoch in milliseconds
  starts_at: string; // When token starts being valid, Unix epoch in milliseconds
  updated_at: string; // When token was last updated, Unix epoch in milliseconds
  extra: string; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference: string; // URL to an off-chain JSON file with more info.
  reference_hash: string; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
}


// Declares Token, based on NEP Standards
@nearBindgen
export class Token {
  id: string;
  owner_id: string;
  metadata: TokenMetadata;
  constructor(token_id: string, metadata: TokenMetadata, receiver_id: string) {
    this.id = token_id;
    this.metadata = metadata;
    this.owner_id = receiver_id;
  }
}

/*
@nearBindgen
export class SimpleArtToken {
  token: Token;

  constructor(token_id: string, metadata: TokenMetadata, receiver_id: string) {
    this.token = { id: token_id, metadata: metadata, owner_id: receiver_id };
  }

  // --- view methods --- //

  nft_token(): Token {
    return this.token;
  }

  // --- change methods --- //

  nft_transfer_call(
    receiver_id: string,
    token_id: string,
    approval_id: number,
    memo: string,
    msg: string
  ): ContractPromise {
    // assert(false, 'nft_transfer_call not implemented');
    return ContractPromise.create('', '', {}, 1);
  }
}
*/

// Order type, used for mapping and guiding the simple market
@nearBindgen
export class Order {
  token_id: string;
  forSale: boolean;
  price_for_sale: u128;
  current_owner: string;
  original_creator: string;

  history_action_type: Array<string>;
  history_timestamp: Array<string>;
  history_price: Array<string>;
  history_owner_acted: Array<string>;

  this_order_royalties_earned: u128;
  favourited_by_users: Array<string>;
  is_blocked: boolean;

  variant_type: string;

  constructor(token_id: string, current_owner: string) {
    this.token_id = token_id;
    this.forSale = false;
    this.current_owner = current_owner;
    this.original_creator = current_owner;
    this.history_action_type = new Array<string>();
    this.history_timestamp = new Array<string>();
    this.history_price = new Array<string>();
    this.history_owner_acted = new Array<string>();
    this.this_order_royalties_earned = u128.from("0");
    this.favourited_by_users = new Array<string>();
    this.is_blocked = false;
    this.variant_type = "";
  }

  set_variant_type(incoming_variant_type: string) : void {
    this.variant_type = incoming_variant_type;
  };

  initialize_is_blocked() : void {
    this.is_blocked = false;
  }

  set_is_blocked() : void {
    this.is_blocked = true;
  }

  //Set a favourite (like) method
  set_favourite(owner_that_wants_to_make_this_favourited: string) : void {
    this.favourited_by_users.push(owner_that_wants_to_make_this_favourited);
  };

  //Un-favourite an item
  remove_my_favourite(owner_that_wants_to_remove_favourite: string) : void {
    let indexToRemove = -1;
    for (let i = 0; i < this.favourited_by_users.length; i++) {
      if (this.favourited_by_users[i] == owner_that_wants_to_remove_favourite) {
        indexToRemove = i;
        break;
      }
    }
    if (indexToRemove != -1) {
      this.favourited_by_users.splice(indexToRemove, 1);
    }
  };

  // Create a "mint" action, saved in the history of the item all on-chain
  mintAction(block_timestamp:string) : void {
    this.history_action_type.push("mint");
    this.history_timestamp.push(block_timestamp);
    this.history_price.push("");
    this.history_owner_acted.push(this.current_owner);
  };

  // Set an order to be for sale, and create a "list" action in the history
  setItemForSale(price: u128, block_timestamp: string): void {
    this.forSale = true;
    this.price_for_sale = price;

    this.history_action_type.push("list");
    this.history_timestamp.push(block_timestamp);
    this.history_price.push(price.toString());
    this.history_owner_acted.push("");
  };

  // Set an order to be filled, with a new owner, and set a "buy" action
  order_was_filled(price_sold_at: u128, sale_history_block_timestamp: string, new_owner: string): void {
    this.current_owner = new_owner;

    this.history_action_type.push("buy");
    this.history_timestamp.push(sale_history_block_timestamp);
    this.history_price.push(price_sold_at.toString());
    this.history_owner_acted.push(new_owner);

    this.forSale = false;
  };

  // Cancel an item for sale status, and create a "cancel" action
  cancelItemForSale(block_timestamp: string) : void {
    this.forSale = false;

    this.history_action_type.push("cancel");
    this.history_timestamp.push(block_timestamp);
    this.history_price.push("");
    this.history_owner_acted.push("");
  };

  itemWasTransferred(new_owner: string, block_timestamp: string): void {
    this.forSale = false;

    this.history_action_type.push("transfer");
    this.history_timestamp.push(block_timestamp);
    this.history_price.push("");
    this.history_owner_acted.push(this.current_owner);

    this.current_owner = new_owner;
  };

  // Increase the royalty counter for the artist royalty for this item's order
  increase_this_order_royalites_earned(incoming_increase: u128): void {
    this.this_order_royalties_earned = u128.add(this.this_order_royalties_earned, incoming_increase)
  };
}

// Full system state, which includes various counters and royalty information
@nearBindgen
export class SimpleArtState {
  mint_count: u64;
  artist_count: u64;
  mint_donation_cost: u128;

  market_royalty_percent: u128;
  creator_royalty_percent: u128;
  creator_dao_royalty_percent: u128;

  system_earned: u128;
  market_volume: u128;
  creators_royalties_earned: u128;
  dao_royalties_earned: u128;

  system_moved_to_vault: u128;

  max_nfts_for_mint_variants: Array<u64>;
  mint_variants: Array<string>;
  mint_counts_for_variants: Array<u64>;

  mint_for_variant_donation_cost: Array<u128>;

  mint_variant_whitelistings: string[][];
  mint_variant_mint_number_counting: u64[][];
  mint_variant_mint_maximum_amount: Array<u64>;

  system_owners: Array<string>;

  constructor() {
    this.system_owners = ["mic.testnet", "simpleartclub.testnet"];

    this.mint_count = 0;
    this.mint_donation_cost = u128.from("3000000000000000000000000");

    this.market_royalty_percent = u128.from("3");
    this.creator_royalty_percent = u128.from("6");
    this.creator_dao_royalty_percent = u128.from("6");
    this.system_earned = u128.from("0");
    this.market_volume = u128.from("0");
    this.creators_royalties_earned = u128.from("0");
    this.dao_royalties_earned = u128.from("0");

    this.system_moved_to_vault = u128.from("0");

    this.max_nfts_for_mint_variants = [1000, 500, 1000, 30, 300];
    this.mint_variants = ["simpleartclub.testnet", "rare.sputnikv2.testnet", "community.sputnikv2.testnet", "chaintyping.testnet", "jellycottage.testnet"];
    this.mint_counts_for_variants = [0,0,0,0,0];
    this.mint_for_variant_donation_cost = [u128.from("250000000000000000000000"), u128.from("250000000000000000000000"), u128.from("100000000000000000000000"), u128.from("1000000000000000000000"), u128.from("50000000000000000000000")];
    this.mint_variant_whitelistings = [[], [], [], [], []];
    this.mint_variant_mint_number_counting = [[], [], [], [], []];
    this.mint_variant_mint_maximum_amount = [0, 1, 0, 1, 0];
  }

  /*initialize_nft_variants(): void {
    this.max_nfts_for_mint_variants = [1000, 500, 1000, 30, 300];
    this.mint_variants = ["simpleartclub.testnet", "rare.sputnikv2.testnet", "community.sputnikv2.testnet", "chaintyping.testnet", "jellycottage.testnet"];
    this.mint_counts_for_variants = [0, 0, 0, 0, 0];
    this.mint_for_variant_donation_cost = [u128.from("250000000000000000000000"), u128.from("250000000000000000000000"), u128.from("100000000000000000000000"), u128.from("1000000000000000000000"), u128.from("50000000000000000000000")];
    this.mint_variant_whitelistings = [[], [], [], [], []];
    this.mint_variant_mint_number_counting = [[], [], [], [], []];
    this.mint_variant_mint_maximum_amount = [0, 1, 0, 1, 0];
  };*/


  add_system_owner(incoming_new_system_owner: string) : void {
    this.system_owners.push(incoming_new_system_owner);
  };

 /*initialize_dao_royalties() : void {
    this.dao_royalties_earned = u128.from("0");
    this.creator_dao_royalty_percent = u128.from("6");
    this.mint_variants = ["simpleartclub.testnet", "rare.sputnikv2.testnet", "community.sputnikv2.testnet", "chaintyping.testnet", "jellycottage.testnet"];
  };*/

  is_on_this_variant_whitelist(incoming_variant_name: string, incoming_to_check_on_whitelist: string) : boolean {
    let index_to_find = -1;
    for (let i = 0; i < this.mint_variants.length; i++) {
      if (this.mint_variants[i] == incoming_variant_name) {
        index_to_find = i;
        break;
      }
    }

    if (index_to_find != -1) {
      if (this.mint_variant_whitelistings[index_to_find].length == 0) { return true; }

      for (let k = 0; k < this.mint_variant_whitelistings[index_to_find].length; k++) {
        if (this.mint_variant_whitelistings[index_to_find][k] == incoming_to_check_on_whitelist) {
          return true;
        }
      }

      return false;

    } else {
      return false;
    }
  };

  initiate_or_append_this_variant_whitelisting(incoming_variant_to_find: string, incoming_whitelist_array_of_strings: Array<string>, is_initiate: boolean) : void {
    let index_to_find = -1;
    for (let i = 0; i < this.mint_variants.length; i++) {
      if (this.mint_variants[i] == incoming_variant_to_find) {
        index_to_find = i;
        break;
      }
    }


    if (is_initiate) {
      this.mint_variant_mint_number_counting[index_to_find] = [];
    }

    for (let k = 0; k < incoming_whitelist_array_of_strings.length; k++) {
      this.mint_variant_whitelistings[index_to_find].push(incoming_whitelist_array_of_strings[k]);
      this.mint_variant_mint_number_counting[index_to_find].push(0);
    }

  };


  get_this_nft_variant_index(incoming_variant_to_find: string) : i32 {
    let index_to_find = -1;
    for (let i = 0; i < this.mint_variants.length; i++) {
      if (this.mint_variants[i] == incoming_variant_to_find) {
        index_to_find = i;
        break;
      }
    }

    return index_to_find;
  };

  get_this_mint_count_number_for_whitelisted_user(this_index_of_variant: i32, incoming_to_check_on_whitelist: string): u64 {

    if (this.mint_variant_whitelistings[this_index_of_variant].length == 0) {
      return -2;
    }

    for (let k = 0; k < this.mint_variant_whitelistings[this_index_of_variant].length; k++) {
      if (this.mint_variant_whitelistings[this_index_of_variant][k] == incoming_to_check_on_whitelist) {
        return this.mint_variant_mint_number_counting[this_index_of_variant][k];
      }
    }

    return -1;

  };


  increase_mint_variant_mint_number_counting_for_whitelisted_user(this_index_of_variant: i32, incoming_to_check_on_whitelist: string) : boolean {

    if (this.mint_variant_whitelistings[this_index_of_variant].length == 0) {
      return false;

    } else {

      let this_index_to_find = -1;
      for (let k = 0; k < this.mint_variant_whitelistings[this_index_of_variant].length; k++) {
        if (this.mint_variant_whitelistings[this_index_of_variant][k] == incoming_to_check_on_whitelist) {
          this_index_to_find = k;
        }
      }

      if (this_index_to_find == -1) {
        return false;
      } else {
        this.mint_variant_mint_number_counting[this_index_of_variant][this_index_to_find] = this.mint_variant_mint_number_counting[this_index_of_variant][this_index_to_find] + 1;
        return true;
      }

    }

  };

  increase_variant_mint_count(this_index_of_variant: i32) : void {
    this.mint_counts_for_variants[this_index_of_variant] = this.mint_counts_for_variants[this_index_of_variant] + 1;
  };

  add_new_variant(incoming_variant_name: string, incoming_variant_max_nfts: u64, incoming_variant_mint_donation_cost: string, incoming_variant_mint_max_per_user: u64) : void {
    //Should set to 0 for incoming_variant_mint_max_per_user if wanting any amount! This is asserted on index.ts under nft_mint()
    this.mint_variants.push(incoming_variant_name);
    this.max_nfts_for_mint_variants.push(incoming_variant_max_nfts);
    this.mint_counts_for_variants.push(0);
    this.mint_for_variant_donation_cost.push(u128.from(incoming_variant_mint_donation_cost));
    this.mint_variant_whitelistings.push([]);
    this.mint_variant_mint_number_counting.push([]);
    this.mint_variant_mint_maximum_amount.push(incoming_variant_mint_max_per_user);
  };

  modify_variant_limit(this_index_of_variant: i32, incoming_variant_max: u64) : void {
    this.max_nfts_for_mint_variants[this_index_of_variant] = incoming_variant_max;
  };

  modify_variant_mint_price(this_index_of_variant: i32, incoming_mint_price: u128) : void {
    this.mint_for_variant_donation_cost[this_index_of_variant] = incoming_mint_price;
  };


  increase_system_moved_to_vault(incoming_moved: u128) : void {
    this.system_moved_to_vault = u128.add(this.system_moved_to_vault, incoming_moved);
  }

  increase_mint_count() : void {
    this.mint_count = this.mint_count + 1;
  }

  increase_system_earned(incoming_earned: u128) : void {
    this.system_earned = u128.add(this.system_earned, incoming_earned)
  }

  increase_market_volume(incoming_increase: u128) : void {
    this.market_volume = u128.add(this.market_volume, incoming_increase)
  }

  increase_artist_count() : void {
    this.artist_count += 1;
  }

  increase_creator_royalites_earned(incoming_increase: u128) : void {
    this.creators_royalties_earned = u128.add(this.creators_royalties_earned, incoming_increase)
  }

  increase_dao_royalties_earned(incoming_increase: u128) : void {
    this.dao_royalties_earned = u128.add(this.dao_royalties_earned, incoming_increase)
  }
}
