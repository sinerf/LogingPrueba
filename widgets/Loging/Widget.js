define(['dojo/_base/declare',
    'jimu/BaseWidget',
    'esri/arcgis/Portal',
    'esri/arcgis/OAuthInfo',
    'esri/IdentityManager',
    'dojo/dom-style',
    'dojo/dom-attr',
    'dojo/dom',
    'dojo/on',
    'dojo/_base/array',
    'dojo/domReady!',
    'dojo/_base/lang'
  ],
  function(declare, BaseWidget, arcgisPortal, OAuthInfo, esriId,
    domStyle, domAttr, dom, on, arrayUtils, lang) {
    var info, portal, queryParams;
    var m_clickSignIn, m_clickSignOut;
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {

      // Custom widget code goes here

      baseClass: 'Loging',

      //this property is set by the framework when widget is loaded.
      //name: 'CustomWidget',


      //methods to communication with app container:

      postCreate: function() {
        info = new OAuthInfo({
          appId: "QscoTvCQ6b5cbBim",
          // Uncomment the next line and update if using your own portal
          // portalUrl: "https://<host>:<port>/arcgis",
          // Uncomment the next line to prevent the user's signed in state from being shared
          // with other apps on the same domain with the same authNamespace value.
          //authNamespace: "portal_oauth_inline",
          popup: true
        });
        console.log('postCreate');
        console.log(info);
        esriId.registerOAuthInfos([info]);
        esriId.checkSignInStatus(info.portalUrl + "/sharing").then(this.displayItems).otherwise(
          function() {
            // Anonymous view
            domStyle.set("anonymousPanel", "display", "block");
            domStyle.set("personalizedPanel", "display", "none");
          });
      },

      // startup: function() {
      //  this.inherited(arguments);
      //  this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      //  console.log('startup');
      // },

      onOpen: function() {
        console.log('onOpen');
        m_clickSignIn = on(dom.byId("sign-in"), "click", function() {
          console.log("click", arguments);
          // user will be redirected to OAuth Sign In page
          esriId.getCredential(info.portalUrl + "/sharing", {
            oAuthPopupConfirmation: false
          }).then(this.displayItems);
        });

        m_clickSignOut = on(dom.byId("sign-out"), "click", this.LogOut);
      },

      // onClose: function(){
      //   console.log('onClose');
      // },

      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      onSignIn: function(credential) {
        /* jshint unused:false*/
        console.log('onSignIn');
      },

      onSignOut: function() {
        console.log('onSignOut');
      },

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }

      //methods to communication between widgets:
      LogOut: function() {
        esriId.destroyCredentials();
        window.location.reload();
      },

      displayItems: function() {
        new arcgisPortal.Portal(info.portalUrl).signIn().then(
          function(portalUser) {
            console.log("Signed in to the portal: ", portalUser);
            domAttr.set("userId", "innerHTML", portalUser.fullName);
            domStyle.set("anonymousPanel", "display", "none");
            domStyle.set("personalizedPanel", "display", "block");
            var portal = portalUser.portal;
            var queryParams = {
              q: "owner:" + portalUser.username,
              sortField: "numViews",
              sortOrder: "desc",
              num: 20
            };
            portal.queryItems(queryParams).then(function(items) {
              var htmlFragment = "";

              arrayUtils.forEach(items.results, function(item) {
                htmlFragment += (
                  "<div class=\"esri-item-container\">" +
                  (
                    item.thumbnailUrl ?
                    "<div class=\"esri-image\" style=\"background-image:url(" + item.thumbnailUrl + ");\"></div>" :
                    "<div class=\"esri-image esri-null-image\">Thumbnail not available</div>"
                  ) +
                  (
                    item.title ?
                    "<div class=\"esri-title\">" + (item.title || "") + "</div>" :
                    "<div class=\"esri-title esri-null-title\">Title not available</div>"
                  ) +
                  "</div>"
                );
              });
              dom.byId("itemGallery").innerHTML = htmlFragment;
            });
          }
        ).otherwise(
          function(error) {
            console.log("Error occurred while signing in: ", error);
          }
        );
      },


      // queryPortal: function(portalUser) {
      //   var portal = portalUser.portal;
      //
      //   //See list of valid item types here:  http://www.arcgis.com/apidocs/rest/index.html?itemtypes.html
      //   //See search reference here:  http://www.arcgis.com/apidocs/rest/index.html?searchreference.html
      //   var queryParams = {
      //     q: "owner:" + portalUser.username,
      //     sortField: "numViews",
      //     sortOrder: "desc",
      //     num: 20
      //   };
      //   this.portal.queryItems(this.queryParams).then(this.createGallery);
      // },

      // createGallery: function(items) {
      //   var htmlFragment = "";
      //
      //   arrayUtils.forEach(items.results, function(item) {
      //     htmlFragment += (
      //       "<div class=\"esri-item-container\">" +
      //       (
      //         item.thumbnailUrl ?
      //         "<div class=\"esri-image\" style=\"background-image:url(" + item.thumbnailUrl + ");\"></div>" :
      //         "<div class=\"esri-image esri-null-image\">Thumbnail not available</div>"
      //       ) +
      //       (
      //         item.title ?
      //         "<div class=\"esri-title\">" + (item.title || "") + "</div>" :
      //         "<div class=\"esri-title esri-null-title\">Title not available</div>"
      //       ) +
      //       "</div>"
      //     );
      //   });
      //   dom.byId("itemGallery").innerHTML = htmlFragment;
      // }

    });
  });
