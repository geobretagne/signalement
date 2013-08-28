Ext.namespace("Signalement");

Signalement.workflow = (function () {

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
            
            var workflowForm = new Ext.FormPanel({        
                fileUpload: true,
                width: 320,
                frame: true,
                iconCls:'workflow',
                title: 'Worflow',                
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
                    id: 'workflowcsv',
                    emptyText: 'Sélectionnez un fichier csv',
                    fieldLabel: 'fichier',
                    name: 'workflowcsv',
                    buttonText: '',
                    buttonCfg: {
                        iconCls: 'upload-icon'
                    }
                }],
                buttons: [{
                    text: 'Transférer',
                    handler: function(){
                        if(workflowForm.getForm().isValid()){
                          workflowForm.getForm().submit({                           
                                url: phplocation + 'workflow.php',
                                waitMsg: 'Transfert du fichier et traitement...',            
                                success: function(frm, o){                                                    
                                    Signalement.main.showMsg("Succès", o.result.message);                            
                              },
                    failure:function(workflowForm, o){              
                              Signalement.main.showMsg('Erreur', o.result.message);
                              }
                          });
                        }
                    }
                },{
                    text: 'Rétablir',
                    handler: function(){
                        workflowForm.getForm().reset();
                    }
                },
            {
                    text: 'Télécharger un exemple',
                    tooltip: 'Télécharger un fichier exemple',
                    handler: function(){
                        window.open("imports/workflow.zip");
                    }
                }
            ]
        });
            
      
            return workflowForm;
        }
    }
})();