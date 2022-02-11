
const CONTRACT = "dev-1644516843293-15124568036022";
const BACKEND_URL = ""; // Must be set

const NEAR_NETWORK_NAME = ".testnet";
const NETWORK_ID_LOCAL = "testnet";
const GAS_TO_ATTACH = 100000000000000;
const NO_ITMES_IN_COLLECTION = "Looks like there are no NFTs in this collection yet!";
const GENERIC_LOADING_MESSAGE = "Loading...";
let MAIN_DATA_ALREADY_LOADED = false;
let IS_SORTED_MINTS_ALREADY = true;
let IS_SORTED_PRICE_DOWN = true;
let IS_SORTED_LIKES_DOWN = false;
let SET_MARKET_SORT_WATCHERS_ONCE = false;
let IS_HIDING_FOR_SALE = false;
let ART_STATE = "";
let NFT_TOKENS = "";
let MY_NFTS = "";
let ALL_ORDERS = "";
let IS_ERASOR_SELECTED = false;
let IS_PAINT_SELECTED = false;
let MY_CREATIONS_COUNT = 0;
let MY_LIKED_COUNT = 0;

let HASH_ID = "";
let CURRENT_NFT_IN_VIEW = "";

let is_on_first_page = true;
let is_loading_external_profile = false;
let is_loading_gallery = false;
let IS_PROCESSING_MINT = false;
function q(input) { return document.querySelector(input); };

function showLoadingScreen(loading_message) {
  q("#loading-message").innerHTML = loading_message;
  q("#loading-screen").classList.remove("hide");
};

function buttonWatchers() {
  q("#explore").addEventListener("click", function () {
    if (is_on_first_page) {
      window.location.hash = "/explore";
      q("#explore").innerHTML = "Back to Menu";
      q("#explore-nfts").classList.remove("hide");
      q("#intro-container").classList.add("hide");
      q("#explore-my-nfts").classList.add("hide");
      q("#mint-nft").classList.add("hide");
      q("#explore-this-nft").classList.add("hide");
      q("#about-simple-art-club").classList.add("hide");
      q("#simple-art-club-stats").classList.add("hide");
      is_on_first_page = false;
    } else {
      q("#explore").innerHTML = "Explore";
      function removeHash() { history.pushState("", document.title, window.location.pathname + window.location.search); }
      removeHash();
      q("#intro-container").classList.remove("hide");
      q("#explore-nfts").classList.add("hide");
      q("#explore-my-nfts").classList.add("hide");
      q("#mint-nft").classList.add("hide");
      q("#explore-this-nft").classList.add("hide");
      q("#about-simple-art-club").classList.add("hide");
      q("#simple-art-club-stats").classList.add("hide");
      is_on_first_page = true;
    }
  });
  q("#about").addEventListener("click", function () {
    window.location.hash = "/about";
    q("#about-simple-art-club").classList.remove("hide");
    q("#intro-container").classList.add("hide");
    q("#explore-nfts").classList.add("hide");
    q("#explore-my-nfts").classList.add("hide");
    q("#mint-nft").classList.add("hide");
    q("#explore-this-nft").classList.add("hide");
    q("#simple-art-club-stats").classList.add("hide");
  });

  q("#my-gallery-view").addEventListener("click", function () {
    window.location.hash = "/gallery/" + wallet._authData.accountId;
    HASH_ID = window.location.hash;
    load_gallery();
  });

  q("#my-art").addEventListener("click", function () {
    if (is_loading_external_profile) {
      if (is_loading_gallery) {
        q("#my-title").innerHTML = HASH_ID.split("gallery/")[1].split(NEAR_NETWORK_NAME)[0];
      } else {
        q("#my-title").innerHTML = HASH_ID.split("profile/")[1].split(NEAR_NETWORK_NAME)[0];
      }
    } else if (wallet.isSignedIn()) {
      window.location.hash = "/profile/" + wallet._authData.accountId;
      q("#my-title").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
      if (MAIN_DATA_ALREADY_LOADED) {
        nft_tokens_for_owner(wallet._authData.accountId, false);
        is_loading_external_profile = false;
      } else {
        get_all_orders(function () {
          nft_tokens(function () {
            nft_tokens_for_owner(wallet._authData.accountId, false);
            MAIN_DATA_ALREADY_LOADED = true;
          });
        });
      }
    }

    q("#explore-nfts").classList.add("hide");
    q("#intro-container").classList.add("hide");
    q("#explore-my-nfts").classList.remove("hide");
    q("#mint-nft").classList.add("hide");
    q("#explore-this-nft").classList.add("hide");
    q("#about-simple-art-club").classList.add("hide");
    q("#simple-art-club-stats").classList.add("hide");
  });

  q("#simple-stats").addEventListener("click", function () {
    window.location.hash = "/stats";
    q("#about-simple-art-club").classList.add("hide");
    q("#explore-nfts").classList.add("hide");
    q("#intro-container").classList.add("hide");
    q("#explore-my-nfts").classList.add("hide");
    q("#mint-nft").classList.add("hide");
    q("#explore-this-nft").classList.add("hide");
    q("#simple-art-club-stats").classList.remove("hide");
    q("#current-stats").innerHTML = generateStats();
  });

  q("#create-art").addEventListener("click", function () {
    q("#about-simple-art-club").classList.add("hide");
    q("#explore-nfts").classList.add("hide");
    q("#intro-container").classList.add("hide");
    q("#explore-my-nfts").classList.add("hide");
    q("#mint-nft").classList.remove("hide");
    q("#explore-this-nft").classList.add("hide");
    q("#simple-art-club-stats").classList.add("hide");
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
    "nft_total_supply"
  ],
  changeMethods: [
    'update_nft_token',
    'nft_mint',
    'nft_transfer',
    'update_nft_for_sale',
    'initialize_simple_art',
    'cancel_nft_for_sale',
    'buy_this_nft_from_owner',
    "initialize_favourited_by",
    "favourite_this_nft",
    "cancel_favourite"
  ]
});


const button = q('#sign-in-button');

if (!wallet.isSignedIn()) {
  button.textContent = "Login with NEAR";
  q("#about").classList.remove("hide");
  get_all_orders(function () {
    get_simple_art_state(function () { });
    nft_tokens(function () {
      MAIN_DATA_ALREADY_LOADED = true;
    });
  });
  watch_market_sorting();
} else {
  button.classList.add("hide");
  q("#sign-out-button").classList.remove("hide");
  signedInProcess();
  watch_market_sorting();
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
        "initialize_favourited_by",
        "favourite_this_nft",
        "cancel_favourite"
      ]
    });
  }
});

if (window.location.hash != "") {
  HASH_ID = window.location.hash.split("#/")[1];
}

function hashMapper() {
  if (HASH_ID == "stats") {
    get_simple_art_state(function () {
      setTimeout(function () {
        q("#simple-stats").click();
      }, 1);
    });
  } else if (HASH_ID == "about") {
    setTimeout(function () {
      q("#about").click();
    }, 1);
  } else if (HASH_ID == "explore") {
    setTimeout(function () {
      q("#explore").click();
    }, 1);
  } else if (HASH_ID.split("profile/").length > 1) {
    is_loading_external_profile = true;
    get_all_orders(function () {
      nft_tokens(function () {
        nft_tokens_for_owner(HASH_ID.split("profile/")[1], false);
        is_loading_external_profile = false;
        MAIN_DATA_ALREADY_LOADED = true;
      });
    });
    setTimeout(function () {
      q("#my-art").click();
    }, 1);
  } else if (HASH_ID.split("art/").length > 1) {

    launchSpecificNftView(HASH_ID.split("art/")[1]);

  } else if (HASH_ID.split("gallery/").length > 1) {

    load_gallery();

  } else {
    //console.log("Default login");
  }
}

hashMapper();

function load_gallery() {

  is_loading_external_profile = true;
  is_loading_gallery = true;
  get_all_orders(function () {
    nft_tokens(function () {
      nft_tokens_for_owner(HASH_ID.split("gallery/")[1], true);
      is_loading_external_profile = false;
      is_loading_gallery = false;
      MAIN_DATA_ALREADY_LOADED = true;
    });
  });
  setTimeout(function () {
    q("#my-art").click();
  }, 1);

};

function sellSpecificItem(incoming_token_id) {
  let this_nft = get_this_nft_from_id(incoming_token_id);
  //console.log(this_nft);
  let this_price_select = q("#set-price").value.toString();
  let this_price = utils.format.parseNearAmount(this_price_select);
  //console.log(this_price);
  showLoadingScreen(GENERIC_LOADING_MESSAGE);
  update_nft_for_sale(this_nft.id, this_price, function () {
    window.location.reload();
  })
};

function transfer_to_self_wallet_sync(token_id_incoming) {
  if (confirm('This is an advanced function and should only be used one time only by a new user when first purchasing an item! Are you sure you want to proceed? This will re-transfer your nft back to yourself.')) {
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
  cancel_nft_for_sale(this_nft.id, function () {
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

  showLoadingScreen(GENERIC_LOADING_MESSAGE);
  favourite_this_nft(token_id, function () {
    window.location.reload();
  });
};

function launchSpecificUserView(user) {
  is_loading_external_profile = true;
  //console.log(user);
  window.location.hash = "/profile/" + user;
  HASH_ID = window.location.hash;
  if (MAIN_DATA_ALREADY_LOADED) {
    nft_tokens_for_owner(user, false);
  } else {
    get_all_orders(function () {
      nft_tokens(function () {
        nft_tokens_for_owner(user, false);
        is_loading_external_profile = false;
        MAIN_DATA_ALREADY_LOADED = true;
      });
    });
  }
  setTimeout(function () {
    q("#my-art").click();
  }, 1);
};

function launchSpecificBuy(item_id) {
  let get_this_nft = get_this_nft_from_id(item_id);
  let get_this_nft_order = get_this_nft_order_from_id(item_id);

  if (!wallet.isSignedIn()) {
    alert("Need to login first.");
  } else if (get_this_nft.owner_id == wallet._authData.accountId) {
    alert("This is your own NFT.");
  } else {
    showLoadingScreen(GENERIC_LOADING_MESSAGE);
    buy_this_nft_from_owner(item_id, get_this_nft_order.price_for_sale, function () {
      console.log("Bought this nft.");
    })
  }
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

function signedInProcess() {
  q("#title").innerHTML = wallet._authData.accountId.split(NEAR_NETWORK_NAME)[0];
  q("#intro-container").classList.add("not-max");
  //q("#explore").classList.add("hide");
  q("#my-art").classList.remove("hide");
  q("#my-gallery-view").classList.remove("hide");
  q("#create-art").classList.remove("hide");
  q("#about").classList.add("hide");
  q("#simple-stats").classList.remove("hide");

  get_simple_art_state(function () { });
  get_all_orders(function () {
    nft_tokens(function () {
      MAIN_DATA_ALREADY_LOADED = true;
    });
  });

  function generate_nft_canvas() {
    for (var k = 0; k < 900; k++) {
      q("#nft-canvas").innerHTML += '<div class="pixel" data-id="' + k + '"></div>';
      q("#nft-renderer").innerHTML += '<div class="sm-pixel" data-id="' + k + '"></div>';
    }
  };

  generate_nft_canvas();
  watch_nft_canvas();
};

function watch_market_sorting() {
  if (!SET_MARKET_SORT_WATCHERS_ONCE) {
    SET_MARKET_SORT_WATCHERS_ONCE = true;
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

    q("#favourites-sort").addEventListener("click", function () {
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
    } else if (sort_by == ".likes-count-for-sort") {
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

function watch_nft_canvas() {
  q("#eraser-selector").addEventListener("click", function () {
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
  let avatar_canvas = document.querySelector("#nft-canvas");
  for (var i = 0; i < avatar_canvas.children.length; i++) {
    avatar_canvas.children[i].addEventListener('click', function (event) {
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
    });


    avatar_canvas.children[i].addEventListener('mouseover', function (event) {
      //event.target.style.backgroundColor = q("#colour-selector").value;
      if (IS_PAINT_SELECTED) {
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

  q("#mint-character-button").addEventListener("click", function () {
    if (IS_PROCESSING_MINT) {

    } else {
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
  });
};

function initialize_simple_art() {
  contract.initialize_simple_art({})
    .then(result => {
      console.log(result);
    });
};

function initialize_favourited_by() {
  contract.initialize_favourited_by({})
    .then(result => {
      console.log(result);
    });
};

function get_simple_art_state(callback) {
  contract.get_simple_art_state({})
    .then(result => {
      ART_STATE = result[0];
      q("#art-state").innerHTML = + ART_STATE.mint_count + "/" + 10000;
      callback();
    });
};

function nft_tokens(callback) {
  contract.nft_tokens({ from_index: "0", limit: 1000 })
    .then(result => {
      NFT_TOKENS = result;
      IS_SORTED_MINTS_ALREADY = true;
      q("#mint-ids-sort-market").innerHTML = "Mint &#x2193;";
      q("#nft-items").innerHTML = buildNftList();
      callback();
    });
};

function nft_total_supply() {
  contract.nft_total_supply({})
    .then(result => {
      console.log(result);
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
    if (ALL_ORDERS[i].favourited_by_users.includes(owner_to_check)) {
      MY_LIKED_COUNT++;
      let get_this_liked_nft = get_this_nft_from_id(ALL_ORDERS[i].token_id);
      html_builder += '<div class="nft-item">';
      html_builder += '<div class="nft-description">' + sanitize(get_this_liked_nft.metadata.description) + '</div>';
      html_builder += '<img class="nft-image" onclick="launchSpecificNftView(\'' + get_this_liked_nft.id + '\')" src="' + get_this_liked_nft.metadata.media + '">';
      html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + get_this_liked_nft.owner_id + '\')">&#x265F; ' + get_this_liked_nft.owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
      html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + ALL_ORDERS[i].favourited_by_users.length + ' likes</div></div>';

      if (!ALL_ORDERS[i].forSale) {
        html_builder += '<div class="not-for-sale">Not for sale</div>';
      } else {
        html_builder += '<div onclick="launchSpecificBuy(\'' + get_this_liked_nft.id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(ALL_ORDERS[i].price_for_sale) + ' N</div>';
      }

      if (wallet.isSignedIn()) {
        html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + get_this_liked_nft.id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
      }

      html_builder += '</div>';
    }

  }
  return html_builder;
};

function buildMyCreationsList(owner_to_check, is_gallery) {
  let html_builder = "";
  for (var i = 0; i < ALL_ORDERS.length; i++) {

    if (ALL_ORDERS[i].original_creator == owner_to_check) {
      MY_CREATIONS_COUNT++;
    }

    if (ALL_ORDERS[i].original_creator === owner_to_check) {
      let get_this_nft = get_this_nft_from_id(ALL_ORDERS[i].token_id);
      html_builder += '<div class="nft-item">';
      html_builder += '<div class="nft-description">' + sanitize(get_this_nft.metadata.description) + '</div>';


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
    html_builder += '<div class="nft-item">';
    html_builder += '<div class="nft-description">' + sanitize(MY_NFTS[i].metadata.description) + '</div>';

    let get_this_nft = get_this_nft_from_id(MY_NFTS[i].id);
    let get_this_nft_order = get_this_nft_order_from_id(MY_NFTS[i].id);

    if (get_this_nft.metadata.media != "") {
      html_builder += '<img class="nft-image" onclick="launchSpecificNftView(\'' + MY_NFTS[i].id + '\')" src="' + get_this_nft.metadata.media + '">';
    }

    if (!is_gallery) {
      html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + get_this_nft.owner_id + '\')">&#x265F; ' + get_this_nft.owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
      html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + get_this_nft_order.favourited_by_users.length + ' likes</div></div>';


      if (!get_this_nft_order.forSale) {
        html_builder += '<div class="not-for-sale">Not for sale</div>';
      } else {
        html_builder += '<div onclick="launchSpecificBuy(\'' + MY_NFTS[i].id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(get_this_nft_order.price_for_sale) + ' N</div>';
      }
      if (wallet.isSignedIn()) {
        if (!get_this_nft_order.favourited_by_users.includes(wallet._authData.accountId)) {
          html_builder += '<div onclick="launchSpecificFavourite(\'' + MY_NFTS[i].id + '\')" class="favourite-this-item">Like</div>';
        } else {
          // html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + MY_NFTS[i].id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
        }
      }

    }



    html_builder += '</div>';
  }
  return html_builder;
}

function buildNftList() {
  let html_builder = "";
  for (var i = 0; i < NFT_TOKENS.length; i++) {
    let get_this_nft_order = get_this_nft_order_from_id(NFT_TOKENS[i].id);

    html_builder += '<div data-for-sale="' + get_this_nft_order.forSale + '" class="nft-item">';

    html_builder += '<div class="mint-ids hide">' + NFT_TOKENS[i].id + '</div>';
    html_builder += '<div class="likes-count-for-sort hide">' + get_this_nft_order.favourited_by_users.length + '</div>';


    let price_to_use_for_sort = !get_this_nft_order.forSale ? 0 : parseFloat(utils.format.formatNearAmount(get_this_nft_order.price_for_sale));
    html_builder += '<div class="market-price hide">' + price_to_use_for_sort + '</div>';

    html_builder += '<div class="nft-description">' + sanitize(NFT_TOKENS[i].metadata.description) + '</div>';
    if (NFT_TOKENS[i].metadata.media != "") {
      html_builder += '<img onclick="launchSpecificNftView(\'' + NFT_TOKENS[i].id + '\')" class="nft-image" src="' + NFT_TOKENS[i].metadata.media + '">';
    }
    html_builder += '<div class="owner-link-item"><div class="owner-link" onclick="launchSpecificUserView(\'' + NFT_TOKENS[i].owner_id + '\')">&#x265F; ' + NFT_TOKENS[i].owner_id.split(NEAR_NETWORK_NAME)[0] + '</div></div>';
    html_builder += '<div class="owner-link-item"><div class="likes-display-count">' + get_this_nft_order.favourited_by_users.length + ' likes</div></div>';

    if (!get_this_nft_order.forSale) {
      html_builder += '<div class="not-for-sale">Not for sale</div>';
    } else {
      html_builder += '<div onclick="launchSpecificBuy(\'' + NFT_TOKENS[i].id + '\')" class="is-for-sale">Buy for ' + utils.format.formatNearAmount(get_this_nft_order.price_for_sale) + ' N</div>';
    }

    if (wallet.isSignedIn()) {
      if (!get_this_nft_order.favourited_by_users.includes(wallet._authData.accountId)) {
        html_builder += '<div onclick="launchSpecificFavourite(\'' + NFT_TOKENS[i].id + '\')" class="favourite-this-item">Like</div>';
      } else {
        //html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + NFT_TOKENS[i].id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
      }
    }


    html_builder += '</div>';
  }
  return html_builder;
};

function generateStats() {
  let html_builder = "";
  html_builder += '<ul class="stats-list">';
  html_builder += '<li>Creations Minted: <b>' + ART_STATE.mint_count + '</b></li>';
  html_builder += '<li >Donation cost: <b>' + utils.format.formatNearAmount(ART_STATE.mint_donation_cost) + ' N</b></li>';
  html_builder += '<li>System Earned: <b>' + utils.format.formatNearAmount(ART_STATE.system_earned) + ' N</b></li>';
  html_builder += '<li >Market Volume Total: <b>' + utils.format.formatNearAmount(ART_STATE.market_volume) + ' N</b></li>';
  html_builder += '<li>Unique Artist Count: <b>' + ART_STATE.artist_count + '</b></li>';
  html_builder += '<li>Artist Royalties Earned: <b>' + utils.format.formatNearAmount(ART_STATE.creators_royalties_earned) + ' N</b></li>';

  html_builder += '<li>System Royalty: <b>' + ART_STATE.market_royalty_percent + ' %</b></li>';
  html_builder += '<li>Artist Royalty: <b>' + ART_STATE.creator_royalty_percent + ' %</b></li>';


  html_builder += '</ul>';
  return html_builder;
};


function build_this_nft_view() {
  let get_this_nft_order = get_this_nft_order_from_id(CURRENT_NFT_IN_VIEW.id);

  let html_builder = "";
  html_builder += '<div class="nft-item">';
  html_builder += '<div class="nft-description">' + sanitize(CURRENT_NFT_IN_VIEW.metadata.description) + '</div>';
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
  if (!get_this_nft_order.favourited_by_users.includes(wallet._authData.accountId)) {
    html_builder += '<div onclick="launchSpecificFavourite(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="favourite-this-item">Like</div>';
  } else {
    html_builder += '<div onclick="launchSpecificCancelFavourite(\'' + CURRENT_NFT_IN_VIEW.id + '\')" class="favourite-this-item remove-favourite">Remove Like</div>';
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
  html_builder += '<div class="for-sale-history">' + CURRENT_NFT_IN_VIEW.metadata.title + ' history</div>';

  html_builder += '<ul class="history-list">';


  for (let i = get_this_nft_order.history_action_type.length; i > -1; i--) {
    if (get_this_nft_order.history_action_type[i] == "mint") {
      html_builder += '<li><div class="history-display-first">&#128396; Minted by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0] + '</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
    } else if (get_this_nft_order.history_action_type[i] == "list") {
      html_builder += '<li><div class="history-display-first">&#x1F4B8; Listed for ' + utils.format.formatNearAmount(get_this_nft_order.history_price[i]) + ' N </div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
    } else if (get_this_nft_order.history_action_type[i] == "buy") {
      html_builder += '<li><div class="history-display-first">&#128176; Purchased by <b>' + get_this_nft_order.history_owner_acted[i].split(NEAR_NETWORK_NAME)[0] + '</b></div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
    } else if (get_this_nft_order.history_action_type[i] == "cancel") {
      html_builder += '<li><div class="history-display-first">&#x2612; Cancelled listing</div><div class="history-display-hover hide">' + (new Date(parseInt(get_this_nft_order.history_timestamp[i]) / 1000000)).toUTCString() + '</div></li>';
    }
  }

  html_builder += '</ul>';
  html_builder += '<ul class="history-list dotted-top"><li>&#128176; Royalties earned: <b>' + utils.format.formatNearAmount(get_this_nft_order.this_order_royalties_earned) + ' N</b></li></ul>';

  if (CURRENT_NFT_IN_VIEW.owner_id == wallet._authData.accountId) {
    html_builder += '<div onclick="transfer_to_self_wallet_sync(\'' + CURRENT_NFT_IN_VIEW.id + '\')"  class="sync-this-item">&#x2699; Advanced - Sync with wallet collectables</div>';
  }
  html_builder += '</div>';

  return html_builder;
}
function get_all_users() {
  contract.get_all_users({})
    .then(result => {
      console.log(result);
    });
};
function get_all_orders(callback) {
  contract.get_all_orders({})
    .then(result => {
      //console.log(result);
      ALL_ORDERS = result;
      callback();
    });
};
function nft_supply_for_owner() {
  contract.nft_supply_for_owner({ account_id: wallet._authData.accountId })
    .then(result => {
      console.log(result);
    });
};
function nft_tokens_for_owner(owner_to_check, is_gallery) {
  contract.nft_tokens_for_owner({ account_id: owner_to_check, from_index: "0", limit: 1000 })
    .then(result => {
      //console.log(result);
      MY_NFTS = result;
      //console.log(MY_NFTS);
      q("#my-nft-items").innerHTML = buildMyNftList(is_gallery);

      if (!is_gallery) {
        q("#my-creations-title").classList.remove("hide");
        q("#my-nft-creations").classList.remove("hide");
        q("#my-creations-count").classList.remove("hide");
        q("#my-favourites-title").classList.remove("hide");
        q("#my-nft-creations").innerHTML = buildMyCreationsList(owner_to_check, is_gallery);
      } else {
        q("#my-creations-title").classList.add("hide");
        q("#my-nft-creations").classList.add("hide");
        q("#my-creations-count").classList.add("hide");
        q("#my-favourites-title").classList.add("hide")
        q("#my-nft-favourites").classList.add("hide");
      }
      //console.log("My creations count: " + MY_CREATIONS_COUNT);
      /*if (MY_CREATIONS_COUNT != 0) {
        q("#my-creations-count").innerHTML = "Created " + MY_CREATIONS_COUNT;
      } else {
        q("#my-creations-count").innerHTML = "No minted NFTs yet!";
      }*/
      if (!is_gallery) {
        q("#my-nft-favourites").innerHTML = buildMyLikedList(owner_to_check);
        /*if (MY_LIKED_COUNT != 0) {
          q("#my-favourites-count").innerHTML = "Liked " + MY_LIKED_COUNT;
        } else {
          q("#my-favourites-count").innerHTML = "No liked NFTs yet!";
        }*/
      }

      /*if (!is_gallery){
        if (MY_NFTS.length == 0) {
          q("#my-count").innerHTML = NO_ITMES_IN_COLLECTION;
        } else {
          q("#my-count").innerHTML = "Collection of " + MY_NFTS.length;
        }
      }*/

      MY_LIKED_COUNT = 0;
      MY_CREATIONS_COUNT = 0;

    }).catch(function (error) {
      console.log(error);
      q("#my-creations-title").classList.add("hide");
      q("#my-count").innerHTML = NO_ITMES_IN_COLLECTION;
      q("#my-creations-title").classList.add("hide");
      q("#my-nft-creations").classList.add("hide");
      q("#my-creations-count").classList.add("hide");
    });
};

function nft_metadata() {
  contract.nft_metadata({})
    .then(result => {
      console.log(result);
    });
};
function nft_token(incoming_token_id) {
  contract.nft_token({ token_id: incoming_token_id })
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
  contract.update_nft_token({ token_id: incoming_token_id, description: incoming_description })
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
  dom2image(q("#nft-renderer"), function (dataUrl) {
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
  let description_to_use = sanitize(q("#new-nft-description").value);

  let to_submit = {
    "accountId": wallet._authData.accountId,
    "pubkey": pubKey,
    "signature": signature,
    "token_id": (parseInt(ART_STATE.mint_count) + 1),
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
        let new_metadata = generateMetadata(((parseInt(ART_STATE.mint_count))), q("#new-nft-description").value, metadata_url_received, image_media_url)
        //console.log("Final metadata to post");
        //console.log(new_metadata);



        contract.nft_mint({ token_id: ART_STATE.mint_count, metadata: new_metadata, receiver_id: wallet._authData.accountId }, GAS_TO_ATTACH, ART_STATE.mint_donation_cost)
          .then(result => {
            console.log(result);
            callback();
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
  contract.nft_transfer({ receiver_id: incoming_receiver_id, token_id: incoming_token_id })
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
  contract.cancel_nft_for_sale({ token_id: incoming_token_id })
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