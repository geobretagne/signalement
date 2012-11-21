Ext.namespace("Signalement");

Signalement.parametrage = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    //var map = null;   
   

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

        create: function (url) {
        
        
            var myButton = new Ext.Button({
              text    : 'Générer',
              tooltip: "Générer l' url de l'affichage actuel",
              handler : function() {
              Ext.getCmp("permatext").setValue(Signalement.mainmap.getMapProperties());
              Ext.getCmp("permatext").setVisible(true);
               
              } 
            });
            
            var textArea = new Ext.form.TextArea({
            id:'permatext',
            bodyStyle:'padding: 4px',
            width:"100%",
            hidden:true
            
            });
            
            var permaPanel = new Ext.Panel({                
                frame: true,
                split:true,
                //layout:'border',                
                items:[myButton,textArea]

            });
            
            var paramPanel = new Ext.Panel({
                title: 'Paramétrage',
                frame: true,
                iconCls:'tool',
                html: "<b>Cette boîte à outil permet de générer l'adresse correspondant à l'affichage actuel (cadrage, fond cartographique)</b>",                 
                items:[permaPanel]
              });
      
            return paramPanel;
        }
    }
})();