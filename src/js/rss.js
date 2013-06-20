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
      var filtre = Ext.getCmp("cqlfilterA").getValue();      
      rssurl = baseurl + "&cql_filter=" + filtre;
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
        var wfsurl = "http://geobretagne.fr/geoserver/geob_loc/wfs";    
        var postRequest = '<wfs:GetFeature service="WFS" version="1.1.0"'
        + ' outputFormat="json"'
        + ' xmlns:topp="http://www.openplans.org/topp"'
        + ' xmlns:wfs="http://www.opengis.net/wfs"'
        + ' xmlns:ogc="http://www.opengis.net/ogc"'
        + ' xmlns:gml="http://www.opengis.net/gml"'
        + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
        + ' xsi:schemaLocation="http://www.opengis.net/wfs'
        + ' http://schemas.opengis.net/wfs/1.1.0/WFS-basic.xsd">'
        + ' <wfs:Query srsName="EPSG:3857" typeName="geob_loc:COMMUNE">'
        + ' <ogc:PropertyName>INSE</ogc:PropertyName> '
        + ' <ogc:PropertyName>COMMUNE</ogc:PropertyName>'
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
                        mapping: 'properties.INSE'
                    }, {
                        name: 'commune',
                        mapping: 'properties.COMMUNE'
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
                inseeliste += obj.features[i].properties.INSE;
                communesliste += obj.features[i].properties.COMMUNE;
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
                        Ext.getCmp("cqlfilterA").setValue(rssFiltreWKT('geom'));
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
                layout: 'absolute',
                iconCls:'smallrss',
                items: [  
                  {
                    xtype:'panel',
                    html:rssHtml[0],
                    height:400,            
                    id:"rssinstructions"
                  },      
                  {
                    id: "rssradio",
                    xtype:'radiogroup',
                    x: 5,
                    y: 105,
                    fieldLabel: 'Filtrer',
                     columns    : 1,
                       items: [
                         {boxLabel: 'tous les enregistrements', name: 'rssoption', inputValue: 0, checked:true},
                         {boxLabel: 'par polygone', name: 'rssoption', inputValue: 1},
                         {boxLabel: 'par communes intersectées', name: 'rssoption', inputValue: 2},
                         {boxLabel: 'par emprise départementale (22)', name: 'rssoption', inputValue: 3},
                         {boxLabel: 'par emprise départementale (29)', name: 'rssoption', inputValue: 4},
                         {boxLabel: 'par emprise départementale (35)', name: 'rssoption', inputValue: 5},
                         {boxLabel: 'par emprise départementale (56)', name: 'rssoption', inputValue: 6}
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
                              Ext.getCmp("cqlfilterA").setValue("depco+BETWEEN+22000+and+22999");
                              Ext.getCmp("rssbtngeo").setVisible(false);            
                              drawPolyCtrl.deactivate();            
                              break;
                              case 4:            
                              Ext.getCmp("cqlfilterA").setValue("depco+BETWEEN+29000+and+29999");
                              Ext.getCmp("rssbtngeo").setVisible(false);            
                              drawPolyCtrl.deactivate();            
                              break;
                             case 5:            
                              Ext.getCmp("cqlfilterA").setValue("depco+BETWEEN+35000+and+35999");
                              Ext.getCmp("rssbtngeo").setVisible(false);            
                              drawPolyCtrl.deactivate();            
                              break;
                             case 6:            
                              Ext.getCmp("cqlfilterA").setValue("depco+BETWEEN+56000+and+56999");
                              Ext.getCmp("rssbtngeo").setVisible(false);            
                              drawPolyCtrl.deactivate();            
                              break; 
                              
                          }
                        }
                      }
                  },
                  {
                    xtype:'textfield',
                    x: 5,
                    y: 175,    
                    anchor:'100%',
                    value:"depco IS NOT NULL",
                    hidden : true,
                    allowBlank:false,    
                    id:"cqlfilterA"  
                  },
                  {
                    xtype:'textarea',
                    x: 5,
                    y: 275,                     
                    anchor:'100%',
                    hidden : true,
                    allowBlank:true,    
                    id:"rssurlresult"  
                  }
                  ],            
                  buttons:[
                    {
                      id: "rssbtngeo",
                      hidden:true,
                      iconCls: "polygon",
                      tooltip: "Dessiner un polygone afin de filtrer le flux rss sur l'emprise sélectionnée",                  
                      handler : function(){  
                       Ext.getCmp("cqlfilterA").setValue(null);
                       drawPolyCtrl.activate();
                      }
                    },
                    {
                      id: "rssbtn",
                      iconCls: "smallrss",          
                      formBind:true,
                      text    : "s'abonner",
                      handler : callrss
                    },
                     {
                      id: "showrssbtn",
                      iconCls: "eye",
                      enableToggle: true,                      
                      formBind:true,
                      tooltip: "Afficher le lien permanent du flux généré",
                      text    : "Afficher",
                      toggleHandler : showrss
                    }
                    
                    
                  ]
                    
              });    
      
            return rssPanel;
        }
    }
})();