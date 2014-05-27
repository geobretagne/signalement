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