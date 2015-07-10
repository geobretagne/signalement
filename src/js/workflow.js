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
                title: 'Signaler comme traité',                
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
                    buttonText: 'Ouvrir',
                    //buttonCfg: {
                    //    iconCls: 'upload-icon'
                    //}
                }],
                buttons: [{
                    text: 'Transférer',
                    handler: function(){
                        if(workflowForm.getForm().isValid()){
                          workflowForm.getForm().submit({                           
                                url: 'ws/workflow.php',
                                waitMsg: 'Transfert du fichier et traitement...',            
                                success: function(frm, o){                                                    
		publication(o.result.acteur,o.result.idsignal);
		Ext.MessageBox.hide();
		setTimeout(function(){layer.refresh({force: true});Signalement.main.showMsg('Succès !', o.result.message);},3000);
                              },
                    failure:function(workflowForm, o){              
                              Signalement.main.showMsg('Erreur', o.result.message);Ext.MessageBox.hide();
                              }
                          });
//fonction qui marque les signalements comme "traités".
// acteur = organisme public qui a traité les signalements (CUS / CAC / ...)
// idsignal = chaine de texte généré par le PHP workflow.php, qui contient les informations des signalements traités.
function publication(acteur,idsignal) 
{
//reconstitution du filtre par idsignal :  <ogc:FeatureId fid="signalement_adresse.2543"/>	
var idsignald = idsignal.replace(/DOWN/g,'<ogc:FeatureId fid="signalement_adresse.');
var idsignalud = idsignald.replace(/UP/g,'"/>');

var params = '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" service="WFS" version="1.1.0" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><wfs:Update typeName="cigal_edit:signalement_adresse" xmlns:cigal_edit="https://www.cigalsace.org/geoserver/cigal_edit/">'
+ '<wfs:Property><wfs:Name>'+'t_'+ acteur +'</wfs:Name><wfs:Value>'
+ true
+ '</wfs:Value></wfs:Property><ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">'
+ idsignalud
+ '</ogc:Filter></wfs:Update></wfs:Transaction>';


var requetehttppost = new XMLHttpRequest();
var url = "https://www.cigalsace.org/geoserver/cigal_edit/wfs";



requetehttppost.open("POST", url, true);
requetehttppost.setRequestHeader("Content-type", " application/xml; charset=UTF-8");
requetehttppost.setRequestHeader("Referer", "https://www.cigalsace.org/signalement/");
requetehttppost.setRequestHeader("Authorization", "Basic c2lnbmFsZW1lbnQ6c2lnbmFsZW1lbnQ="); //authentification signalement signalement codée en base64
requetehttppost.setRequestHeader("Accept-Language", "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3");
requetehttppost.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
requetehttppost.setRequestHeader("Host", "www.cigalsace.org");

requetehttppost.send(params);

workflowForm.getForm().reset(); //efface le fichier Ouvert dans le formulaire
}
//..............................................................................//						  

                        }
                    }
                },
                {
                    text: 'Télécharger un exemple',
                    tooltip: 'Télécharger un fichier exemple',
                    handler: function(){
                        window.open("traitements/cus_vu.txt");
                    }
                }
            ]
        });
            
      
            return workflowForm;
        }
    }
})();
