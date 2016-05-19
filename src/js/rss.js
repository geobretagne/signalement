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

Signalement.rss = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;

    var toolbar = null;

    var rssUrl = null;

    var drawPolyCtrl = null;

    var drawPolyCtrlAction = null;

    var mon_loader2 = null;

    var rssLayer = null;

    var rssHtml = null;

    //Section RSS
    var getHtml = function (config) {
        var htmltextscount = config.length;
        rssHtml = [];
          for (var h=0; h<htmltextscount; h++){
            rssHtml.push("<b>" + config[h].htmltext.value + "</b>");
          }
    };

    var get_radio_value = function (item) {
        var gr = item.items.items;
        for (var i = 0; i < gr.length; i++) {
            if (gr[i].checked) {
                return gr[i].inputValue;
            }
        }
    };

    var rssFiltreAttributaire = function (inseeliste) {
      var inseearray = inseeliste.split(",");
      var tmp = "depco+IN+(";
      for( var i=0; i < inseearray.length; i++ )
        {
          tmp = tmp + "'" + inseearray[i] + "'";
          if (inseearray.length >1 && i!= inseearray.length -1)
          {
            tmp = tmp + ",";
          }
        }
      return  tmp + ")";
    };
    var rssFiltreWKT = function (geomfield) {
      var geom = rssLayer.features[0];
      var geometry = geom.geometry.clone();
      geometry.transform(new OpenLayers.Projection("EPSG:3857"), new OpenLayers.Projection("EPSG:2154"));
      var projfeat = new OpenLayers.Feature.Vector(geometry);
      var format = new OpenLayers.Format.WKT();
      var wkt = format.write(projfeat);
      return  "INTERSECTS("+ geomfield +"," + wkt + ")";

    };

    var rssFiltreGML = function () {
      var geom = rssLayer.features[0];
      var format = new OpenLayers.Format.GML.v3();
      format.srsName = "EPSG:3857";
      var gml = format.write(geom);
      var xml = new OpenLayers.Format.XML().read(gml);
      var polygon = format.getElementsByTagNameNS(xml,"*","geometry")[0].firstChild;
      return serializeXmlNode(polygon);
    };

    var serializeXmlNode = function (xmlNode) {
        if (xmlNode.xml) {
            return xmlNode.xml;
        }
        else {
            return (new window.XMLSerializer()).serializeToString(xmlNode);
        }
    }

    var removerssfeatures = function () {
      rssLayer.removeAllFeatures();
    };

    var genRss = function () {
      var rssurl = "";
      var baseurl = rssUrl;

      var filtre =  Ext.getCmp("cqlfilterA").getValue();
	  var filtre2 = Ext.getCmp("cqlfilterB").getValue();

	  if (filtre2 == '0') {rssurl = baseurl + "cql_filter=" + filtre;}
	  else {rssurl = baseurl + "cql_filter=" + filtre +("+AND+")+filtre2;}

      return rssurl;

    };

    var gooGL = function () {
        var request = OpenLayers.Request.issue({
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            url: "https://www.googleapis.com/urlshortener/v1/url",
            data: '{"longUrl":"' +  genRss() +'"}',
            failure: requestFailure,
            success: gooGLSuccess
            });
    };

    var gooGLSuccess = function (response) {
          var obj = JSON.parse( response.responseText );

    }

    var callrss = function () {
      window.open(genRss(), "_blank");
    };

    var showrss = function (item, pressed) {
        var box = Ext.getCmp('rssurlresult');
        if (pressed == false) {
            box.setVisible(false);
        }
        else {

            box.setValue(genRss());
            box.setVisible(true);
        }
    };

    var initLoader = function () {
        mon_loader2 = new Ext.LoadMask(
        'rssForm',
        {msg:"Création du filtre attributaire..."}
      );
    };

    var getCommunesINSEE = function (gmlnode) {
        if (!mon_loader2) {
            initLoader();
        }
        mon_loader2.show();
        var wfsurl = "https://www.cigalsace.org/geoserver/wfs";
        var postRequest = '<wfs:GetFeature service="WFS" version="1.1.0"'
        + ' outputFormat="json"'
        + ' xmlns:topp="http://www.openplans.org/topp"'
        + ' xmlns:wfs="http://www.opengis.net/wfs"'
        + ' xmlns:ogc="http://www.opengis.net/ogc"'
        + ' xmlns:gml="http://www.opengis.net/gml"'
        + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
        + ' xsi:schemaLocation="http://www.opengis.net/wfs'
        + ' http://schemas.opengis.net/wfs/1.1.0/WFS-basic.xsd">'
        + ' <wfs:Query srsName="EPSG:3857" typeName="CRA:CRA_COMMUNES_SHP_C48">'
        + ' <ogc:PropertyName>id_commune</ogc:PropertyName> '
        + ' <ogc:PropertyName>lib_commun</ogc:PropertyName>'
        +  ' <Filter>'
        +    ' <Intersects>'
        +    ' <PropertyName>the_geom</PropertyName>'
        + gmlnode
        +    ' </Intersects>'
        +    ' </Filter>'
        + ' </wfs:Query>'
        +' </wfs:GetFeature>';

      var request = OpenLayers.Request.issue({
            method: 'POST',
            headers: {
              "Content-Type": "text/xml"
            },
            url: wfsurl,
            data: postRequest,
            failure: requestFailure,
                    success: getCommunesINSEESuccess
            });
      };

      var requestFailure = function (response) {
      OpenLayers.Console.log("GetCommuneResult", response.responseText);
    };
    var showCommunes = function (data) {
        var store = new Ext.data.JsonStore({
                    fields: [{
                        name: 'insee',
                        mapping: 'properties.id_commune'
                    }, {
                        name: 'commune',
                        mapping: 'properties.lib_commun'
                    }]
                });
        store.loadData(data);
        var grid = new Ext.grid.GridPanel({
            region: "center",
            width : 300,
            height: 300,
            autoScroll: false,
            layout: 'fit',
            store: store,
            columns: [{
                header: "insee",
                width: 50,
                dataIndex: "insee",
          sortable: true
            }, {
                header: "commune",
                width: 225,
                dataIndex: "commune",
          sortable: true
            }],
        autoSizeColumns: true
        });
        var wincom = new Ext.Window({
                title: 'Communes intersectées',
                closable: true,
                resizable: true,
                border: false,
                plain: true,
                region: 'center',
                items: [grid]
            });
        wincom.show();
    };

    var getCommunesINSEESuccess = function (response) {
          var obj = JSON.parse( response.responseText );
            if (obj.features.length > 0)
            {
              var inseeliste = "";
              var communesliste = "";
              for ( var i=0; i < obj.features.length; i++ )
              {
                inseeliste += obj.features[i].properties.id_commune;
                communesliste += obj.features[i].properties.lib_commun;
                if (i != obj.features.length -1)
                {
                  inseeliste += ",";
                  communesliste += ",";
                }
              }
              //alert("Les communes suivantes ont été intersectées :" + "\n" + communesliste);
              showCommunes(obj.features);
              Ext.getCmp("cqlfilterA").setValue(rssFiltreAttributaire(inseeliste));
            }

            else
            {
              showMsg("Erreur", "Aucune commune n'a été trouvée à cet emplacement");
            }
          mon_loader2.hide();
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

        create: function (m,r,html,tb) {
            map = m;
            rssUrl = r;
            toolbar = tb;
            rssLayer = new OpenLayers.Layer.Vector("Rss Layer", {displayInLayerSwitcher: false});
            map.addLayers([rssLayer]);
            getHtml(html);

            drawPolyCtrl = new OpenLayers.Control.DrawFeature(rssLayer, OpenLayers.Handler.Polygon,
                {featureAdded:function(){
                  switch(get_radio_value(Ext.getCmp("rssradio"))){
                        case 1:
                        Ext.getCmp("cqlfilterA").setValue(rssFiltreWKT('the_geom'));
                        break;
                        case 2:
                        var filtregeo = rssFiltreGML();
                        getCommunesINSEE(filtregeo);
                        break;
                        default:
                        break;
                  }

                  drawPolyCtrl.deactivate();

                }
              });
            drawPolyCtrl.setMap(map);
            drawPolyCtrl.events.register("activate", '', removerssfeatures);

            // test
            //var o = Ext.getCmp("myMapPanel").toolbars[0];

            drawPolyCtrlAction = new GeoExt.Action({
              tooltip: "Dessiner un polygone",
              disabled:true,
              hidden:true,
              id:"rssdraw",
              iconCls: "rss",
              control: drawPolyCtrl,
              map: map,
              toggleGroup: "tools",
              allowDepress: false
            });
            toolbar.addItem(drawPolyCtrlAction);



            // test


            // FORMULAIRE  RSS
            var rssPanel = new Ext.form.FormPanel({
                title: 'Abonnement',
                monitorValid:true,
                frame:true,
                id: 'rssForm',
                padding: 10,
				height:600,
                layout: 'absolute',
                iconCls:'smallrss',
                items: [
                  {
                    xtype:'panel',
                    html:rssHtml[0],
                    height:80,
                    id:"rssinstructions"
                  },
                  {
                    id: "rssradio",
                    xtype:'radiogroup',
                    x: 5,
                    y: 100,
                    fieldLabel: 'Filtrer',
                     columns    : 1,
                       items: [
                         {boxLabel: 'tous les enregistrements', name: 'rssoption', inputValue: 0, checked:true},
                         {boxLabel: 'par polygone', name: 'rssoption', inputValue: 1},
                         {boxLabel: 'par communes intersectées', name: 'rssoption', inputValue: 2},
                         {boxLabel: 'par emprise départementale (68)', name: 'rssoption', inputValue: 3},
                         {boxLabel: 'par emprise départementale (67)', name: 'rssoption', inputValue: 4},
                         {boxLabel: 'par emprise CC3F', name: 'rssoption', inputValue: 5},
                         {boxLabel: 'par emprise Kochersberg', name: 'rssoption', inputValue: 6},
                         {boxLabel: 'par emprise M2A', name: 'rssoption', inputValue: 7},
                         {boxLabel: 'par emprise Colmar Agglo', name: 'rssoption', inputValue: 8},
                         {boxLabel: 'par emprise Eurométropole', name: 'rssoption', inputValue: 9}
                      ],
                      listeners: {
                        change: function(radiogroup, radio) {
                        Ext.getCmp("rssinstructions").update(rssHtml[radio.inputValue]);
                        removerssfeatures();
                            switch(radio.inputValue){
                              case 0:
                              Ext.getCmp("cqlfilterA").setValue("depco IS NOT NULL");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                              case 1:
                              Ext.getCmp("cqlfilterA").setValue(null);
                              Ext.getCmp("rssbtngeo").setVisible(true);
                              drawPolyCtrl.activate();
                              break;
                              case 2:
                              Ext.getCmp("cqlfilterA").setValue(null);
                              Ext.getCmp("rssbtngeo").setVisible(true);
                              drawPolyCtrl.activate();
                              break;
                              case 3:
                              Ext.getCmp("cqlfilterA").setValue("depco+BETWEEN+68000+and+68999");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                              case 4:
                              Ext.getCmp("cqlfilterA").setValue("depco+BETWEEN+67000+and+67999");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                             case 5:
                              Ext.getCmp("cqlfilterA").setValue("depco+IN+(68021,68042,68061,68126,68135,68149,68163,68286,68297,68349)");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                             case 6:
                              Ext.getCmp("cqlfilterA").setValue("depco+IN+(67181,67138,67406,67374,67102,67214,67109,67375,67495,67532,67226,67163,67228,67548,67150,67542,67485,67236,67034,67452,67253,67173,67382,67097)");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                             case 7:
                              Ext.getCmp("cqlfilterA").setValue("depco+IN+(68015,68022,68032,68043,68055,68056,68070,68072,68084,68088,68093,68101,68118,68129,68154,68166,68195,68218,68224,68256,68258,68267,68270,68271,68278,68289,68300,68321,68323,68343,68375,68376,68384,68386)");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                             case 8:
                              Ext.getCmp("cqlfilterA").setValue("depco+IN+(68007,68038,68066,68134,68143,68145,68146,68155,68157,68227,68237,68272,68295,68331,68338,68354,68365,68366,68374,68385)");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;
                             case 9:
                              Ext.getCmp("cqlfilterA").setValue("depco+IN+(67043,67049,67118,67119,67124,67131,67137,67152,67204,67212,67218,67256,67267,67268,67296,67309,67326,67343,67350,67365,67378,67389,67447,67471,67482,67506,67519,67551)");
                              Ext.getCmp("rssbtngeo").setVisible(false);
                              drawPolyCtrl.deactivate();
                              break;

                          }
                        }
                      }
                  },

                  {
                    id: "rssradio2",
                    xtype:'radiogroup',
                    x: 5,
                    y: 350,
                    fieldLabel: 'Filtrer par pièce jointe ',
                     columns    : 1,
                       items: [
                         {boxLabel: 'indifférent', name: 'rssoption2', inputValue: 0, checked:true},
                         {boxLabel: 'au moins une ', name: 'rssoption2', inputValue: 1},
                         {boxLabel: 'exactement deux', name: 'rssoption2', inputValue: 2},

                      ],
                    listeners: {
                        change: function(radiogroup, radio) {

                        removerssfeatures();
                            switch(radio.inputValue){
                              case 0:
                              Ext.getCmp("cqlfilterB").setValue("0");

                              break;
                              case 1:
                              Ext.getCmp("cqlfilterB").setValue("(strSubstring(url_1,0,4)+LIKE+'http'+OR+strSubstring(url_2,0,4)+LIKE+'http')");

                              break;
                              case 2:
                              Ext.getCmp("cqlfilterB").setValue("strSubstring(url_1,0,4)+LIKE+'http'+AND+strSubstring(url_2,0,4)+LIKE+'http'");


                              break;


                          }
                        }
                      }

                    },


                  {
                    xtype:'textfield',
                    x: 5,
                    y: 210,
                    anchor:'100%',
                    value:"depco IS NOT NULL",
                    hidden : true,
                    allowBlank:false,
                    id:"cqlfilterA"
                  },
                    {
                    xtype:'textfield',
                    x: 5,
                    y: 210,
                    anchor:'100%',
                    value:"0",
                    hidden : true,
                    allowBlank:false,
                    id:"cqlfilterB"
                  },
                  {
                    xtype:'textarea',
                    x: 5,
                    y: 435,
                    anchor:'100%',
                    hidden : true,
                    allowBlank:true,
                    id:"rssurlresult"
                  },
                    {
                    xtype:'panel',
                    x: 5,
                    y: 330,
                    html:'<b>Nombre de pièces jointes :</b>',
                    height:15,
                    id:"rsshelp33"
                  },
                  {
                    xtype:'panel',
                    x: 5,
                    y: 500,
                    html:'<a href="http://fr.wikipedia.org/wiki/RSS" target="_blank">Comment utiliser un flux RSS</a>',
                    height:100,
                    id:"rsshelp"
                  }
                  ],
                  buttons:[
                    {
                      id: "rssbtngeo",
                      hidden:true,
                      iconCls: "polygon",
                      tooltip: "Dessiner un polygone afin de filtrer le flux RSS sur l'emprise sélectionnée",
                      handler : function(){
                       Ext.getCmp("cqlfilterA").setValue(null);
                       drawPolyCtrl.activate();
                      }
                    },
                    {
                      id: "rssbtn",
                      iconCls: "smallrss",
                      formBind:true,
                      text    : "S'abonner",
                      handler : callrss
                    },
                     {
                      id: "showrssbtn",
                      iconCls: "eye",
                      enableToggle: true,
                      formBind:true,
                      tooltip: "Afficher le lien permanent du flux généré",
                      text    : "Afficher l'URL",
                      toggleHandler : showrss
                    }


                  ]

              });

            return rssPanel;
        }
    }
})();
