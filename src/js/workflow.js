/*
 * 
 * This file is part of signalement
 *
 * signalement is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with signalement.  If not, see <http://www.gnu.org/licenses/>.
 */
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
                    emptyText: 'Sélectionnez un fichier txt',
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
                },
                {
                    text: 'Télécharger un exemple',
                    tooltip: 'Télécharger un fichier exemple',
                    handler: function(){
                        window.open("traitements/operateur-date.txt");
                    }
                }
            ]
        });
            
      
            return workflowForm;
        }
    }
})();