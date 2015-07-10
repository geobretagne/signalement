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
                title: "Partager l'emprise de la carte",
                frame: true,
                iconCls:'tool',
                html: "Cet outil permet de générer l'URL correspondant à l'affichage actuel (cadrage, fond cartographique,...)",                 
                items:[permaPanel]
              });
      
            return paramPanel;
        }
    }
})();
