Ext.namespace("Signalement");

Signalement.importer = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;
    
    var layer = null;
    
    var phplocation = null;
    
    

   var highlight = function (importvalue) {
       layer.events.unregister("loadend",null,showhi);
         
       var importedFeatures = layer.getFeaturesByAttribute('import',importvalue);    
       
      layer.selectedFeatures = importedFeatures;
       
      var bounds = importedFeatures[0].geometry.getBounds().clone();
       
      for(var i=0;i<importedFeatures.length;i++)
      {
        bounds.extend(importedFeatures[i].geometry.getBounds());    
        layer.drawFeature(importedFeatures[i],"temporary");
      }

      map.zoomToExtent(bounds,false);   

    };

    var showhi = function (o){
      highlight(o.result.import1);
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

        create: function (m,l, phploc) {
            map = m;
            layer = l;
            phplocation = phploc;
            
            var csvUploadForm = new Ext.FormPanel({        
                fileUpload: true,
                width: 320,
                frame: true,
            iconCls:'import',
                title: 'Import de données',
                //autoHeight: true,
                bodyStyle: 'padding: 10px 10px 0 10px;',
                labelWidth: 60,
                defaults: {
                    anchor: '95%',
                    allowBlank: false,
                    msgTarget: 'side'
                },
                items: [
            {
                    xtype: 'fileuploadfield',
                    id: 'lefichiercsv',
                    emptyText: 'Sélectionnez un fichier csv',
                    fieldLabel: 'fichier',
                    name: 'lefichiercsv',
                    buttonText: '',
                    buttonCfg: {
                        iconCls: 'upload-icon'
                    }
                }],
                buttons: [{
                    text: 'Transférer',
                    handler: function(){
                        if(csvUploadForm.getForm().isValid()){
                          csvUploadForm.getForm().submit({
                            //url: '../proxy/?url=http://kartenn.region-bretagne.fr/signalement/ws/import.php',
                  url: phplocation + 'import.php',
                              waitMsg: 'Transfert du fichier et traitement...',            
                              success: function(frm, o){
                                layer.events.register("loadend",null,function(){highlight(o.result.import1)});
                                layer.refresh({force: true});                      
                                Signalement.main.showMsg("Succès", o.result.message);                  
                          
                              },
                    failure:function(csvUploadForm, o){              
                              Signalement.main.showMsg('Erreur', o.result.message);
                              }
                          });
                        }
                    }
                },{
                    text: 'Rétablir',
                    handler: function(){
                        csvUploadForm.getForm().reset();
                    }
                },
            {
                    text: 'Télécharger un exemple',
              tooltip: 'Télécharger un fichier exemple',
                    handler: function(){
                        window.open("imports/exemple.zip");
                    }
                }
            ]
        });
            
      
            return csvUploadForm;
        }
    }
})();