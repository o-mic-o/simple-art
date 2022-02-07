// implementation based on NEP-171
// https://nomicon.io/Standards/NonFungibleToken/Core.html

import { u128 } from "near-sdk-as";
import { ContractPromise } from 'near-sdk-as';

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

@nearBindgen
export class Order {
  token_id: string;
  metadata: TokenMetadata;
  sale_price_history: Array<u128>;
  sale_date_history: Array<u64>;
  owners_history: Array<string>;

  forSale: boolean;
  price_for_sale: u128;

  constructor(token_id: string, current_owner: string) {
    this.token_id = token_id
    this.forSale = false;
    this.owners_history = new Array<string>();
    this.sale_price_history = new Array<u128>();
    this.sale_date_history = new Array<u64>();
    this.owners_history.push(current_owner);
  }
  setItemForSale(price: u128): void {
    this.forSale = true;
    this.price_for_sale = price;
  }

  updateItemForSale(is_for_sale: boolean, price: u128): void {
    this.forSale = is_for_sale;
    this.price_for_sale = price;
  }

  setWasSoldHistory(price_sold_at: u128, sale_history_block_index: u64, new_owner: string): void {
    this.sale_price_history.push(price_sold_at);
    this.sale_date_history.push(sale_history_block_index);
    this.owners_history.push(new_owner);
    this.forSale = false;
  }
}

@nearBindgen
export class SimpleArtState {
  mint_count: u128;

  constructor() {
    this.mint_count = u128.from("0");
  }

  increase_mint_count() : void {
    this.mint_count = u128.add(this.mint_count, u128.from("1"));
  }
}
