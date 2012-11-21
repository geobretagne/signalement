Ext.namespace("Signalement");

Signalement.download = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;
    
    var wfsurl = null;
    
    var kmlurl = null;
    
    var metadataurl = "http://geobretagne.fr/geonetwork/srv/fr/metadata.show?uuid=58e7b791-8495-47df-819f-0660fb8d8645";
    
    
    
    var downloadFile = function (format) {  
      switch(format) {
              case "kml":
          window.open(kmlurl, "_blank");
          break;
          default:
            window.open(wfsurl + "&outputFormat=" + format, "_blank");
           
        }
        window.open(metadataurl, "Métadonnées");
          
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

        create: function (config) {
        
        wfsurl = config.wfsurl + "request=getFeature&typename=" +config.featureprefix +":" +config.featuretype;
        
        kmlurl = config.kmlurl;
                        
      var downloadformatData = [['CSV','csv (Lambert 93)'],['SHAPE-ZIP','shape (Lambert 93)'],['GML3','gml (Lambert 93)'],['kml','kml (WGS84)']];
  
              var downloadformatStore = new Ext.data.SimpleStore({
                        fields: ['value','text'],
                        data : downloadformatData
                    });
              var downloadCombo = new Ext.form.ComboBox({
                        id : 'cb_format',
                  listWidth: 167,
                        fieldLabel: 'Format',
                        store: downloadformatStore,
                        valueField: 'value',      
                        displayField:'text',
                        editable: false,
                        mode: 'local',
                  allowBlank:false,
                  emptyText:'Format ...',
                        triggerAction: 'all'
                  
                    });
                    
                
                    
                
                    
               var downloadForm = new Ext.form.FormPanel({
                    title: 'Téléchargement',    
                    id: 'downloadForm',
                    frame:true,
                    monitorValid:true,
                    labelWidth: 100,
                    bodyStyle:'padding:5px 5px 0',
                    width: 320,
                    //height: 300,
                    defaults: {width: 150},        
                    iconCls:'save',
                    items: [downloadCombo],
                    buttons:[
                        {
                          iconCls: "save",
                          text: "Télécharger",
                          tooltip: "Télécharger la couche signalement dans le format de votre choix",
                          formBind:true,
                          handler : function(){  
                           downloadFile(Ext.getCmp('cb_format').getValue());
                          }
                        }
                      
                      
                  ]});
                  
            return downloadForm;
        }
    }
})();