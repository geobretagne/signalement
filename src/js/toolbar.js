Ext.namespace("Signalement");

Signalement.toolbar = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;
    
    var actions = null;   
    
    var loginUrl = null;
    
    var logoutUrl= null;
    
    var connection = false;    
    
    var username = null;
    
    var helpurl = null;
    
    
    
    
    var connectCas = function (){
      var params = extractUrlParams();
      if (params['ticket']){
        OpenLayers.Request.GET({
              url: 'https://geobretagne.fr/cas/serviceValidate?ticket=' + params['ticket']+'&service=http://dev.geobretagne.fr/signalement/',
              success: connectResponse,
              failure: function(){alert("impossible de se connecter au service de validation");} 
            });
      }

    };

    var connectResponse = function (response) {
    alert(response);
    };
    
    var createTbarItems = function(map) {
            actions = [];
            actions.push(new GeoExt.Action({
                iconCls: "pan",
                map: map,
                id:"xxx",
                pressed: true,
                toggleGroup: "tools",
                allowDepress: false,
                tooltip: "Glisser - déplacer la carte",
                control: new OpenLayers.Control.Navigation()
            }));    
            actions.push(new GeoExt.Action({
                iconCls: "zoomin",
                map: map,
                toggleGroup: "tools",
                allowDepress: false,
                tooltip: "Zoom sur l'emprise",
                control: new OpenLayers.Control.ZoomBox({
                out: false
                })
            }));
            
            
       
       /* var login_html = '<div style="margin-right:1em;font:11px tahoma,verdana,helvetica;"><a href="' + loginUrl  +
          '" style="text-decoration:none;">Connexion</a></div>';
        if(connection == true) {
          login_html = '<div style="margin-right:1em;font:11px tahoma,verdana,helvetica;">'+ username + '&nbsp;<a href="' + logoutUrl +
            '" style="text-decoration:none;">déconnexion</a></div>';
        }
        actions.push(Ext.DomHelper.append(Ext.getBody(), login_html));
        actions.push('-');
        actions.push(new Ext.Toolbar.Spacer());
        actions.push(new Ext.Toolbar.Separator());
        actions.push(new Ext.Toolbar.Spacer());*/
       
        return actions;
      };

   
   

    return {
        /*
         * Public
         */


        /**
         * APIMethod: create
         * 
         * APIMethod: create         
         * Parameters:
         * m - {OpenLayers.Map} The map instance.
         */

        create: function (m, config) {
            map = m;
            helpurl = config.helpurl.url
    
            loginUrl = config.login.url;
            logoutUrl = config.logout.url;                      
            return createTbarItems(map);
        }
       
    }
})();