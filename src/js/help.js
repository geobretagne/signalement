Ext.namespace("Signalement");

Signalement.help = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    //var map = null;   
    
    var toolbar = null;
    
    
   

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

        create: function (helpurl,tb) {
            toolbar = tb;
            toolbar.addItem({
                text: "Aide",
                tooltip: "Afficher l'aide",
                handler: function() {
                    if(Ext.isIE) {
                        window.open(helpurl);
                    } else {
                        window.open(helpurl, "Aide de l'outil", "menubar=no,status=no,scrollbars=yes");
                    }
                    }
                });            
           
        }
    }
})();