const CONTRACT = "dev-1644271142665-84091504961310"; //TESTNET: 'dev-1637596638965-95668057112174';
const NEAR_NETWORK_NAME = ".testnet";
const NETWORK_ID_LOCAL = "testnet";
const GAS_TO_ATTACH = 100000000000000;
let ART_STATE = "";
let NFT_TOKENS = "";

function q(input) { return document.querySelector(input); };

function ERROR_MESSAGE(error) {
  q("#error-notification").classList.remove("hide");
  q("#error-notification").classList.add("error-visible");
  q("#display-error-texts").innerHTML = "";
  q("#display-error-texts").innerHTML = '<h3>An error occured.</h3><h3 style="padding-top:15px;">Please refresh, then try logging out and in.</h3>';
  q("#display-error-texts").innerHTML += '<h4 style="padding-top:15px;font-style: italic;">' + error + '</h4>';
  q("#display-error-texts").innerHTML += '<h3 style="padding-top:15px;" class="red blinking">Click to refresh.</h3>'
  INTERNAL_GAME_ERROR = true;
}


const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org'
});

const { utils } = nearApi

const wallet = new nearApi.WalletConnection(near, 'simple-art');

const contract = new nearApi.Contract(wallet.account(), CONTRACT, {
  viewMethods: [
    'nft_tokens',
    'get_all_orders',
    'nft_supply_for_owner',
    'nft_tokens_for_owner',
    'nft_metadata',
    'nft_token',
    'get_simple_art_state',
    "nft_total_supply"
  ],
  changeMethods: [
    'update_nft_token',
    'nft_mint',
    'nft_transfer',
    'update_nft_for_sale',
    'initialize_simple_art'
  ]
});


const button = q('#sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  nft_tokens();
} else {
  button.classList.add("hide");
  q("#sign-out-button").classList.remove("hide");
  signedInProcess();
}

document.getElementById('sign-in-button').addEventListener('click', () => {
  if (wallet.isSignedIn()) {
    signedInProcess();
  } else {
    wallet.requestSignIn({
      contractId: CONTRACT,
      methodNames: [
        'nft_tokens',
        'get_simple_art_state',
        'get_all_orders',
        'nft_supply_for_owner',
        'nft_tokens_for_owner',
        'nft_metadata',
        'nft_token',
        'update_nft_token',
        'nft_mint',
        'nft_transfer',
        'update_nft_for_sale',
        'initialize_simple_art',
        "nft_total_supply"
      ]
    });
  }
});

document.getElementById('sign-out-button').addEventListener('click', () => {
  wallet.signOut()
});

function signedInProcess() {
  q("#title").innerHTML = '(logged in) <div class="account-id">' + wallet._authData.accountId+ '</div>';
  get_simple_art_state();
  nft_tokens();
};

function initialize_simple_art() {
  contract.initialize_simple_art({})
    .then(result => {
      console.log(result);
    });
};

function get_simple_art_state() {
  contract.get_simple_art_state({})
    .then(result => {
      console.log(result);
      ART_STATE = result[0];
      q("#art-state").innerHTML = "Mint count " + ART_STATE.mint_count; result[0].mint_count;
    });
}

function nft_tokens() {
  contract.nft_tokens({from_index: "0", limit: "100"})
    .then(result => {
      NFT_TOKENS = result;
      console.log(result);
      q("#nft-items").innerHTML = buildNftList();
    });
};

function nft_total_supply() {
  contract.nft_total_supply({ })
    .then(result => {
      console.log(result);
    });
};

function buildNftList() {
  let html_builder = "";
  for (var i = 0; i < NFT_TOKENS.length; i++) {
    html_builder += '<div class="nft-item">';
    html_builder += '<div>' + NFT_TOKENS[i].id + '</div>'
    html_builder += '<div>' + NFT_TOKENS[i].metadata.title + '</div>';
    html_builder += '<div>' + NFT_TOKENS[i].metadata.description + '</div>';
    html_builder += '<div>' + NFT_TOKENS[i].owner_id + '</div>';
    html_builder += '<div>' + NFT_TOKENS[i].metadata.issued_at + '</div>';
    html_builder += '</div>';
  }
  return html_builder;
}
function get_all_users() {
  contract.get_all_users({})
    .then(result => {
      console.log(result);
    });
};
function get_all_orders() {
  contract.get_all_orders({})
    .then(result => {
      console.log(result);
    });
};
function nft_supply_for_owner() {
  contract.nft_supply_for_owner({ account_id: wallet._authData.accountId})
    .then(result => {
      console.log(result);
    });
};
function nft_tokens_for_owner() {
  contract.nft_tokens_for_owner({ account_id: wallet._authData.accountId, from_index: "0", limit: "0" })
    .then(result => {
      console.log(result);
    });
};
function nft_metadata() {
  contract.nft_metadata({})
    .then(result => {
      console.log(result);
    });
};
function nft_token(incoming_token_id) {
  contract.nft_token({token_id: incoming_token_id})
    .then(result => {
      console.log(result);
    });
};
function update_nft_token(incoming_token_id, incoming_description) {
  contract.update_nft_token({ token_id: incoming_token_id, description: incoming_description})
    .then(result => {
      console.log(result);
    });
};

function generateMetadata(number) {
  return {
    title: "Simple Art # " + number, // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    description: "Test description 1", // free-form description
    media: "", // URL to associated media, preferably to decentralized, content-addressed storage
    media_hash: "", // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    copies: "1", // number of copies of this set of metadata in existence when token was minted.
    issued_at: Date.now().toString(), // When token was issued or minted, Unix epoch in milliseconds
    //expires_at: string, // When token expires, Unix epoch in milliseconds
   // starts_at: string, // When token starts being valid, Unix epoch in milliseconds
    //updated_at: string, // When token was last updated, Unix epoch in milliseconds
    //extra: string, // anything extra the NFT wants to store on-chain. Can be stringified JSON.
   // reference: string, // URL to an off-chain JSON file with more info.
    //reference_hash: string // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  }
};

function nft_mint(incoming_token_id, incoming_metadata) {
  contract.nft_mint({ token_id: incoming_token_id, metadata: incoming_metadata })
    .then(result => {
      console.log(result);
    });
};

function nft_transfer(incoming_receiver_id, incoming_token_id) {
  contract.nft_transfer({ receiver_id: incoming_receiver_id, token_id: incoming_token_id})
    .then(result => {
      console.log(result);
    });
};

function update_nft_for_sale(incoming_token_id, incoming_price_for_sale) {
  contract.update_nft_for_sale({ token_id: incoming_token_id, price_for_sale: incoming_price_for_sale })
    .then(result => {
      console.log(result);
    });
};