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
            
var epsgData = [
				['EPSG:2154','Lambert 93'],
				['EPSG:3948', 'CC48'],
				['EPSG:3857', 'WGS84 Web Mercator'],
				['EPSG:4326', 'WGS84']
//				,['EPSG:27572', 'Lambert II étendu']
            ];
			
			var epsgStore = new Ext.data.SimpleStore({
			fields: ['epsg', 'name'],
			data: epsgData
			});
						
			epsgCombo = new Ext.form.ComboBox({
                id: 'epsgcombo',
                //width: 95,
				listWidth: 160,
                fieldLabel: 'EPSG',
				emptyText: 'Sélectionnez un système de projection',
                store: epsgStore,
                valueField: 'epsg',
                displayField: 'name',
                editable: false,
                mode: 'local',
                triggerAction: 'all'
            });
            
            var csvUploadForm = new Ext.FormPanel({        
                fileUpload: true,
                width: 320,
                frame: true,
            iconCls:'import',
                title: 'Importer des signalements',
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
                    fieldLabel: 'Fichier',
                    name: 'lefichiercsv',
                    buttonText: 'Ouvrir',
                    //buttonCfg: {
                       // iconCls: 'upload-icon'
                    //}
                },epsgCombo],
                buttons: [{
                    text: 'Transférer',
                    handler: function(){
                        if(csvUploadForm.getForm().isValid() && epsgCombo!==""){
                          csvUploadForm.getForm().submit({
                           url: 'ws/import.php?epsg='+epsgCombo.value,  //etape0
                              waitMsg: 'Publication de vos signalements', 
                              waitTitle: 'En cours',
                              success: function(frm, o){
transfert=true;								
layer.events.register("loadend",null,function(){highlight(o.result.import1)});                    
publication(o.result.import1); Ext.MessageBox.hide(); //étape 1
setTimeout(function(){layer.refresh({force: true});Signalement.main.showMsg('Succès !', o.result.message);},2000); //etape 2 => 2 secondes accordées à étape1
               
                          
                              },
                    failure:function(csvUploadForm, o){              
                              Signalement.main.showMsg('Echec !', o.result.message);
                              Ext.MessageBox.hide();
                              }
                          });
//...........Fonctions de lecture du fichier txt et publication des nouveaux signalements............//
function lire(fichier)
{
if(window.XMLHttpRequest) obj = new XMLHttpRequest(); //Pour Firefox, Opera,...
else if(window.ActiveXObject) obj = new ActiveXObject("Microsoft.XMLHTTP"); //Pour Internet Explorer 
else return(false);
if (obj.overrideMimeType) obj.overrideMimeType("text/xml"); //Évite un bug de Safari
obj.open("GET", fichier, false);
obj.send(null);
if(obj.readyState == 4) return(obj.responseText);
else return(false);
}
//...............Fonction qui envoie une requête POST au serveur. Le corps de la requête est stocké dans un fichier texte du repertoire ./xml_out/.............	
function publication(lesinsert) 
{
var lexml = './xml_out/'+lesinsert;
var contenu = lire(lexml);		  


var requetehttppost = new XMLHttpRequest();
var url = "https://www.cigalsace.org/geoserver/cigal_edit/wfs";
var params = contenu; 


requetehttppost.open("POST", url, true);
requetehttppost.setRequestHeader("Content-type", " application/xml; charset=UTF-8");
requetehttppost.setRequestHeader("Referer", "https://www.cigalsace.org/signalement/");
requetehttppost.setRequestHeader("Accept-Language", "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3");
requetehttppost.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
requetehttppost.setRequestHeader("Host", "www.cigalsace.org");

requetehttppost.send(params);

csvUploadForm.getForm().reset(); //efface le fichier Ouvert dans le formulaire
}
//..............................................................................//                          
                        }
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
