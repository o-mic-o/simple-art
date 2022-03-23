const CONTRACT = "dev-1647801097836-32048626857376" //"dev-1647371181737-53538580851849"; //"dev-1645791875377-69405331263944"; //CURRENT TESTNET!: "dev-1644516843293-15124568036022";
const BACKEND_URL = "https://simple-art-club-backend-testnet.vercel.app/api";
const LOCAL_BACKEND = "backend";
const FRONT_OWNER = "mic.testnet";

const NEAR_NETWORK_NAME = ".testnet";
const NETWORK_ID_LOCAL = "testnet";
const GAS_TO_ATTACH = 100000000000000;
const NO_ITMES_IN_COLLECTION = "Looks like there are no NFTs in this collection yet!";
const GENERIC_LOADING_MESSAGE = "Loading...";
const MAX_HISTORY_SHOWING_LENGTH = 5;

let MAIN_DATA_ALREADY_LOADED = false;
let MAIN_DATA_IS_PROCESSING = false;
let IS_SORTED_MINTS_ALREADY = false;
let IS_SORTED_PRICE_DOWN = true;
let IS_SORTED_LIKES_DOWN = false;
let SET_MARKET_SORT_WATCHERS_ONCE = false;
let IS_HIDING_FOR_SALE = false;
let ART_STATE = "";
let NFT_TOKENS = [];
let MY_NFTS = [];
let ALL_ORDERS = [];
let IS_ERASOR_SELECTED = false;
let IS_PAINT_SELECTED = false;
let MY_CREATIONS_COUNT = 0;
let MY_LIKED_COUNT = 0;
let explore_hash_to_use = "/explore";
let THIS_OWNERS_SUPPLY = 0;
let THIS_OWNER_CREATION_SUPPLY = 0;
let CREATION_SUPPLY_SET_ONCE = true;
let DEFAULT_STARTING_COLLECTION = "all";
let TOTAL_NFT_SUPPLY = 0;

let VARIANT_MAPPING = {
  "all": {
    "name": "Simple Art",
    "hash": "/explore"
  },
  "simpleartclub.testnet": {
    "name": "Simple Art Club",
    "hash": "/explore-simple-art-club",
    "index": 0,
    "color": "#8C00FF",
    "mint_hash": "/mint"
  },
  "rare.sputnikv2.testnet": {
    "name": "Rare Art Club",
    "hash": "/explore-rare-dao",
    "index": 1,
    "pre_description": "Rare Art Club #",
    "color": "#60E665",
    "mint_hash": "/mint-rare-art-club"
  },
  "community.sputnikv2.testnet": {
    "name": "Community Art Club",
    "hash": "/explore-rare-community",
    "index": 2,
    "pre_description": "Community Art Club #",
    "color": "#3D02FF",
    "mint_hash": "/mint-community-art-club"
  },
  "chaintyping.testnet": {
    "name": "Chain Typing",
    "hash": "/explore-chain-typing",
    "index": 3,
    "pre_description": "Chain Typing #",
    "color": "#F3B358",
    "mint_hash": "/mint-chaintyping"
  },
  "jellycottage.testnet": {
    "name": "House of Peach",
    "hash": "/explore-house-of-peach",
    "index": 4,
    "pre_description": "House of Peach #",
    "color": "#B13352",
    "mint_hash": "/mint-house-of-peach"
  },
  "retro": {
    "name": "Retro Collection",
    "hash": "/explore-retro-collection",
    "index": 5,
    "pre_description": "Retro Collection #",
    "color": "#B13352"
  }
};



// Indexes for index to and from limits
let INDEX_INCREMENT = 100;

let END_INDEX_FOR_ORDERS = 100;
let END_INDEX_FOR_NFTS = 100;
let END_INDEX_FOR_OWNER = 100;

let START_INDEX_FOR_OWNER = 0;
let START_INDEX_FOR_ORDERS = 0;
let START_INDEX_FOR_NFTS = 0;
/////////////


let HASH_ID = "";
let CURRENT_NFT_IN_VIEW = "";

let is_on_first_page = true;
let is_loading_external_profile = false;
let is_loading_gallery = false;
let IS_PROCESSING_MINT = false;
let CURRENT_COUNTER = "";
let GENERATE_CANVAS_ONCE = true;

let ALT_HASHES_FOR_MINT_SELECT = ["", "stats", "about", "explore", "gallery", "explore-simple-art-club", "explore-rare-dao", "explore-rare-community", "explore-chain-typing", "explore-house-of-peach", "art"];



let MINT_COUNT_RESPONSE_MAPPING = {
  "-2": "&#x221E;",
  "-1": "Unavailable",
  "0": "0"
}

function q(input) { return document.querySelector(input); };

function updateCounter() {
  let to_submit_post = {
    "update": "update"
  };
  fetch(LOCAL_BACKEND + "/counter_writer.php", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(to_submit_post)
  }).then((res) => {
    //console.log(res);
  }).catch(error => {
    console.log(error);
  });
}

function fetchCounter(callback) {
  var requestOptions = {
    method: 'GET',
  };

  fetch(LOCAL_BACKEND+"/counter_collector.php", requestOptions)
    .then(response => response.text())
    .then(result => {
      CURRENT_COUNTER = JSON.parse(result).counter;
      callback();
    }).catch(error => {
      console.log('error', error)
      callback();
    });
};



function showLoadingScreen(loading_message){
  q("#loading-message").innerHTML = loading_message;
  q("#loading-screen").classList.remove("hide");
};
function turn_off_loading_screen() {
  q("#loading-screen").classList.add("hide");
};

function hideAllAndShow(incoming_to_show) {
  let these_items = [
    "explore-nfts",
    "intro-container",
    "explore-my-nfts",
    "mint-nft",
    "explore-this-nft",
    "about-simple-art-club",
    "simple-art-club-stats",
    "community-info-box"
  ];

  for (var i=0; i < these_items.length; i++) {
    if (these_items[i] == incoming_to_show) {
      q("#"+these_items[i]).classList.remove("hide");
    } else {
      q("#"+these_items[i]).classList.add("hide");
    }
  }
};

function buttonWatchers() {
  q("#explore").addEventListener("click", function(){
    if (is_on_first_page) {
      window.location.hash = explore_hash_to_use;
      q("#explore").innerHTML = "Back to Menu";
      hideAllAndShow("explore-nfts");
      is_on_first_page = false;
    } else {
      q("#explore").innerHTML = "Explore";
      function isPushStateDefined() { return (window.history && history.pushState && history.state !== undefined) ? true : false; }
      function removeHash() { history.pushState("", document.title, window.location.pathname + window.location.search); }
      if (isPushStateDefined()) { removeHash(); }
      else {
        window.location.hash = "";
        HASH_ID = "";
      }
      hideAllAndShow("intro-container");
      is_on_first_page = true;
    }
  });
  q("#about").addEventListener("click", function(){
    window.location.hash = "/about";
    hideAllAndShow("about-simple-art-club");
  });

  q("#my-gallery-view").addEventListener("click", function(){
    console.log("Loading gallery");
    window.location.hash = "/gallery/" + wallet._authData.accountId;
    HASH_ID = window.location.hash;
    load_gallery();
  });

  q("#my-art").addEventListener("click", function(){
    if (is_loading_external_profile) {
      if (is_loading_gallery) {
        q("#my-title").innerHTML = HASH_ID.split("gallery/")[1].split(NEAR_NETWORK_NAME)[0];
      } else {
        q("#my-title").innerHTML = HASH_ID.split("profile/")[1].split(NEAR_NETWORK_NAME)[0];
      }
      is_loading_external_profile = false;
    } else if (wallet.isSignedIn()) {
      window.location.hash = "/profile/" + wallet._authData.accountId;
      q("#my-title").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
      if (MAIN_DATA_ALREADY_LOADED) {
        nft_tokens_for_owner(wallet._authData.accountId, false, function(){});
        is_loading_external_profile = false;
      } else {
        nft_tokens_for_owner(wallet._authData.accountId, false, function(){});
        MAIN_DATA_ALREADY_LOADED = true;
      }
    }

    hideAllAndShow("explore-my-nfts");
  });

  q("#simple-stats").addEventListener("click", function(){
    window.location.hash = "/stats";
    hideAllAndShow("simple-art-club-stats");
    q("#current-stats").innerHTML = generateStats();
  });

  q("#community-info").addEventListener("click", function () {
    window.location.hash = "/info";
    hideAllAndShow("community-info-box");
  });

  q("#create-art").addEventListener("click", function () {
    console.log("Create art clicked, hash is: " + HASH_ID);

    if (ALT_HASHES_FOR_MINT_SELECT.indexOf(HASH_ID) != -1 || HASH_ID.split("profile/").length > 1 || HASH_ID.split("gallery/").length > 1 || HASH_ID.split("art/").length > 1) {
      window.location.hash = "/mint";
      generic_is_selected_on_mint("simpleartclub.testnet");
    }

    hideAllAndShow("mint-nft");
  });

};

buttonWatchers();

function ERROR_MESSAGE(error) {
  q("#error-notification").classList.remove("hide");
  q("#error-notification").classList.add("error-visible");
  q("#display-error-texts").innerHTML = "";
  q("#display-error-texts").innerHTML = '<h3>An error occured.</h3>';
  q("#display-error-texts").innerHTML += '<h4 class="yellow-highlight" style="padding-top:15px;font-style: italic;">' + error + '</h4>';
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
    "nft_total_supply",
    "get_this_variant_amount",
    "get_whitelisting_for_this_nft_variant",
    "is_on_this_variant_whitelist",
    "this_whitelisted_users_current_minting_number_for_variant"
  ],
  changeMethods: [
    'update_nft_token',
    'nft_mint',
    'nft_transfer',
    'update_nft_for_sale',
    'initialize_simple_art',
    'cancel_nft_for_sale',
    'buy_this_nft_from_owner',
    "favourite_this_nft",
    "cancel_favourite",
    "send_donations_to_vault",
    "modify_variant_mint_price",
    "set_nft_is_blocked",
    "unblock_this_nft",
    "add_new_variant",
    "initiate_or_append_this_variant_whitelisting",
    "modify_variant_limit",
    "add_system_owner"
  ]
});


const button = q('#sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  q("#about").classList.remove("hide");
  q("#simple-stats").classList.remove("hide");
  q("#community-info").classList.remove("hide");

  main_data_gathering(function(){
    show_only_variant(DEFAULT_STARTING_COLLECTION);
  });
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
        "nft_total_supply",
        'cancel_nft_for_sale',
        'buy_this_nft_from_owner',
        "favourite_this_nft",
        "cancel_favourite",
        "send_donations_to_vault",
        "modify_variant_mint_price",
        "set_nft_is_blocked",
        "unblock_this_nft",
        "get_this_variant_amount",
        "get_whitelisting_for_this_nft_variant",
        "add_new_variant",
        "initiate_or_append_this_variant_whitelisting",
        "is_on_this_variant_whitelist",
        "this_whitelisted_users_current_minting_number_for_variant",
        "modify_variant_limit",
        "add_system_owner"
      ]
    });
  }
});


function hashMapper() {
  if (HASH_ID == "stats") {
    get_simple_art_state(function(){
      setTimeout(function () { q("#simple-stats").click(); }, 1);
    });
  } else if (HASH_ID == "about") {
    setTimeout(function () { q("#about").click(); }, 1);
  } else if (HASH_ID == "explore") {
    explore_hash_to_use = "/explore";
    setTimeout(function () { q("#explore").click(); }, 1);
  } else if (HASH_ID == "explore-simple-art-club") {
      q("#mint-explore-watcher").options.namedItem("simpleartclub.testnet").selected = true;
      explore_hash_to_use = "/explore-simple-art-club";
      parse_for_variant("simpleartclub.testnet");
      setTimeout(function () { q("#explore").click(); }, 1);
  } else if (HASH_ID == "explore-rare-dao") {
      q("#mint-explore-watcher").options.namedItem("rare.sputnikv2.testnet").selected = true;
      explore_hash_to_use = "/explore-rare-dao";
      parse_for_variant("rare.sputnikv2.testnet");
      setTimeout(function () {  q("#explore").click(); }, 1);
  } else if (HASH_ID == "explore-rare-community") {
      q("#mint-explore-watcher").options.namedItem("community.sputnikv2.testnet").selected = true;
      explore_hash_to_use = "/explore-rare-community";
      parse_for_variant("community.sputnikv2.testnet");
      setTimeout(function () { q("#explore").click(); }, 1);
  } else if (HASH_ID == "explore-chain-typing") {
      q("#mint-explore-watcher").options.namedItem("chaintyping.testnet").selected = true;
      explore_hash_to_use = "/explore-chain-typing";
      parse_for_variant("chaintyping.testnet");
      setTimeout(function () { q("#explore").click(); }, 1);
  } else if (HASH_ID == "explore-house-of-peach") {
      q("#mint-explore-watcher").options.namedItem("jellycottage.testnet").selected = true;
      explore_hash_to_use = "/explore-house-of-peach";
      parse_for_variant("jellycottage.testnet");
      setTimeout(function () { q("#explore").click(); }, 1);
  } else if (HASH_ID.split("profile/").length > 1) {
      is_loading_external_profile = true;
      nft_tokens_for_owner(HASH_ID.split("profile/")[1], false, function () { });
      is_loading_external_profile = false;
      MAIN_DATA_ALREADY_LOADED = true;
      setTimeout(function () { q("#my-art").click(); }, 1);
  } else if (HASH_ID.split("art/").length > 1) {

    launchSpecificNftView(HASH_ID.split("art/")[1]);

  } else if (HASH_ID.split("gallery/").length > 1) {

    load_gallery();

  } if (HASH_ID == "mint") {
    if (wallet.isSignedIn()) {
      setTimeout(function () {
        q("#create-art").click();
        q("#mint-variant-watcher").options.namedItem("simpleartclub.testnet").selected = true;
        generic_is_selected_on_mint("simpleartclub.testnet");
      }, 1);
    }
  } if (HASH_ID == "mint-rare-art-club") {
    if (wallet.isSignedIn()) {
      setTimeout(function () {
        q("#create-art").click();
        q("#mint-variant-watcher").options.namedItem("rare.sputnikv2.testnet").selected = true;
        generic_is_selected_on_mint("rare.sputnikv2.testnet");
      }, 1);
    }
  } if (HASH_ID == "mint-community-art-club") {
    if (wallet.isSignedIn()) {
      setTimeout(function () {
        q("#create-art").click();
        q("#mint-variant-watcher").options.namedItem("community.sputnikv2.testnet").selected = true;
        generic_is_selected_on_mint("community.sputnikv2.testnet");
      }, 1);
    }
  } if (HASH_ID == "mint-chaintyping") {
    if (wallet.isSignedIn()) {
      setTimeout(function () {
        q("#create-art").click();
        q("#mint-variant-watcher").options.namedItem("chaintyping.testnet").selected = true;
        generic_is_selected_on_mint("chaintyping.testnet");
      }, 1);
    }
  } if (HASH_ID == "mint-house-of-peach") {
    if (wallet.isSignedIn()) {
      setTimeout(function () {
        q("#create-art").click();
        q("#mint-variant-watcher").options.namedItem("jellycottage.testnet").selected = true;
        generic_is_selected_on_mint("jellycottage.testnet");
      }, 1);
    }
  } if (HASH_ID == "mint-for-retro-collection") {
    if (wallet.isSignedIn()) {
      setTimeout(function () {
        q("#create-art").click();
        q("#mint-variant-watcher").options.namedItem("retro").selected = true;
        is_retro_selected_on_mint();
      }, 1);
    }
  }  else {
    //console.log("Default login");
  }
};




function load_gallery() {

  is_loading_external_profile = true;
  is_loading_gallery = true;
  nft_tokens_for_owner(HASH_ID.split("gallery/")[1], true, function(){
    is_loading_external_profile = false;
    is_loading_gallery = false;
  });

  setTimeout(function () { q("#my-art").click(); }, 1);

};

function sellSpecificItem(incoming_token_id) {
  let this_nft = get_this_nft_from_id(incoming_token_id);
  //console.log(this_nft);
  let this_price_select = sanitize(q("#set-price").value.toString());
  let this_price = utils.format.parseNearAmount(this_price_select);
  //console.log(this_price);
  submitDiscordUpdate("list", incoming_token_id, this_price_select, this_nft.metadata.media, function(){
    showLoadingScreen(GENERIC_LOADING_MESSAGE);
    update_nft_for_sale(this_nft.id, this_price, function () {
      window.location.reload();
    })
  });

};

function submitDiscordUpdate(incoming_type, incoming_artId, incoming_price, incoming_image_url, callback) {
  if (wallet.isSignedIn()) {
    let to_submit_post = {
      "accountId": wallet._authData.accountId,
      "type": incoming_type,
      "artId": incoming_artId,
      "price": incoming_price,
      "imageUrl": incoming_image_url
    };

    fetch(LOCAL_BACKEND + "/discord_updater.php", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(to_submit_post)
    }).then((res_poster) => {
      console.log(res_poster);
      callback();
    }).catch(error => {
      ERROR_MESSAGE(error);
      callback();
    });;
  }
};

function requestDiscordRank() {
  if (wallet.isSignedIn()) {
    let set_discord_owner_link = sanitize(q("#set-discord-owner-link").value);
    if (confirm('You are requesting discord ranking with the discord handle of:\n\n' + set_discord_owner_link + "\n\n" + toUnicodeVariant("Are you sure you want to proceed?", 'bold sans', ''))) {
      showLoadingScreen(GENERIC_LOADING_MESSAGE);
      nft_supply_for_owner(function(){
        nft_tokens_for_owner(wallet._authData.accountId, false, function(){

          let to_submit_post = {
            "accountId": wallet._authData.accountId,
            "owned_count": THIS_OWNERS_SUPPLY,
            "creations_count": THIS_OWNER_CREATION_SUPPLY,
            "discordId": set_discord_owner_link
          };

          fetch(LOCAL_BACKEND+"/discord_link_requester.php", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(to_submit_post)
          }).then((res_poster) => {
            alert("Discord request for ranking completed!")
            window.location.reload();
          }).catch(error => {
            ERROR_MESSAGE(error);
          });;
        });
      })
    }
  }
};

function transfer_to_new_owner(token_id_incoming) {
  let this_new_owner_for_transfer = sanitize(q("#set-new-owner").value);
  if (this_new_owner_for_transfer == "" || this_new_owner_for_transfer.split(NEAR_NETWORK_NAME).length == 1) {
    alert("This is not a valid address!");
  } else {
    if (confirm('This will permanently transfer this nft to the following address!\n\n' + this_new_owner_for_transfer + "\n\n" + toUnicodeVariant("Are you sure you want to proceed?", 'bold sans', ''))) {
      showLoadingScreen(GENERIC_LOADING_MESSAGE);
      nft_transfer(this_new_owner_for_transfer, token_id_incoming, function () {
        alert("This nft has been transfered to a new owner.");
        window.location.reload();
      });
    }
  }
};

function transfer_to_self_wallet_sync(token_id_incoming) {
  if (confirm('This is an advanced function and should only be used one time only by a new user when first purchasing an item!\n\nThis will re-transfer your nft back to yourself.\n\n' + toUnicodeVariant("Are you sure you want to proceed?", 'bold sans', ''))) {

    showLoadingScreen(GENERIC_LOADING_MESSAGE);
    nft_transfer(wallet._authData.accountId, token_id_incoming, function () {
      alert("Wallet should now be in-sync.");
      window.location.reload();
    });
  }

};

function cancelSellSpecificItem(incoming_token_id) {
  //console.log(incoming_token_id);
  let this_nft = get_this_nft_from_id(incoming_token_id);
  //console.log(this_nft);
  showLoadingScreen(GENERIC_LOADING_MESSAGE);
  cancel_nft_for_sale(this_nft.id, function(){
    window.location.reload();
  })
};

function launchSpecificCancelFavourite(token_id) {
  showLoadingScreen(GENERIC_LOADING_MESSAGE);
  cancel_favourite(token_id, function () {
    window.location.reload();
  });
};

function launchSpecificFavourite(token_id) {
  let get_this_nft = get_this_nft_from_id(token_id);

  showLoadingScreen(GENERIC_LOADING_MESSAGE);
  submitDiscordUpdate("like", token_id, "", get_this_nft.metadata.media, function(){
    favourite_this_nft(token_id, function () {
      window.location.reload();
    });
  });
};

function launchSpecificUserView(user) {
  is_loading_external_profile = true;
  //console.log(user);
  window.location.hash = "/profile/" + user;
  HASH_ID = window.location.hash;
  if (MAIN_DATA_ALREADY_LOADED) {
    nft_tokens_for_owner(user, false, function(){
    });
    setTimeout(function () {
      q("#my-art").click();
    }, 1);
  } else {
    get_all_orders(function () {
      nft_tokens(function () {
        nft_tokens_for_owner(user, false, function(){

          is_loading_external_profile = false;
          MAIN_DATA_ALREADY_LOADED = true;
          setTimeout(function () {
            q("#my-art").click();
          }, 1);
        });


      });
    });

  }
};

function launchSpecificBuy(item_id) {
  let get_this_nft = get_this_nft_from_id(item_id);
  let get_this_nft_order = get_this_nft_order_from_id(item_id);

   if (!wallet.isSignedIn()) {
    alert("Need to login first.");
  } else if (get_this_nft.owner_id == wallet._authData.accountId) {
    alert("This is your own NFT.");
  }else {
    submitDiscordUpdate("buy", item_id, utils.format.formatNearAmount(get_this_nft_order.price_for_sale), get_this_nft.metadata.media, function(){
      showLoadingScreen(GENERIC_LOADING_MESSAGE);
      buy_this_nft_from_owner(item_id, get_this_nft_order.price_for_sale, function(){
        console.log("Bought this nft.");
      });
    });

  }
};

function send_donations_to_vault(amount_in_near_to_format) {
  contract.send_donations_to_vault({ amount_in_near: utils.format.parseNearAmount(amount_in_near_to_format)})
    .then(result => {
      console.log(result);
      alert("Donations sent to vault!");
    });
};

function buy_this_nft_from_owner(incoming_token_id, incoming_price, callback) {
  contract.buy_this_nft_from_owner({ receiver_id: wallet._authData.accountId, token_id: incoming_token_id }, GAS_TO_ATTACH, incoming_price)
    .then(result => {
      console.log(result);
      callback();
    });

};

function launchSpecificNftView(item_id) {
  is_loading_external_profile = true;
  //console.log(item_id);
  window.location.hash = "/art/" + item_id;
  HASH_ID = window.location.hash;
  if (MAIN_DATA_ALREADY_LOADED) {
    nft_token(item_id.toString());
  } else {
    get_all_orders(function () {
      nft_tokens(function () {
        nft_token(item_id.toString());
        is_loading_external_profile = false;
        MAIN_DATA_ALREADY_LOADED = true;
      });
    });
  }
  q("#explore-nfts").classList.add("hide");
  q("#intro-container").classList.add("hide");
  q("#explore-my-nfts").classList.add("hide");
  q("#mint-nft").classList.add("hide");
  q("#explore-this-nft").classList.remove("hide");
}

document.getElementById('sign-out-button').addEventListener('click', () => {
  wallet.signOut();
  window.location.reload();
});

function loadScroller() {
  let this_body = document.getElementsByTagName('body')[0];

  this_body.onscroll = function () {
    console.log("...");
    if (window.scrollY >= this_body.scrollHeight - this_body.offsetHeight) {
      console.log('scrolled to bottom');
      let these_nft_items = q("#nft-items").children;
      let load_increment_more = 0;
      for (var i = 0; i < these_nft_items.length; i++) {
        if (these_nft_items[i].classList.contains("loading-hide")) {
          if (load_increment_more >= MAX_NFT_DISPLAY_ITEMS_AMOUNT) {
            console.log("Hit max amount");
          } else {
            these_nft_items[i].classList.remove("loading-hide");
          }
          load_increment_more++;
        }
      }
    }
  };
};

function main_data_gathering(callback) {
  showLoadingScreen(GENERIC_LOADING_MESSAGE);

  if (window.location.hash != "") {
    HASH_ID = window.location.hash.split("#/")[1];
  }

  if (MAIN_DATA_ALREADY_LOADED != true && MAIN_DATA_IS_PROCESSING) {
    turn_off_loading_screen();
    callback();

  } else if (MAIN_DATA_ALREADY_LOADED != true) {
    MAIN_DATA_IS_PROCESSING = true;

    fetchCounter(function () {
      updateCounter();
      watch_market_sorting();

      nft_total_supply(function () {
        get_all_orders(function () {
          get_simple_art_state(function () {
            build_nft_selects_for_variants();
            nft_tokens(function () {
              MAIN_DATA_ALREADY_LOADED = true;
              callback();
              MAIN_DATA_IS_PROCESSING = false;
              hashMapper();
              turn_off_loading_screen();
            });
          });
        });
      });
    });
  } else {
    console.log("Data already loaded");
  }
};

function signedInProcess() {
  q("#title").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
  q("#intro-container").classList.add("not-max");
  //q("#explore").classList.add("hide");
  q("#my-art").classList.remove("hide");
  q("#my-gallery-view").classList.remove("hide");
  q("#create-art").classList.remove("hide");
  q("#about").classList.add("hide");
  q("#simple-stats").classList.remove("hide");
  q("#community-info").classList.remove("hide");

  //q("#create-art-for-dao").classList.remove("hide");

  main_data_gathering(function(){
    show_only_variant(DEFAULT_STARTING_COLLECTION);
    if (GENERATE_CANVAS_ONCE) {
      GENERATE_CANVAS_ONCE = false;

      for (var k = 0; k < 900; k++) {
        q("#nft-canvas").innerHTML += '<div class="pixel" data-id="' + k + '"></div>';
        q("#nft-renderer").innerHTML += '<div class="sm-pixel" data-id="' + k + '"></div>';
      }
      watch_nft_canvas();
    }
  });
};
function get_nft_variant_name_from_mapping(incoming_name) {
  return VARIANT_MAPPING[incoming_name].name;
};

function build_nft_selects_for_variants() {
  let html_builder = '<option value="all" name="all">All</option>';
  let html_builder_mint = "";

  for (var i = 0; i < ART_STATE.mint_variants.length; i++) {
    html_builder += '<option value="' + ART_STATE.mint_variants[i] + '" name="' + ART_STATE.mint_variants[i] + '">' +get_nft_variant_name_from_mapping(ART_STATE.mint_variants[i])+'</option>';
    html_builder_mint += '<option value="' + ART_STATE.mint_variants[i] + '" name="' + ART_STATE.mint_variants[i] + '">' + get_nft_variant_name_from_mapping(ART_STATE.mint_variants[i]) + '</option>';
  }

  q("#mint-variant-watcher").innerHTML = html_builder_mint;
  q("#mint-explore-watcher").innerHTML = html_builder;
};

function show_only_variant(incoming_variant_type) {
  let these_items = document.querySelectorAll("#nft-items .variant-types");
  for (var i = 0; i < these_items.length; i++) {
    if ((these_items[i].innerHTML == incoming_variant_type) || incoming_variant_type == "all") {
      these_items[i].parentElement.classList.remove("hide");
    } else {
      these_items[i].parentElement.classList.add("hide");
    }
  }
};

function count_maximum_total_number_of_nfts() {
  let counting_max = 0;
  for (var k = 0; k < ART_STATE.max_nfts_for_mint_variants.length; k++) {
    counting_max += parseInt(ART_STATE.max_nfts_for_mint_variants[k]);
  }
  return counting_max;
};



function parse_for_variant(incoming_variant) {
  window.location.hash = VARIANT_MAPPING[incoming_variant].hash;
  explore_hash_to_use = VARIANT_MAPPING[incoming_variant].hash;
  q("#explore-title").innerHTML = VARIANT_MAPPING[incoming_variant].name;
  if (incoming_variant == "all") {
    q("#art-state").innerHTML = ART_STATE.mint_count + "/" + count_maximum_total_number_of_nfts();
  } else {
    q("#art-state").innerHTML = ART_STATE.mint_counts_for_variants[VARIANT_MAPPING[incoming_variant].index] + "/" + ART_STATE.max_nfts_for_mint_variants[VARIANT_MAPPING[incoming_variant].index];
  }
  show_only_variant(incoming_variant);
};

function watch_market_sorting() {
  if (!SET_MARKET_SORT_WATCHERS_ONCE) {

    SET_MARKET_SORT_WATCHERS_ONCE = true;

    q("#mint-explore-watcher").addEventListener("change", function () {
      let this_variant_watcher = q("#mint-explore-watcher");
      parse_for_variant(this_variant_watcher.value);
    });


    q("#mint-ids-sort-market").addEventListener("click", function () {
      rankSorting(".mint-ids", "nft-items");
      if (IS_SORTED_MINTS_ALREADY) {
        q("#mint-ids-sort-market").innerHTML = "Mint &#x2191;";
        IS_SORTED_MINTS_ALREADY = false;
      } else {
        q("#mint-ids-sort-market").innerHTML = "Mint &#x2193;";
        IS_SORTED_MINTS_ALREADY = true;
      }
    });
    q("#price-sort-market").addEventListener("click", function () {
      rankSorting(".market-price", "nft-items");
      if (IS_SORTED_PRICE_DOWN) {
        q("#price-sort-market").innerHTML = "Price &#x2191;";
        IS_SORTED_PRICE_DOWN = false;
      } else {
        q("#price-sort-market").innerHTML = "Price &#x2193;";
        IS_SORTED_PRICE_DOWN = true;
      }
    });
    q("#show-hide-not-for-sale").addEventListener("click", function () {
        let these_items = document.querySelectorAll("[data-for-sale='" + false + "']");
        for (let i = 0; i < these_items.length; i++) {
          if (!IS_HIDING_FOR_SALE) {
            these_items[i].classList.add("hide");
          } else {
            these_items[i].classList.remove("hide");
          }
      }
      IS_HIDING_FOR_SALE = !IS_HIDING_FOR_SALE;
      q("#show-hide-not-for-sale").innerHTML = IS_HIDING_FOR_SALE ? "Show not for sale" : "Hide not for sale";
    });

    q("#favourites-sort").addEventListener("click", function(){
      rankSorting(".likes-count-for-sort", "nft-items");
      if (IS_SORTED_LIKES_DOWN) {
        q("#favourites-sort").innerHTML = "Likes &#x2191;";
        IS_SORTED_LIKES_DOWN = false;
      } else {
        q("#favourites-sort").innerHTML = "Likes &#x2193;";
        IS_SORTED_LIKES_DOWN = true;
      }
    });



  }
};
function rankSorting(sort_by, item) {


  var toSort = q("#" + item).children;
  toSort = Array.prototype.slice.call(toSort, 0);

  toSort.sort(function (a, b) {
    var a_current_percents = a.querySelector(sort_by);
    var b_current_percents = b.querySelector(sort_by);
    var aord = a_current_percents.innerHTML;
    var bord = b_current_percents.innerHTML;

    if (sort_by == ".market-price") {
      if (IS_SORTED_PRICE_DOWN) {
        return aord - bord;
      } else {
        return bord - aord;
      }
    } else if (sort_by ==".likes-count-for-sort") {
      if (IS_SORTED_LIKES_DOWN) {
        return aord - bord;
      } else {
        return bord - aord;
      }
    } else if (IS_SORTED_MINTS_ALREADY) {
      return bord - aord;
    } else {
      return aord - bord;
    }
  });

  var parent = q("#" + item);
  parent.innerHTML = "";
  for (var i = 0, l = toSort.length; i < l; i++) {
    parent.appendChild(toSort[i]);
  }
};

function sanitize(string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match) => (map[match]));
}


function save_to_local_storage(obj) {
  localStorage.setItem('simple_art_club_saved_drawing', JSON.stringify(obj));
}

function load_from_local_storage() {
  var retreived = JSON.parse(localStorage.getItem('simple_art_club_saved_drawing'));
  return retreived;
}


function watch_nft_canvas() {

  q("#eraser-selector").addEventListener("click", function(){
    if (IS_ERASOR_SELECTED) {
      q("#eraser-selector").classList.remove("selected");
      IS_ERASOR_SELECTED = false;
    } else {
      q("#eraser-selector").classList.add("selected");
      IS_ERASOR_SELECTED = true;
    }
  });
  q("#paint-selector").addEventListener("click", function () {
    if (IS_PAINT_SELECTED) {
      q("#paint-selector").classList.remove("selected");
      IS_PAINT_SELECTED = false;
    } else {
      q("#paint-selector").classList.add("selected");
      IS_PAINT_SELECTED = true;
    }
  });

  let avatar_canvas = q("#nft-canvas");
  let nft_renderer = q("#nft-renderer");

  q("#save-selector").addEventListener("click", function () {
   if (confirm("Are you sure you want to save this current art to local storage?")) {
    let get_saving_colours = [];
      for (var get_index = 0; get_index < avatar_canvas.children.length; get_index++) {
        get_saving_colours.push(avatar_canvas.children[get_index].style.backgroundColor);
      }
     save_to_local_storage({ "data": get_saving_colours });
     alert("Saved this artwork for later!");
   }
  });

  q("#restore-selector").addEventListener("click", function () {
    if (confirm("Are you sure you want to overwrite this drawing with the one in local storage?")) {
      let this_loaed = load_from_local_storage();
      if (this_loaed == null) {
        alert("No artwork was found! ")
      } else {
        let this_colour_array = this_loaed.data;
        for (var loading_index = 0; loading_index < avatar_canvas.children.length; loading_index++) {
          avatar_canvas.children[loading_index].style.backgroundColor = this_colour_array[loading_index];
        }
        for (var loading_index_renderer = 0; loading_index_renderer < nft_renderer.children.length; loading_index_renderer++) {
          nft_renderer.children[loading_index_renderer].style.backgroundColor = this_colour_array[loading_index_renderer];
        }

        alert("Restored art!");
      }
    }
  });


  for (var i = 0; i < avatar_canvas.children.length; i++) {
    avatar_canvas.children[i].addEventListener('click', function (event) {
      let this_id_value = event.target.dataset.id;
      let this_colour = q("#colour-selector").value;
      let these_items = document.querySelectorAll("[data-id='"+this_id_value+"']");
      for (var i = 0; i < these_items.length; i++){
        if (IS_ERASOR_SELECTED) {
          these_items[i].style.backgroundColor = "";
        } else {
          these_items[i].style.backgroundColor = this_colour;
        }
      }
    });


    avatar_canvas.children[i].addEventListener('mouseover', function (event) {
      //event.target.style.backgroundColor = q("#colour-selector").value;
      if (IS_PAINT_SELECTED){
        let this_id_value = event.target.dataset.id;
        let this_colour = q("#colour-selector").value;
        let these_items = document.querySelectorAll("[data-id='" + this_id_value + "']");
        for (var i = 0; i < these_items.length; i++) {
          if (IS_ERASOR_SELECTED) {
            these_items[i].style.backgroundColor = "";
          } else {
            these_items[i].style.backgroundColor = this_colour;
          }
        }
      }
    });

  }

  q("#mint-character-button").addEventListener("click", function(){
    let this_variant_watcher_value = q("#mint-variant-watcher").value;

    if (this_variant_watcher_value == "simpleartclub.testnet" && q("#new-nft-description").value.length == 0) {
      alert("Please input a title!");
    } else {


      if (this_variant_watcher_value == "simpleartclub.testnet") {
        if (confirm("Are you sure you want to mint with the title of: \n\n" + sanitize(toUnicodeVariant(q("#new-nft-description").value, 'bold sans', '')))) {
          if (IS_PROCESSING_MINT) {}
          else {
            IS_PROCESSING_MINT = true;
            showLoadingScreen("Generating new NFT... please wait, and don't resize the screen!");
            get_nft_data_blob(function(data_blob_url){
              nft_to_storage_pre_minter(data_blob_url, function (res) {
                console.log("completed minter sequence");
                console.log(res);
                IS_PROCESSING_MINT = false;
              });
            });
          }
        }
      } else {
        if (confirm("Are you sure you want to mint for " + get_nft_variant_name_from_mapping(this_variant_watcher_value) + " ?", 'bold sans', '')) {
          if (IS_PROCESSING_MINT) { }
          else {
            IS_PROCESSING_MINT = true;
            showLoadingScreen("Generating new NFT... please wait, and don't resize the screen!");
            get_nft_data_blob(function (data_blob_url) {
              nft_to_storage_pre_minter(data_blob_url, function (res) {
                console.log("completed minter sequence");
                console.log(res);
                IS_PROCESSING_MINT = false;
              });
            });
          }
        }
      }

    }
  });

  q("#mint-variant-watcher").addEventListener("change", function () {
    let this_variant_watcher = q("#mint-variant-watcher");
    window.location.hash = VARIANT_MAPPING[this_variant_watcher.value].mint_hash;
    generic_is_selected_on_mint(this_variant_watcher.value);
    /*
    if (this_variant_watcher.value == "simpleartclub.testnet") {
    //  window.location.hash = "/mint";
      generic_is_selected_on_mint("simpleartclub.testnet");
    } else if (this_variant_watcher.value == "rare.sputnikv2.testnet") {
      //window.location.hash = "/mint-for-rare-dao";
      generic_is_selected_on_mint("rare.sputnikv2.testnet");
    } else if (this_variant_watcher.value == "chaintyping.testnet") {
      //window.location.hash = "/mint-for-chain-typing";
      is_chaintyping_selected_on_mint();
    } else if (this_variant_watcher.value == "jellycottage.testnet") {
      window.location.hash = "/mint-for-house-of-peach";
      is_peach_selected_on_mint();
    } else if (this_variant_watcher.value == "retro") {
      window.location.hash = "/mint-for-retro-collection";
      is_retro_selected_on_mint();
    } else if (this_variant_watcher.value == "community.sputnikv2.testnet") {
      window.location.hash = "/mint-for-rare-community";
      is_rare_community_selected_on_mint();
    }*/

  });
};


function get_this_whitelist_count_mapping_response(incoming_variant_name, incoming_response) {
  let this_response = MINT_COUNT_RESPONSE_MAPPING[incoming_response];
  let this_variant_index = get_this_variant_index_from_name(incoming_variant_name);
  let this_response_max_value = ART_STATE.mint_variant_mint_maximum_amount[this_variant_index];

  if (typeof this_response == 'undefined') {

    if (this_response_max_value == incoming_response) {
      return '<span class="bold green">' + incoming_response + "/" + this_response_max_value + '</span>';
    } else {
      if (this_response_max_value == "0") {
        return incoming_response + "/" + ART_STATE.max_nfts_for_mint_variants[this_variant_index];
      } else {
        return incoming_response + "/" + this_response_max_value;
      }
    }
  } else if (this_response == "0"){
    if (this_response == "0" && this_response_max_value == "0") {
      return '<span class="bold green">' + this_response + "/" + ART_STATE.max_nfts_for_mint_variants[this_variant_index] + '</span>';
    } else {
      return '<span class="bold green">' + this_response + "/" + ART_STATE.mint_variant_mint_maximum_amount[get_this_variant_index_from_name(incoming_variant_name)] + '</span>';
    }
  } else {
    if (incoming_response == -2) {
      return '<span class="bold green">' + ART_STATE.mint_counts_for_variants[this_variant_index] + "/" + ART_STATE.max_nfts_for_mint_variants[this_variant_index] + "</span>";
    } else {
      return '<span class="bold ' + ((this_response == "Unavailable") ? "red" : "green") + '">' + ((this_response == "Unavailable") ? "" : "Created " + this_response + "/" + ART_STATE.max_nfts_for_mint_variants[this_variant_index]) + "</span>";
    }
  }
};

function generate_whitelist_response(incoming_type) {
  let this_maximum_amount = ART_STATE.mint_variant_mint_maximum_amount[get_this_variant_index_from_name(incoming_type)];
  let this_whitelist_count_response = local_get_count_for_whitelisted_user(incoming_type, wallet._authData.accountId);

  q("#mint-whitelist-count-response").innerHTML = get_this_whitelist_count_mapping_response(incoming_type, this_whitelist_count_response);

  let this_whitelisted_response = local_is_on_this_variant_whitelist(incoming_type, wallet._authData.accountId);

  function hide_these_items() {

    q("#nft-creator-display-box").classList.add("hide");
    q("#nft-canvas-display-box").classList.add("hide");
    q("#nft-button-display-box").classList.add("hide");
    q("#nft-note-display-box").classList.add("hide");
    q("#nft-mint-is").classList.add("hide");
    q("#nft-public-title-is").classList.add("hide");
  };

  function show_these_items() {

    q("#nft-creator-display-box").classList.remove("hide");
    q("#nft-canvas-display-box").classList.remove("hide");
    q("#nft-button-display-box").classList.remove("hide");
    q("#nft-note-display-box").classList.remove("hide");
    q("#nft-mint-is").classList.remove("hide");
    q("#nft-public-title-is").classList.remove("hide");
  };

  if (this_whitelisted_response) {
    if (this_maximum_amount != 0 && (this_maximum_amount == this_whitelist_count_response)) { q("#mint-whitelisted-response").innerHTML = wallet._authData.accountId + " has created the allocated mints!"; }
    else { q("#mint-whitelisted-response").innerHTML = wallet._authData.accountId + " is on the whitelist!"; }
    q("#mint-whitelisted-response").classList.add("green");
    q("#mint-whitelisted-response").classList.remove("red");
    show_these_items();
  } else {
    q("#mint-whitelisted-response").innerHTML = wallet._authData.accountId + " is not on the whitelist!";
    q("#mint-whitelisted-response").classList.remove("green");
    q("#mint-whitelisted-response").classList.add("red");
    hide_these_items();
  }

  if (this_maximum_amount != 0 && (this_maximum_amount == this_whitelist_count_response)) {
    hide_these_items();
  } else if (this_maximum_amount != this_whitelist_count_response && this_whitelisted_response){
    show_these_items();
  }

};

function generic_is_selected_on_mint(incoming_selected_on_mint){
  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;
  if (incoming_selected_on_mint == "simpleartclub.testnet") {
    q("#nft-public-title-is").innerHTML = "Choose your public title:";
    q("#new-nft-description").classList.remove("hide");
  } else {
    q("#nft-public-title-is").innerHTML = "Your NFT title is: <b>" + VARIANT_MAPPING[incoming_selected_on_mint].name + " #" + ART_STATE.mint_counts_for_variants[VARIANT_MAPPING[incoming_selected_on_mint].index] + "</b>";
    q("#new-nft-description").classList.add("hide");
  }
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[VARIANT_MAPPING[incoming_selected_on_mint].index]) + " N";
  q("#main-mint-title").innerHTML = "Create NFT for " + VARIANT_MAPPING[incoming_selected_on_mint].name;
  q("#colour-selector").value = VARIANT_MAPPING[incoming_selected_on_mint].color;
  generate_whitelist_response(incoming_selected_on_mint);
};
/*
function is_simple_selected_on_mint() {

  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;
  q("#nft-public-title-is").innerHTML = "Choose your public title:";
  q("#new-nft-description").classList.remove("hide");
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[VARIANT_MAPPING["simpleartclub.testnet"].index]) + " N";
  q("#main-mint-title").innerHTML = "Create NFT for Simple Art Club";
  q("#colour-selector").value = "#8C00FF";
  generate_whitelist_response("simpleartclub.testnet");
};

function is_rare_selected_on_mint() {
  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;

  q("#nft-public-title-is").innerHTML = "Your NFT title is: <b>Rare DAO Club #" + ART_STATE.mint_counts_for_variants[1] + "</b>";
  q("#new-nft-description").classList.add("hide");
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[VARIANT_MAPPING["rare.sputnikv2.testnet"].index]) + " N";
  q("#main-mint-title").innerHTML = "Create NFT for  Rare DAO";
  q("#colour-selector").value = "#60E665";
  generate_whitelist_response("rare.sputnikv2.testnet");
};

function is_chaintyping_selected_on_mint() {
  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;

  q("#nft-public-title-is").innerHTML = "Your NFT title is: <b>Chain Typing Genesis #" + ART_STATE.mint_counts_for_variants[2] + "</b>";
  q("#new-nft-description").classList.add("hide");
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[VARIANT_MAPPING["chaintyping.testnet"].index])+ " N";
  q("#main-mint-title").innerHTML = "Create NFT for Chain Typing";
  q("#colour-selector").value = "#F3B358";
  generate_whitelist_response("chaintyping.testnet");
};

function is_peach_selected_on_mint() {
  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;

  q("#nft-public-title-is").innerHTML = "Your NFT title is: <b>House of Peach #" + ART_STATE.mint_counts_for_variants[3] + "</b>";
  q("#new-nft-description").classList.add("hide");
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[VARIANT_MAPPING["jellycottage.testnet"].index]) + " N";
  q("#main-mint-title").innerHTML = "Create NFT for House of Peach";
  q("#colour-selector").value = "#B13352";
  generate_whitelist_response("jellycottage.testnet");
};

function is_retro_selected_on_mint() {
  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;

  q("#nft-public-title-is").innerHTML = "Your NFT title is: <b>Retro Collection #" + ART_STATE.mint_counts_for_variants[4] + "</b>";
  q("#new-nft-description").classList.add("hide");
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[4]) + " N";
  q("#main-mint-title").innerHTML = "Create NFT for Retro Collection";
  q("#colour-selector").value = "#A41322";
  generate_whitelist_response("retro");
};

function is_rare_community_selected_on_mint() {
  q("#nft-mint-is-this-title").innerHTML = "Simple Art Club #" + ART_STATE.mint_count;

  q("#nft-public-title-is").innerHTML = "Your NFT title is: <b>Rare Community #" + ART_STATE.mint_counts_for_variants[5] + "</b>";
  q("#new-nft-description").classList.add("hide");
  q("#mint-character-button").innerHTML = "Donate to mint for " + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[VARIANT_MAPPING["community.sputnikv2.testnet"].index]) + " N";
  q("#main-mint-title").innerHTML = "Create NFT for  Rare Community";
  q("#colour-selector").value = "#60E665";
  generate_whitelist_response("community.sputnikv2.testnet");
};
*/

function block_this_nft_process(incoming_token_id){
  if (confirm("Are you sure you want to block this nft?")) {

    contract.set_nft_is_blocked({ token_id: incoming_token_id })
      .then(result => {
        console.log(result);
      });

  }
};

function unblock_this_nft_process(incoming_token_id) {
  if (confirm("Are you sure you want to unblock this nft?")) {
    contract.unblock_this_nft({ token_id: incoming_token_id })
      .then(result => {
        console.log(result);
      });
  }
};

function modify_variant_mint_price(incoming_variant_name_in, incoming_mint_price_in) {
  contract.modify_variant_mint_price({ incoming_variant_name: incoming_variant_name_in, incoming_mint_price: incoming_mint_price_in})
    .then(result => {
      console.log(result);
    });
};

function get_this_variant_index_from_name(incoming_variant_name) {
  let index_to_find = -1;
  for (let i = 0; i < ART_STATE.mint_variants.length; i++) {
    if (ART_STATE.mint_variants[i] == incoming_variant_name) {
      index_to_find = i;
      break;
    }
  }
  return index_to_find;
};
function local_get_count_for_whitelisted_user(incoming_variant_name, incoming_to_check_on_whitelist) {
  let index_to_find = -1;
  for (let i = 0; i < ART_STATE.mint_variants.length; i++) {
    if (ART_STATE.mint_variants[i] == incoming_variant_name) {
      index_to_find = i;
      break;
    }
  }

  if (ART_STATE.mint_variant_whitelistings[index_to_find].length == 0) {
    return -2;
  }

  for (let k = 0; k < ART_STATE.mint_variant_whitelistings[index_to_find].length; k++) {
    if (ART_STATE.mint_variant_whitelistings[index_to_find][k] == incoming_to_check_on_whitelist) {
      return ART_STATE.mint_variant_mint_number_counting[index_to_find][k];
    }
  }

  return -1;

};

function local_is_on_this_variant_whitelist(incoming_variant_name, incoming_to_check_on_whitelist) {
  let index_to_find = -1;
  for (let i = 0; i < ART_STATE.mint_variants.length; i++) {
    if (ART_STATE.mint_variants[i] == incoming_variant_name) {
      index_to_find = i;
      break;
    }
  }

  if (index_to_find != -1) {
    if (ART_STATE.mint_variant_whitelistings[index_to_find].length == 0) { return true; }

    for (let k = 0; k < ART_STATE.mint_variant_whitelistings[index_to_find].length; k++) {
      if (ART_STATE.mint_variant_whitelistings[index_to_find][k] == incoming_to_check_on_whitelist) {
        return true;
      }
    }

    return false;

  } else {
    return false;
  }
}
function is_on_this_variant_whitelist(incoming_variant_name_in, incoming_to_check_on_whitelist_in) {
  contract.is_on_this_variant_whitelist({ incoming_variant_name: incoming_variant_name_in, incoming_to_check_on_whitelist: incoming_to_check_on_whitelist_in })
  .then(result => {
    console.log(result);
  });
};

function modify_variant_limit(incoming_variant_name_in, incoming_variant_new_max_in) {
  contract.modify_variant_limit({ incoming_variant_name: incoming_variant_name_in, incoming_variant_new_max: incoming_variant_new_max_in })
    .then(result => {
      console.log(result);
    });
};

function initiate_or_append_this_variant_whitelisting(incoming_variant_name_in, incoming_whitelist_array_of_strings_in, incoming_is_initiate_in) {
  contract.initiate_or_append_this_variant_whitelisting({ incoming_variant_name: incoming_variant_name_in, incoming_whitelist_array_of_strings: incoming_whitelist_array_of_strings_in, incoming_is_initiate: incoming_is_initiate_in })
    .then(result => {
      console.log(result);
    });
};

function add_new_variant(incoming_variant_name_in, incoming_variant_max_nfts_in, incoming_variant_mint_donation_cost_in, incoming_variant_mint_max_per_user_in) {
  contract.add_new_variant({ incoming_variant_name: incoming_variant_name_in, incoming_variant_max_nfts: incoming_variant_max_nfts_in, incoming_variant_mint_donation_cost: incoming_variant_mint_donation_cost_in, incoming_variant_mint_max_per_user: incoming_variant_mint_max_per_user_in})
    .then(result => {
      console.log(result);
    });
};
function get_whitelisting_for_this_nft_variant(incoming_variant_name_in) {
  contract.get_whitelisting_for_this_nft_variant({ incoming_variant_name: incoming_variant_name_in})
    .then(result => {
      console.log(result);
    });
};

function initialize_simple_art() {
  contract.initialize_simple_art({})
    .then(result => {
      console.log(result);
    });
};

function add_system_owner(incoming_new_system_owner_in) {
  contract.add_system_owner({ incoming_new_system_owner: incoming_new_system_owner_in})
    .then(result => {
      console.log(result);
    });
};


function get_simple_art_state(callback) {
  contract.get_simple_art_state({})
    .then(result => {
      ART_STATE = result[0];
      q("#art-state").innerHTML = ART_STATE.mint_count + "/" + count_maximum_total_number_of_nfts();
      callback();
    });
};

function nft_tokens(callback) {
  contract.nft_tokens({ from_index: START_INDEX_FOR_NFTS, limit: END_INDEX_FOR_NFTS})
    .then(result => {
      NFT_TOKENS = NFT_TOKENS.concat(result);
      console.log("Getting all nft tokens");
      if (END_INDEX_FOR_NFTS >= TOTAL_NFT_SUPPLY) {
        IS_SORTED_MINTS_ALREADY = false;
        q("#mint-ids-sort-market").innerHTML = "Mint &#x2191;";
        q("#nft-items").innerHTML = buildNftList();
        callback();

      } else {
        START_INDEX_FOR_NFTS += INDEX_INCREMENT;
        END_INDEX_FOR_NFTS += INDEX_INCREMENT;
        nft_tokens(callback);
      }


    });
};

function nft_total_supply(callback) {
  contract.nft_total_supply({ })
    .then(result => {
      TOTAL_NFT_SUPPLY = parseInt(result);
      callback();
    });
};
function get_this_nft_from_id(incoming_id) {
  for (var i = 0; i < NFT_TOKENS.length; i++) {

    if (NFT_TOKENS[i].id == incoming_id) {
      return NFT_TOKENS[i];
    }
  }
};

function get_this_nft_order_from_id(incoming_id) {
  for (var i = 0; i < ALL_ORDERS.length; i++) {
    if (ALL_ORDERS[i].token_id == incoming_id) {
      return ALL_ORDERS[i];
    }
  }
};

function buildMyLikedList(owner_to_check) {
  let html_builder = "";
  for (var i = 0; i < ALL_ORDERS.length; i++) {
    if (ALL_ORDERS[i].favourited_by_users.includes(owner_to_check) && !ALL_ORDERS[i].is_blocked) {
      MY_LIKED_COUNT++;
      let get_this_liked_nft = get_this_nft_from_id(ALL_ORDERS[i].token_id);
      html_builder += '<div class="nft-item">';
      html_builder += '<div class="nft-description">' + sanitize(get_this_liked_nft.metadata.description == "" ? "#"+get_this_liked_nft.id : get_this_liked_nft.metadata.description) + '</div>';
      html_builder += '<img class="nft-image" onclick="launchSpecificNftView(\'' + get_this_liked_nft.id + '\')" src="' + get_this_liked_nft.metadata.media + '">';
      html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + get_this_liked_nft.owner_id + '\')">&#x265F; ' + get_this_liked_nft.owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
      html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + ALL_ORDERS[i].favourited_by_users.length + ' likes</div></div>';

      if (!ALL_ORDERS[i].forSale) {
        html_builder += '<div class="not-for-sale">Not for sale</div>';
      } else {
        html_builder += '<div onclick="launchSpecificBuy(\'' + get_this_liked_nft.id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(ALL_ORDERS[i].price_for_sale) + ' N</div>';
      }

      if (wallet.isSignedIn()) {
        html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + get_this_liked_nft.id + '\')" class="favourite-this-item remove-favourite">Unlike</div>';
      }

      html_builder += '</div>';
    }

  }
  return html_builder;
};

function buildMyCreationsList(owner_to_check, is_gallery) {
  let html_builder = "";
  for (var i = 0; i < ALL_ORDERS.length; i++) {

    if (ALL_ORDERS[i].original_creator == owner_to_check && !ALL_ORDERS[i].is_blocked) {
      MY_CREATIONS_COUNT++;
      if (CREATION_SUPPLY_SET_ONCE) {
        THIS_OWNER_CREATION_SUPPLY++;
      }
    }

    if (ALL_ORDERS[i].original_creator === owner_to_check && !ALL_ORDERS[i].is_blocked) {
      let get_this_nft = get_this_nft_from_id(ALL_ORDERS[i].token_id);
      html_builder += '<div class="nft-item">';
      html_builder += '<div class="nft-description">' + sanitize(get_this_nft.metadata.description == "" ? "#" + get_this_nft.id : get_this_nft.metadata.description) + '</div>';


      if (get_this_nft.metadata.media != "") {
        html_builder += '<img class="nft-image" onclick="launchSpecificNftView(\'' + get_this_nft.id + '\')" src="' + get_this_nft.metadata.media + '">';
      }
      html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + get_this_nft.owner_id + '\')">&#x265F; ' + get_this_nft.owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
      html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + ALL_ORDERS[i].favourited_by_users.length + ' likes</div></div>';

      if (!is_gallery) {

        if (!ALL_ORDERS[i].forSale) {
          html_builder += '<div class="not-for-sale">Not for sale</div>';
        } else {
          html_builder += '<div onclick="launchSpecificBuy(\'' + get_this_nft.id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(ALL_ORDERS[i].price_for_sale) + ' N</div>';
        }
      }
      if (wallet.isSignedIn()) {
        if (!ALL_ORDERS[i].favourited_by_users.includes(wallet._authData.accountId)) {
          html_builder += '<div onclick="launchSpecificFavourite(\'' + get_this_nft.id + '\')" class="favourite-this-item">Like</div>';
        } else {
         // html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + get_this_nft.id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
        }
      }

      html_builder += '</div>';
    }

  }
  return html_builder;
};

function buildMyNftList(is_gallery) {
  let html_builder = "";

  for (var i = 0; i < MY_NFTS.length; i++) {

    let get_this_nft = get_this_nft_from_id(MY_NFTS[i].id);
    let get_this_nft_order = get_this_nft_order_from_id(MY_NFTS[i].id);

    if (typeof get_this_nft_order != 'undefined' && !get_this_nft_order.is_blocked) {

    html_builder += '<div class="nft-item">';
    html_builder += '<div class="nft-description">' + sanitize(MY_NFTS[i].metadata.description == "" ? "#" + MY_NFTS[i].id : MY_NFTS[i].metadata.description) + '</div>';


      if (get_this_nft.metadata.media != "") {
        html_builder += '<img class="nft-image" onclick="launchSpecificNftView(\'' + MY_NFTS[i].id +'\')" src="' + get_this_nft.metadata.media + '">';
      }

      if (!is_gallery) {
        html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + get_this_nft.owner_id + '\')">&#x265F; ' + get_this_nft.owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
        html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + get_this_nft_order.favourited_by_users.length + ' likes</div></div>';


        if (!get_this_nft_order.forSale) {
          html_builder += '<div class="not-for-sale">Not for sale</div>';
        } else {
          html_builder += '<div onclick="launchSpecificBuy(\'' + MY_NFTS[i].id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(get_this_nft_order.price_for_sale)+' N</div>';
        }
        if (wallet.isSignedIn()){
          if (!get_this_nft_order.favourited_by_users.includes(wallet._authData.accountId)) {
            html_builder += '<div onclick="launchSpecificFavourite(\'' + MY_NFTS[i].id + '\')" class="favourite-this-item">Like</div>';
          } else {
          // html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + MY_NFTS[i].id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
          }
        }

      }
    }


    html_builder += '</div>';
  }
  return html_builder;
}

function buildNftList() {
  let html_builder = "";

  for (var i = NFT_TOKENS.length-1; i > -1; i--) {
    let get_this_nft_order = get_this_nft_order_from_id(NFT_TOKENS[i].id);

    if (typeof get_this_nft_order != 'undefined' && !get_this_nft_order.is_blocked) {
      html_builder += '<div data-for-sale="' + get_this_nft_order.forSale + '" class="nft-item">';

      html_builder += '<div class="variant-types hide">' + get_this_nft_order.variant_type +'</div>';
      html_builder += '<div class="mint-ids hide">' + NFT_TOKENS[i].id + '</div>';
      html_builder += '<div class="likes-count-for-sort hide">' + get_this_nft_order.favourited_by_users.length + '</div>';


      let price_to_use_for_sort = !get_this_nft_order.forSale ? 0 : parseFloat(utils.format.formatNearAmount(get_this_nft_order.price_for_sale));
      html_builder += '<div class="market-price hide">' + price_to_use_for_sort + '</div>';

      html_builder += '<div class="nft-description">' + sanitize(NFT_TOKENS[i].metadata.description == "" ? "#" + NFT_TOKENS[i].id : NFT_TOKENS[i].metadata.description) + '</div>';
      if (NFT_TOKENS[i].metadata.media != "") {
        html_builder += '<img onclick="launchSpecificNftView(\'' + NFT_TOKENS[i].id +'\')" class="nft-image" src="'+NFT_TOKENS[i].metadata.media+'">';
      }
      html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + NFT_TOKENS[i].owner_id +'\')">&#x265F; ' + NFT_TOKENS[i].owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
      html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + get_this_nft_order.favourited_by_users.length +' likes</div></div>';

      if (!get_this_nft_order.forSale) {
        html_builder += '<div class="not-for-sale">Not for sale</div>';
      } else {
        html_builder += '<div onclick="launchSpecificBuy(\'' + NFT_TOKENS[i].id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(get_this_nft_order.price_for_sale) + ' N</div>';
      }

      if (wallet.isSignedIn()){
        if (!get_this_nft_order.favourited_by_users.includes(wallet._authData.accountId)) {
          html_builder += '<div onclick="launchSpecificFavourite(\'' + NFT_TOKENS[i].id + '\')" class="favourite-this-item">Like</div>';
        } else {
          //html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + NFT_TOKENS[i].id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
        }
      }

      html_builder += '</div>';
    }
  }
  return html_builder;
};

function generateStats() {
  let html_builder = "";
  html_builder += '<ul class="stats-list">';
  html_builder += '<li>Creations Minted: <b>' + ART_STATE.mint_count + '</b></li>';
  html_builder += '<li>Number of Collections: <b>' + ART_STATE.mint_counts_for_variants.length + '</b></li>';

  //html_builder += '<li >Donation cost: <b>' + utils.format.formatNearAmount(ART_STATE.mint_donation_cost) + ' N</b></li>';
  html_builder += '<li>System Earned: <b>' + utils.format.formatNearAmount(ART_STATE.system_earned) + ' N</b></li>';
  html_builder += '<li>System Moved to Vault: <b>' + utils.format.formatNearAmount(ART_STATE.system_moved_to_vault) + ' N</b></li>';
  html_builder += '<li >Market Volume Total: <b>' + utils.format.formatNearAmount(ART_STATE.market_volume) + ' N</b></li>';
  html_builder += '<li>Unique Artist Count: <b>' + ART_STATE.artist_count + '</b></li>';
  html_builder += '<li>Artist Royalties Earned: <b>' + utils.format.formatNearAmount(ART_STATE.creators_royalties_earned) + ' N</b></li>';
  html_builder += '<li>Category Royalties Earned: <b>' + utils.format.formatNearAmount(ART_STATE.dao_royalties_earned) + ' N</b></li>';

  html_builder += '<li>System Royalty: <b>' + ART_STATE.market_royalty_percent + ' %</b></li>';
  html_builder += '<li>Artist Royalty: <b>' + ART_STATE.creator_royalty_percent + ' %</b></li>';
  html_builder += '<li>Category Royalty: <b>' + ART_STATE.creator_dao_royalty_percent + ' %</b></li>';

  let current_v = CURRENT_COUNTER.split("\n");
  current_v = current_v[0].split(":")[1];

  html_builder += '<li>Counter: <b>' + current_v + ' </b></li>';

  html_builder += '<li style="margin-top:10px;"><b>Collections:</b></li>';
  for (var i=0;i<ART_STATE.mint_variants.length; i++) {
    html_builder += '<li>' + get_nft_variant_name_from_mapping(ART_STATE.mint_variants[i]) + ': <b>' + ART_STATE.mint_counts_for_variants[i] + '/' + ART_STATE.max_nfts_for_mint_variants[i] + '</b> with mint donation <b>' + utils.format.formatNearAmount(ART_STATE.mint_for_variant_donation_cost[i]) + ' N</b></li>';
  }


  html_builder += '</ul>';
  if (wallet.isSignedIn()){
    html_builder += '<div><input id="set-discord-owner-link" type="text" placeholder="Your discord username handle..."></div>';
    html_builder += '<div onclick="requestDiscordRank()" class="request-discord-rank">Request Discord Rank</div>';

  }
  return html_builder;
};


function build_this_nft_view() {
  let get_this_nft_order = get_this_nft_order_from_id(CURRENT_NFT_IN_VIEW.id);
  let html_builder = "";

  if (!get_this_nft_order.is_blocked || wallet._authData.accountId == FRONT_OWNER) {
      html_builder += '<div class="nft-item">';
    html_builder += '<div class="nft-description">' + sanitize(CURRENT_NFT_IN_VIEW.metadata.description == "" ? "#" + CURRENT_NFT_IN_VIEW.id : CURRENT_NFT_IN_VIEW.metadata.description) + '</div>';
      html_builder += '<img class="nft-image" src="' + CURRENT_NFT_IN_VIEW.metadata.media + '">';
      html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + CURRENT_NFT_IN_VIEW.owner_id + '\')">&#x265F; ' + CURRENT_NFT_IN_VIEW.owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
      if (wallet.isSignedIn()) {
        html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + get_this_nft_order.favourited_by_users.length + ' likes</div></div>';
      }

    if (!get_this_nft_order.forSale) {
        html_builder += '<div class="not-for-sale">Not for sale</div>';
      } else {
        html_builder += '<div onclick="launchSpecificBuy(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(get_this_nft_order.price_for_sale) + ' N</div>';
      }
      if (CURRENT_NFT_IN_VIEW.owner_id == wallet._authData.accountId) {
        if (get_this_nft_order.forSale) {
          html_builder += '<div onclick="cancelSellSpecificItem(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="cancel-listing">Cancel listing</div>';
        }
      }
      if (wallet.isSignedIn()) {
        if (!get_this_nft_order.favourited_by_users.includes(wallet._authData.accountId)) {
          html_builder += '<div onclick="launchSpecificFavourite(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="favourite-this-item">Like</div>';
        } else {
          html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="favourite-this-item remove-favourite">Unlike</div>';
        }

        if (wallet._authData.accountId == FRONT_OWNER) {
          html_builder += '<div onclick="block_this_nft_process(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="cancel-listing" style="margin-top:10px;">Block this nft</div>';
          html_builder += '<div onclick="unblock_this_nft_process(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="is-for-sale">Unblock this nft</div>';

        }

      }

      html_builder += '</div>';
      //console.log("this nft owner");
      //console.log(get_this_nft_order);
    if (CURRENT_NFT_IN_VIEW.owner_id == wallet._authData.accountId) {
        if (get_this_nft_order.forSale) {
          //html_builder += '<div class="nft-item-details">';
          //html_builder += '<div onclick="cancelSellSpecificItem(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="cancel-listing">Cancel listing</div>';
          //html_builder += '<ul class="history-list dotted-top"><li>&#128176; Royalties earned: <b>' + utils.format.formatNearAmount(get_this_nft_order.this_order_royalties_earned) + ' N</b></li></ul>';
          //html_builder += '</div>';
        } else {
          html_builder += '<div class="nft-item-details">';
          html_builder += '<div><input id="set-price" type="number" placeholder="Set listing price..."></div>';
          html_builder += '<div onclick="sellSpecificItem(\'' + CURRENT_NFT_IN_VIEW.id + '\')"  class="sell-this-item">List this art for sale</div>';
          //html_builder += '<ul class="history-list dotted-top"><li>&#128176; Royalties earned: <b>' + utils.format.formatNearAmount(get_this_nft_order.this_order_royalties_earned)+ ' N</b></li></ul>';
          html_builder += '</div>';
        }
      }

      html_builder += '<div class="nft-item-details">';
        html_builder += '<div class="for-sale-history">' + sanitize(CURRENT_NFT_IN_VIEW.metadata.title)+'</div>';

        html_builder += '<ul class="history-list">';
      let count_number_of_items = 0;
      for (let i = get_this_nft_order.history_action_type.length; i > -1; i--) {
          if (count_number_of_items <= MAX_HISTORY_SHOWING_LENGTH) {
            count_number_of_items++;
            if (get_this_nft_order.history_action_type[i] == "mint") {
              html_builder += '<li><div class="history-display-first">&#128396; Minted by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0] + '</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() +'</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "list") {
              html_builder += '<li><div class="history-display-first">&#x1F4B8; Listed for ' + utils.format.formatNearAmount(get_this_nft_order.history_price[i]) + ' N </div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() +'</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "buy") {
              html_builder += '<li><div class="history-display-first">&#128176; Purchased by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0] + '</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() +'</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "cancel") {
              html_builder += '<li><div class="history-display-first">&#x2612; Cancelled listing</div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() +'</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "transfer") {
              html_builder += '<li><div class="history-display-first">&#128396; NFT Transferred by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0]+'</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
            }
          } else {
            if (get_this_nft_order.history_action_type[i] == "mint") {
              html_builder += '<li class="hide"><div class="history-display-first">&#128396; Minted by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0] + '</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "list") {
              html_builder += '<li class="hide"><div class="history-display-first">&#x1F4B8; Listed for ' + utils.format.formatNearAmount(get_this_nft_order.history_price[i]) + ' N </div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "buy") {
              html_builder += '<li class="hide"><div class="history-display-first">&#128176; Purchased by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0] + '</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "cancel") {
              html_builder += '<li class="hide"><div class="history-display-first">&#x2612; Cancelled listing</div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
            } else if (get_this_nft_order.history_action_type[i] == "transfer") {
              html_builder += '<li><div class="history-display-first">&#128396; NFT Transferred by <b>' +get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0]+'</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
            }
          }
      }

      let build_show_history_button_once = false;
      if (get_this_nft_order.history_action_type.length > MAX_HISTORY_SHOWING_LENGTH && !build_show_history_button_once) {
        build_show_history_button_once = true;
        html_builder += '<li><div onclick="showThisHistoryMore(this);" class="history-display-first history-show-more">&#x2192; Show full history</div></li>';
      }


      html_builder += '</ul>';
      html_builder += '<ul class="history-list dotted-top"><li>&#128176; Royalties earned: <b>' + utils.format.formatNearAmount(get_this_nft_order.this_order_royalties_earned) + ' N</b></li></ul>';

      if (CURRENT_NFT_IN_VIEW.owner_id == wallet._authData.accountId) {
        html_builder += '<div class="dotted-top">';
        html_builder += '<div onclick="transfer_to_new_owner(\'' + CURRENT_NFT_IN_VIEW.id + '\')"  class="sync-this-item">&#x2699; Advanced - Transfer to new owner</div>';
        html_builder += '<div><input id="set-new-owner" type="text" placeholder="Address to transfer this nft..."></div>';
        html_builder += '<div onclick="transfer_to_self_wallet_sync(\'' + CURRENT_NFT_IN_VIEW.id + '\')"  class="sync-this-item" style="padding-top:10px;">&#x2699; Advanced - Sync with wallet collectables</div>';
        html_builder += '</div>';
      }
      html_builder += '</div>';
  }
  return html_builder;
}

function showThisHistoryMore(target) {
  let full_list = target.parentElement.parentElement;
  for (var i = 0; i < full_list.children.length; i++) {
    full_list.children[i].classList.remove("hide");
  }
  target.classList.add("hide");
};

function get_all_users() {
  contract.get_all_users({})
    .then(result => {
      console.log(result);
    });
};
function get_all_orders(callback) {
  contract.get_all_orders({ from_index: START_INDEX_FOR_ORDERS, limit: END_INDEX_FOR_ORDERS })
    .then(result => {
      //console.log(result);
      console.log("Getting all orders");
      console.log("From index: " + START_INDEX_FOR_ORDERS, ", to Index: " +END_INDEX_FOR_ORDERS);

      ALL_ORDERS = ALL_ORDERS.concat(result);
      if (END_INDEX_FOR_ORDERS >= TOTAL_NFT_SUPPLY) {
        callback();
      } else {
        console.log("trying again");
        START_INDEX_FOR_ORDERS += INDEX_INCREMENT;
        END_INDEX_FOR_ORDERS += INDEX_INCREMENT;
        get_all_orders(callback);
      }
    });
};

function nft_supply_for_owner(callback) {
  contract.nft_supply_for_owner({ account_id: wallet._authData.accountId})
    .then(result => {
      console.log(result);
      THIS_OWNERS_SUPPLY = result;
      callback();
    });
};
function nft_tokens_for_owner_process(owner_to_check, is_gallery) {
  q("#my-creations-count").innerHTML = "";
  q("#my-favourites-count").innerHTML = "";

  q("#my-nft-items").innerHTML = buildMyNftList(is_gallery);

  if (!is_gallery) {
    q("#my-creations-title").classList.remove("hide");
    q("#my-nft-creations").classList.remove("hide");
    q("#my-creations-count").classList.remove("hide");
    q("#my-favourites-title").classList.remove("hide");
    q("#my-nft-favourites").classList.remove("hide");
    q("#my-nft-creations").innerHTML = buildMyCreationsList(owner_to_check, is_gallery);
    CREATION_SUPPLY_SET_ONCE = false;
  } else {
    q("#my-creations-title").classList.add("hide");
    q("#my-nft-creations").classList.add("hide");
    q("#my-creations-count").classList.add("hide");
    q("#my-favourites-title").classList.add("hide")
    q("#my-nft-favourites").classList.add("hide");
  }
  //console.log("My creations count: " + MY_CREATIONS_COUNT);
  if (!is_gallery && MY_CREATIONS_COUNT == 0) {
    q("#my-creations-count").innerHTML = "No minted NFTs yet!";
  }

  if (!is_gallery) {
    q("#my-nft-favourites").innerHTML = buildMyLikedList(owner_to_check);
    if (MY_LIKED_COUNT == 0) {
      q("#my-favourites-count").innerHTML = "No liked NFTs yet!";
    } else {
      //q("#my-favourites-count").innerHTML = "Liked " + MY_LIKED_COUNT;
    }
  }

  if (!is_gallery) {
    if (MY_NFTS.length == 0) {
      q("#my-count").innerHTML = NO_ITMES_IN_COLLECTION;
    } else {
      //q("#my-count").innerHTML = "Collection of " + MY_NFTS.length;
    }
  }

  MY_LIKED_COUNT = 0;
  MY_CREATIONS_COUNT = 0;
};

function nft_tokens_for_owner(owner_to_check, is_gallery, callback) {
  contract.nft_tokens_for_owner({ account_id: owner_to_check, from_index: 0, limit: 100 })
    .then(result => {
      //console.log(result);
      MY_NFTS = result;
      console.log("Calling is gallery: " + is_gallery);
      nft_tokens_for_owner_process(owner_to_check, is_gallery);
      callback();
    }).catch(function (error) {
      console.log(error);
      q("#my-creations-title").classList.add("hide");
      q("#my-count").innerHTML = NO_ITMES_IN_COLLECTION;
      q("#my-creations-title").classList.add("hide");
      q("#my-nft-creations").classList.add("hide");
      q("#my-creations-count").classList.add("hide");
      callback();
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
      CURRENT_NFT_IN_VIEW = result;
      q("#this-nft-item").innerHTML = build_this_nft_view();

      let new_date = new Date(parseInt(CURRENT_NFT_IN_VIEW.metadata.issued_at));
      //q("#this-nft-count").innerHTML = "Created on " + new_date.toUTCString();

      //console.log(result);
      is_loading_external_profile = false;
    });
};
function update_nft_token(incoming_token_id, incoming_description) {
  contract.update_nft_token({ token_id: incoming_token_id, description: incoming_description})
    .then(result => {
      console.log(result);
    });
};
function dom2image(node, callback) {
  domtoimage.toJpeg(node).then(function (dataUrl) {
    callback(dataUrl);
  }).catch(function (error) {
    console.error('oops, something went wrong!', error);
  });
}
function get_nft_data_blob(callback) {
 dom2image(q("#nft-renderer"), function(dataUrl){
    let data_url = dataUrl;
    //fetch(dataUrl)
      //.then(res => res.blob())
      //.then(blob => callback(blob))
      callback(data_url);
  });
};

function generateMetadata(number, incoming_description, metadata_url_received, media_url_received) {
  return {
    title: "Simple Art # " + number, // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    description: incoming_description, // free-form description
    media: "https://ipfs.io/ipfs/" + media_url_received, // URL to associated media, preferably to decentralized, content-addressed storage
    media_hash: "", // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    copies: "1", // number of copies of this set of metadata in existence when token was minted.
    issued_at: Date.now().toString(), // When token was issued or minted, Unix epoch in milliseconds
    //expires_at: string, // When token expires, Unix epoch in milliseconds
   // starts_at: string, // When token starts being valid, Unix epoch in milliseconds
    //updated_at: string, // When token was last updated, Unix epoch in milliseconds
    //extra: string, // anything extra the NFT wants to store on-chain. Can be stringified JSON.
    reference: "https://ipfs.io/ipfs/" + metadata_url_received, // URL to an off-chain JSON file with more info.
    //reference_hash: string // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  }
};

async function nft_to_storage_pre_minter(incoming_data_blob, callback) {

  let signedMsg = await near.connection.signer.signMessage(wallet._authData.accountId, wallet._authData.accountId, NETWORK_ID_LOCAL)
  const signature = Buffer.from(signedMsg.signature).toString('hex')
  const pubKey = Buffer.from(signedMsg.publicKey.data).toString('hex')
  let description_to_use = "";
  let variant_index = 0;
  let mint_variant_watcher_type = q("#mint-variant-watcher").value;
  variant_index = VARIANT_MAPPING[mint_variant_watcher_type].index;

  if (mint_variant_watcher_type == "simpleartclub.testnet") {
    description_to_use = sanitize(q("#new-nft-description").value);
  } else {
    description_to_use = VARIANT_MAPPING[mint_variant_watcher_type].pre_description + ART_STATE.mint_counts_for_variants[variant_index];
  }

  let to_submit = {
    "accountId": wallet._authData.accountId,
    "pubkey": pubKey,
    "signature": signature,
    "token_id": (parseInt(ART_STATE.mint_count)+1),
    "title": "Simple Art # " + (parseInt(ART_STATE.mint_count)),
    "description": description_to_use,
    "data_blob": incoming_data_blob
  };

  //console.log(to_submit);

  fetch(BACKEND_URL + "/nft_creator", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(to_submit)
  }).then((res) => {
    return res.json();
  }).then((data) => {
    if (data.status == false && data.error == true) {
      ERROR_MESSAGE(data.message);
    } else {
      //console.log(data);
      //console.log("Finsihed backend post");
      let metadata_url_received = data.resulting_saved_metadata.url.split("ipfs://")[1];

      fetch("https://ipfs.io/ipfs/" + metadata_url_received).then(function (response) {
        return response.json();
      }).then(function (image_data) {
        //console.log("Received back from fetch")
        //console.log(image_data);

        let image_media_url = image_data.image.split("ipfs://")[1];
        let new_image_url = "https://ipfs.io/ipfs/" + image_media_url;

        submitDiscordUpdate("mint", (parseInt(ART_STATE.mint_count)+1), "", new_image_url, function(){

          let new_metadata = generateMetadata(((parseInt(ART_STATE.mint_count))), sanitize(description_to_use), metadata_url_received, image_media_url)
          console.log("Final metadata to post");
          console.log(new_metadata);


          contract.nft_mint({ token_id: ART_STATE.mint_count, metadata: new_metadata, receiver_id: wallet._authData.accountId, incoming_variant_name: mint_variant_watcher_type }, GAS_TO_ATTACH, ART_STATE.mint_for_variant_donation_cost[variant_index])
            .then(result => {
              console.log(result);
              callback();
            });

        });



        callback(data);
      }).catch(error => {
        ERROR_MESSAGE(error);
      });



      /*contract.nft_mint({ token_id: ART_STATE.mint_count+1, metadata: incoming_metadata, receiver_id: incoming_receiver_id }, GAS_TO_ATTACH, ART_STATE.mint_donation_cost)
        .then(result => {
          console.log(result);
          callback();
        });*/

    }
  }).catch(error => {
    ERROR_MESSAGE(error);
  });;


};

function nft_mint(incoming_metadata, incoming_receiver_id) {
  contract.nft_mint({ token_id: (parseInt(ART_STATE.mint_count)), metadata: incoming_metadata, receiver_id: incoming_receiver_id }, GAS_TO_ATTACH, ART_STATE.mint_donation_cost)
    .then(result => {
      console.log(result);
    });
};

function nft_transfer(incoming_receiver_id, incoming_token_id, callback) {
  contract.nft_transfer({ receiver_id: incoming_receiver_id, token_id: incoming_token_id})
    .then(result => {
      console.log(result);
      callback();
    });
};

function update_nft_for_sale(incoming_token_id, incoming_price_for_sale, callback) {
  contract.update_nft_for_sale({ token_id: incoming_token_id, price_for_sale: incoming_price_for_sale })
    .then(result => {
      console.log(result);
      callback();
    });
};

function cancel_nft_for_sale(incoming_token_id, callback) {
  contract.cancel_nft_for_sale({token_id: incoming_token_id})
    .then(result => {
      console.log(result);
      callback();
    });
};

function favourite_this_nft(incoming_token_id, callback) {
  contract.favourite_this_nft({ token_id: incoming_token_id, user_id: wallet._authData.accountId })
    .then(result => {
      console.log(result);
      callback();
    });
};

function cancel_favourite(incoming_token_id, callback) {

  contract.cancel_favourite({ token_id: incoming_token_id, user_id: wallet._authData.accountId })
    .then(result => {
      console.log(result);
      callback();
    });
}