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
Signalement.treelayer = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;

    var tpl = null;

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

        create: function (m, signalLayer) {
            map = m;
            var detailsText = "<i>Sélectionnez une couche pour plus d'informations...</i>";
            var detailsPanel = new Ext.Panel({
                region: 'south',
                title: 'Informations sur la couche',
                id: 'details-panel',
                autoScroll: true,
                collapsible: true,
                split: true,
                margins: '0 2 2 2',
                cmargins: '2 2 2 2',
                height: 250,
                html: detailsText
            });
            var tpl = new Ext.Template('<h2 class="title">{name}</h2>', '<p><b>lien ogc</b>: {url}</p>', '<p><b>Description</b>: {desc}</p>', '<p><a href="{metadata}" target="_blank">Afficher les métadonnées</a></p>');
            var tpl2 = new Ext.Template('<h2 class="title">{name}</h2>', '<p><b>lien ogc</b>: {url}</p>', '<p><b>Description</b>: {desc}</p>', '<p><a href="{metadata}" target="_blank">Afficher les métadonnées</a></p>', '<p><a href="{metadata2}" target="_blank">Afficher les métadonnées</a></p>');   
                
            tpl.compile();
            tpl2.compile();
            // create our own layer node UI class, using the TreeNodeUIEventMixin
            var LayerNodeUI = Ext.extend(GeoExt.tree.LayerNodeUI, new GeoExt.tree.TreeNodeUIEventMixin());

            var treeConfig = new OpenLayers.Format.JSON().write([{
                text: 'Couches de travail',
                icon: 'src/img/layers16x.png',
                expanded: true,
                children: [{
                    nodeType: 'gx_layer',
                    draggable: false,
                    layer: signalLayer,
                    qtip: signalLayer
                    //icon: 'src/img/add.png'
                }, {
                    nodeType: 'gx_layer',
                    layer: "Limites administratives",
                    qtip: "Limites administratives"
                    //,icon       : 'src/img/world.png'                
                },
                {
                    nodeType: 'gx_layer',
                    layer: "BANO",
                    qtip: "Base Adresses Nationale Ouverte"
                    //,icon       : 'src/img/world.png'                
                },
                {
                    nodeType: 'gx_layer',
                    layer: "Fond cadastral",
                    qtip: "Parcelles du cadastre"
                    //,icon       : 'src/img/world.png'                
                }]
            }, {
                nodeType: 'gx_baselayercontainer',
                text: 'fonds cartographiques',
                expanded: true,
                allowDrag: false,
                allowDrop: false,
                draggable: false,
                isLeaf: false,
                icon: 'src/img/world.png'
            }], true);

            // create the tree with the configuration from above
            var treePanel = new Ext.tree.TreePanel({
                region: "north",
                loader: new Ext.tree.TreeLoader({
                    applyLoader: false,
                    uiProviders: {
                        "layernodeui": LayerNodeUI
                    }
                }),
                listeners: {
                    'render': function (tp) {
                        tp.getSelectionModel().on('selectionchange', function (tree, node) {
                            var el = Ext.getCmp('details-panel').body;
                            if (node && node.leaf && node.layer.name !== "Limites administratives") {
                                tpl.overwrite(el, node.layer.tp);
                            }
                            else if (node && node.leaf && node.layer.name === "Limites administratives") {
                                tpl2.overwrite(el, node.layer.tp);
                            }
                            else {
                                el.update(detailsText);
                            }
                        })
                    }
                },
                root: {
                    nodeType: "async",
                    children: Ext.decode(treeConfig)
                },
                rootVisible: false,
                lines: true
            });
            
            

            var layerPanel = new Ext.Panel({
                title: 'Affichage des couches',
                frame: true,
                iconCls: 'layers',
                items: [treePanel, detailsPanel]

            });

            return layerPanel;
        }
    }
})();