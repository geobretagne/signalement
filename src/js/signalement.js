Ext.namespace("Signalement");

Signalement.signalement = (function () {
    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;

    var mapPanel = null;

    var enableSelectOver = false;
    
    var phplocation = null;

    var wfsLayer = null;

    var signalForm = null;

    var signalFormWindow = null;

    var saveStrategy = null;

    var selectFeatureCtrl = null;

    var drawPtCtrl = null;

    var modifyPtCtrl = null;

    var deletePtCtrl = null;

    var enabledeletecontrol = false;

    var selectFeatureCtrlAction = null;

    var drawPtCtrlAction = null;

    var modifyPtCtrlAction = null;

    var deletePtCtrlAction = null;

    var signalAttributes = [];

    var AllSignalAttributes = [];

    var backupGeom = null;

    var mon_loader = null;

    var popup;

    // Style appliqué la couche signalements   
    var iconStyleDefault = new OpenLayers.Style({
        externalGraphic: "src/img/add.png",
        graphicWidth: 20,
        graphicHeight: 20
    });

    var iconStyleSelect = new OpenLayers.Style({
        externalGraphic: "src/img/addselect.png",
        graphicWidth: 20,
        graphicHeight: 20
    });
    var iconStyleDelete = new OpenLayers.Style({
        externalGraphic: "src/img/adddelete.png",
        graphicWidth: 20,
        graphicHeight: 20
    });

    var iconStyleImport = new OpenLayers.Style({
        externalGraphic: "src/img/addselect.png",
        graphicWidth: 25,
        graphicHeight: 25
    });


    var normalStyleMap = new OpenLayers.StyleMap({
        'default': iconStyleDefault,
        'select': iconStyleSelect,
        'delete': iconStyleDelete,
        'temporary': iconStyleImport
    });
    
    var oRules = {
                'public': {externalGraphic: "src/img/add.png"},                
                'privé': {externalGraphic: "src/img/prive.png"}
    };
    
    normalStyleMap.addUniqueValueRules("default", "contributeur", oRules);

	//Cluster
	var cluster_default_style = new OpenLayers.Style({
                    pointRadius: "${radius}",
                    fillColor: "${color}",
                    fillOpacity: 0.8,
                    strokeColor: "#01B0F0",
                    strokeWidth: 5,
                    strokeOpacity: 0.4,
                    label: "${label}",
                    fontColor: "#ffffff",
                }, {
                    context: {
                        radius: function(feature) {
                            if(feature.cluster) {
                                return Math.min(feature.attributes.count, 14) + 6;
                            }
                            else {
                                return 10;
                            }
                        },
                        color: function(feature) {
                            var c = "";
                            if (feature.cluster) {
                                c = "#96CA2D";
                            }
                            else {                                
                                switch(feature.attributes.contributeur)
                                {
                                case "public":
                                  c = "#0000ff";
                                  break;
                                case "privé":
                                  c = "#ff0000";
                                  break;
                                default:
                                  c = "#ffffff";
                                }
                            }                            
                            return c;  
                          },
                        label: function(feature) {
                            // clustered features count or blank if feature is not a cluster
                            return feature.cluster ? feature.cluster.length : "";  
                          }
                    }
                });
                
    var cluster_select_style = OpenLayers.Util.applyDefaults({ strokeWidth: 7, strokeOpacity: 1}, cluster_default_style.clone());
	
	var clusterStyleMap = new OpenLayers.StyleMap({"default": cluster_default_style, "select": cluster_select_style});

    // fonctions d'affichage des messages
    var showSuccessMsg = function () {
            Signalement.main.showMsg("Succès", "Transaction exécutée avec succès");
			//cluster
            wfsLayer.refresh();
        };

    var showFailMsg = function () {
            Signalement.main.showMsg("Erreur", "Une erreur est intervenue durant la transaction.");
        };

    var resetForm = function () {
            signalFormWindow.hide();
            signalForm.getForm().reset();
            Ext.getCmp("url_1").setValue("");
            Ext.getCmp("url_2").setValue("");
            Ext.getCmp("url_12").setValue("");
            Ext.getCmp("url_22").setValue("");
        };

    var get_radio_value = function (item) {
            var gr = item.items.items;
            for (var i = 0; i < gr.length; i++) {
                if (gr[i].checked) {
                    return gr[i].inputValue;
                }
            }
        };

    var initLoader = function () {
            //Crꢴion des messages de Loading
            mon_loader = new Ext.LoadMask('myForm', {
                msg: "Interrogation de la couche Communes..."
            });
        };



    /**
     * Methode: showSignalFormWindow
     * Appelꥠlorsqu'une entitꥠest sꭥctionnꥠpour modifications. 
     * Param鵲es:
     * feature - {OpenLayers.Feature}
     */
    var showSignalFormWindow = function (feature) {
            var nMapXCenter, nFeatureXPos, nWinXPos, nWinYPos, nXOffset = 45,
                nYOffset = 55;
            // D굥rmine si la popup apparaﴠࡤroite ou ࡧauche de l'ꤲan
            nMapXCenter = map.getExtent().getCenterPixel().x;
            nFeatureXPos = feature.geometry.getBounds().getCenterPixel().x;
            if (nFeatureXPos >= nMapXCenter) { // la popup ࡧauche
                nWinXPos = mapPanel.x + nXOffset;
                nWinYPos = mapPanel.y + nYOffset;
            } else { // la popup ࡤroite
                nWinXPos = mapPanel.x + map.getSize().w - signalFormWindow.width;
                nWinYPos = mapPanel.y + nYOffset;
            }
            signalFormWindow.setPosition(nWinXPos, nWinYPos);
            Ext.getCmp('deleteBtn').setVisible(feature.state !== 'Insert');
            hideField(signalForm.getForm().findField('nature_mod'));
            signalFormWindow.show();

        };

    // Fonctions d'ꥩtion et de crꢴion

    var onSignalModificationStart = function (object) {
		if (!object.feature.cluster) {
            var oFeature;
            if (object.geometry) {
                oFeature = object;
            } else {
                oFeature = object.feature;
            }
            // Stockage en mꮯire de la g갭굲ie avant modification
            backupGeom = new OpenLayers.Geometry.Point(oFeature.geometry.x, oFeature.geometry.y);
            backupGeom.id = oFeature.geometry.id;
            OpenLayers.Console.log("start modifying", oFeature.id);
            showSignalFormWindow(oFeature);


            if (oFeature.state != "Insert") {
                parseFeatureAttributesToForm(oFeature, signalForm);
                if (oFeature.attributes['nature_ref'] === 'modification') {
                    showField(signalForm.getForm().findField('nature_mod'));
                    signalFormWindow.setHeight(525);
                }
                else {
                    hideField(signalForm.getForm().findField('nature_mod'));
                    signalFormWindow.setHeight(500);
                }
                
            } else {
                //signalForm.getForm().findField("public").setValue('oui');
                if (Ext.util.Cookies.get("mel")) {
                    if (signalForm.getForm().findField("mel")) {
                        //signalForm.getForm().findField("user").setValue(Ext.util.Cookies.get("iduser"));
                        signalForm.getForm().findField("mail").setValue(Ext.util.Cookies.get("mel"));
                    }
                }
            }
		}
    };

    var onSignalModification = function (object) {
            var oFeature;
            if (object.geometry) {
                oFeature = object;
            } else {
                oFeature = object.feature;
            }
            var bbox = oFeature.geometry.getBounds().toBBOX();
            var point = oFeature.geometry.getVertices()[0].x + "," + oFeature.geometry.getVertices()[0].y;
            getCommuneInfos(point);
            //getCommuneInfos(bbox);
            OpenLayers.Console.log("modified", oFeature.id);
        };

    var showTip = function (object) {
            alert('over');
        };

    var onSignalModificationEnd = function (object) {
            var oFeature;
            if (object.geometry) {
                oFeature = object;
            } else {
                oFeature = object.feature;
            }
            OpenLayers.Console.log("end modifying", oFeature.id);
            resetForm();

        };

    /**
     * M굨ode: getSelectedSignal
     * Retourne la premi鳥 entit顳ꭥctionnꥠde la couche WFS.
     *
     * Returns:
     * {OpenLayers.Feature}
     */
    var getSelectedSignal = function () {
            return modifyPtCtrl.feature;
        };

    /**
     * M굨ode: saveSignal
     * Si les attributs de l'entit顳ꭥctionnꥠsont valides lorsque l'utilisateur
     * clique sur  "enregistrer"
     * enregistre les attributs et la g갭굲ie dans la g갤atabase en utilisant
     *  une requ뵥 POST WFS:Insert ou WFS:Update.
     * 
     * Peut seulement enregistrer une entit顠 la fois utilisant Strategy.Save : l'entit顳ꭥctionnꥮ
     */
    var saveSignal = function (f) {
            var oFeature = f;
            if (isValidSignalAttributes(oFeature, signalAttributes)) {

                if (oFeature.state != OpenLayers.State.INSERT) {
                    oFeature.state = OpenLayers.State.UPDATE;
                }
                parseFormAttributesToFeature(oFeature, AllSignalAttributes, signalForm);
                switch (oFeature.layer.protocol.CLASS_NAME) {
                case "OpenLayers.Protocol.HTTP":
                    oFeature.layer.protocol.commit([oFeature]);
                    break;
                case "OpenLayers.Protocol.WFS.v1_1_0":
                    saveStrategy.save([oFeature]);
                    break;
                default:
                    alert("Cette version de wfs n'est pas supportée");
                }
                modifyPtCtrl.selectControl.unselect(oFeature);
            }
        };

    /**
     * M굨ode: parseFormAttributesToFeature
     * Parse Chaque valeur attributaire depuis le formulaire vers l'entit鮠 Chaque nom
     * d'attribut partage l' id d'un ꭩment du formulaire.
     *
     * Param鵲es:
     * oFeature - {OpenLayers.Feature}
     *                              
     * AszAttributes - {Array} 
     * 
     * Formulaire
     */
    var parseFormAttributesToFeature = function (
        oFeature, aszAttributes, signalForm) {
            var szAttr, szValue, oDate = new Date(),
                aoAttr = oFeature.attributes,
                aoItems = signalForm.items,
                nIdx, oElement;
            var dateformat = OpenLayers.Date.toISOString(oDate);
            for (var i = 0, nAttributes = aszAttributes.length; i < nAttributes; i++) {
                szAttr = aszAttributes[i];
                if (aoItems.containsKey(szAttr)) {
                    nIdx = aoItems.indexOfKey(szAttr);
                    oElement = aoItems.get(nIdx);
                    //szValue = oElement.getValue();
                    szValue = ctrlGetValue(oElement);
                    aoAttr[szAttr] = szValue;
                } else {
                    switch (szAttr) {
                    case "date_saisie":
                        aoAttr[szAttr] = dateformat;
                        break;
                    case "the_geom":
                        break;
                    default:
                    }
                }
            }
        };

    var ctrlGetValue = function (item) {

            var oValue = "";
            switch (item.id) {
            case "public":
                oValue = get_radio_value(item);
                break;
            case "iduser":
                oValue = item.getValue();
                Ext.util.Cookies.set("iduser", oValue);
                break;
            case "mel":
                oValue = item.getValue();
                Ext.util.Cookies.set("mel", oValue);
                break;
            default:
                oValue = item.getValue();
                break;
            }
            OpenLayers.Console.log(item.id, oValue);
            return oValue;

        };
    var signalFeatureAdded = function (object) {
            var oFeature = object.feature;
			// cluster
            if (oFeature.layer == null){
                oFeature.layer = wfsLayer;
                wfsLayer.addFeatures([oFeature]);
            }
            var point = oFeature.geometry.getVertices()[0].x + "," + oFeature.geometry.getVertices()[0].y;
            getCommuneInfos(point);
            oFeature.state = OpenLayers.State.INSERT;
            modifyPtCtrl.selectControl.select(oFeature);
        };


    /**
     * M굨ode: beforeSignalDeleted
     * D꤬ench顰ar l'귩nement beforefeaturesdeleted di contr孥 DeleteFeature.  Il
     * affiche une boite de message pour confirmer la suppression des entit고sꭥctionn꦳.
     */
    var beforeSignalDeleted = function (event) {

            Ext.Msg.confirm('Suppression du signalement sélectionné', 'Etes vous sûr de supprimer le(s) signalement(s) sélectionné(s) ?', function (btn) {
                if (btn == 'yes') {
                    deletePtCtrl.deleteFeatures({
                        silent: true
                    });
                    modifyPtCtrl.deactivate();
                } else {
                    deletePtCtrl.unselectAllFeatures();
                }
            });
            return false;
        };


    /**
     * M굨ode: deleteSignal
     * Supprime toutes les entit고sꭥctionn꦳ utilisant Strategy.Save.
     */
    var deleteSignal = function (event) {
            saveStrategy.save(event.features);
        };

    /**
     * M굨ode: parseFeatureAttributesToForm
     * Parse chaque valeur attributaire de l'entit顤ans les champs du formulaire
     * qui ont le m뮥 id le nom des attributs
     *
     * Param鵲es:
     * oFeature - {OpenLayers.Feature}
     *
     * oForm - {Ext.FormPanel} Formulaire.
     */
    var parseFeatureAttributesToForm = function (oFeature, oForm) {
            var aoElements, nElements;
            aoElements = oForm.items.items;
            nElements = aoElements.length;

            for (var i = 0; i < nElements; i++) {
                var oElement = aoElements[i];
                var szAttribute = oElement.getId();
                var szValue = oFeature.attributes[szAttribute];
                if (szAttribute == "url_1" || szAttribute == "url_2") {
                    oElement.items.items[0].setValue(szValue);
                } else {
                    oElement.setValue(szValue);
                }
            }
        };
        
    var hideField = function (field) {
        field.disable();// for validation
        field.hide();
        field.getEl().up('.x-form-item').setDisplayed(false); // hide label
    };

    var showField = function (field) {        
        field.enable();
        field.show();
        field.getEl().up('.x-form-item').setDisplayed(true);// show label
    };


    /**
     * Method: isValidSignalAttributes
     * Valide les valeurs de certains attributs.
     *
     * Param鵲es:
     * oFeature - {OpenLayers.Feature}
     *
     * aszAttributes - {Array}        Tableau des noms d'attributs pr괥nts dans le formulaire
     * Returns:
     * bValid - boolean                Faux si un des attributs est invalide
     */
    var isValidSignalAttributes = function (oFeature, aszAttributes) {
            var bValid = true;
            var szErrMsg = "invalid ";

            for (i = 0; i < aszAttributes.length && bValid; i++) {
                szAttribute = aszAttributes[i];
                switch (szAttribute) {
                case "mel":
                    szValue = document.getElementById(szAttribute).value;
                    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
                    bValid = szValue.match(reg);
                    break;
                case "depco":
                    szValue = document.getElementById(szAttribute).value;
                    var reg = /^\d{0,5}$/;
                    bValid = szValue.match(reg);
                    break;

                default:
                }

                if (!bValid) {
                    szErrMsg += szAttribute;
                    Signalement.main.showMsg("Erreur", szErrMsg);
                }
            }

            return bValid;
        };

    /**
     * Method: setSignalAttributes
     * Fill the signalAttributes array with names of existing html elements that
     * have the same id than an attribute name.
     * Fill the AllSignalAttributes array with all attribute names found.
     *
     * Parameters:
     * response - {GML} response of the DescribeFeatureType request
     */
    var setSignalAttributes = function (response) {
            //oWFSDescFeatType = new OpenLayers.Format.WFSDescribeFeatureType_1_0_0(); // marche pas remplace par la ligne du dessous
            oWFSDescFeatType = new OpenLayers.Format.WFSDescribeFeatureType();
            var oFeatures = oWFSDescFeatType.read(response.responseText);
            var aItems = new Array();
            //aItems = oFeatures[0].items; // sp ne fonctionne pas remplace par la ligne du dessous
            var aItems = oFeatures.featureTypes[0].properties;
            var j = 0;

            for (i = 0; i < aItems.length; i++) {
                AllSignalAttributes[i] = aItems[i].name;
                if (document.getElementById(aItems[i].name)) {
                    signalAttributes[j] = aItems[i].name;
                    j++;
                }
            }
        };

    /**
     * Method: getCommuneInfos
     * Requ뵥 ࡰartir des coordonn꦳ de l'entitꥠcrꪥ ou d걬acꥍ
     * le code INSEE et le nom de la commune concernꥍ
     * Param鵲es:
     * point
     
     **/
    var getCommuneInfos = function (point) {
            if (!mon_loader) {
                initLoader();
            }
            mon_loader.show();
            var wfsurl = "http://geobretagne.fr/geoserver/ign/wfs?";            
            var post = '<wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" service="WFS" version="1.1.0"' + ' outputFormat="json"'+ ' xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'+
            '<wfs:Query typeName="ign:bdtopo_commune" ' +
            'srsName="EPSG:3857" xmlns:feature="http://geobretagne.fr/ns/ign">' +
            ' <PropertyName>code_insee</PropertyName> ' +
            ' <PropertyName>nom</PropertyName> ' +
            '<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">' +            
            '<ogc:Contains>' +
                '<ogc:PropertyName>the_geom</ogc:PropertyName>' +
                '<gml:MultiPoint srsName="http://www.opengis.net/gml/srs/epsg.xml#3857" xmlns:gml="http://www.opengis.net/gml">' +
                    '<gml:pointMember>' +
                        '<gml:Point>' +
                            '<gml:coordinates decimal="." cs="," ts=" ">'+point+'</gml:coordinates>' +
                        '</gml:Point>' +
                    '</gml:pointMember>' +
                '</gml:MultiPoint>' +
            '</ogc:Contains>'+
            '</ogc:Filter></wfs:Query></wfs:GetFeature>';            
            
            var request = OpenLayers.Request.issue({
                method: 'POST',
                url: wfsurl,
                data:post,                
                failure: requestFailure,
                success: getCommuneSuccess
            });
        };



    var getCommuneSuccess = function (response) {

            var obj = eval("(" + response.responseText + ")");
            if (obj.features.length > 0) {
                OpenLayers.Console.log("Commune", obj.features[0].properties.nom);
                Ext.getCmp('libco').setValue(obj.features[0].properties.nom.toUpperCase());
                Ext.getCmp('depco').setValue(obj.features[0].properties.code_insee);
            } else {
                Signalement.main.showMsg("Erreur", "Aucune commune n'a été trouvée à cet emplacement");
            }
            mon_loader.hide();
        };



    var requestFailure = function (response) {
            OpenLayers.Console.log("GetCommuneResult", response.responseText);
        };


    var popUP = function (e) {
            // Je verifie qu'aucun popup n'existe deja
            if (typeof popup != 'undefined') {
                popup.destroy();
            }
            
			var htmlContent ="";
            var ident="";
            // test cluster
            if (e.cluster) {
                ident = "Sign. groupés ("+e.cluster.length+")";
                htmlContent = "Pour afficher les informations relatives à ces signalements, veuillez zoomer davantage.";
            }
			else
			{                
                ident = "Signalement : " + e.fid.split(".")[1]
                htmlContent = "commune : <b>" + e.attributes.libco + "</b><br/>" + "référentiel : <b>" + e.attributes.type_ref + "</b><br/>" + "nature : <b>" + e.attributes.nature_ref + "</b><br/>" + "commentaires : <b>" + e.attributes.comment_ref + "</b><br/>" + "contributeur : <b>" + e.attributes.contributeur + "</b><br/>" + "mail : <b>" + e.attributes.mel + "</b><br/>" + "acte : <b>" + e.attributes.acte_ref + "</b><br/>" + "date : <b>" + new Date(e.attributes.date_saisie).format('d/m/Y') + "</b><br/>";

                if (e.attributes.url_1) {
                    if (e.attributes.url_1.match('http://')) {
                        htmlContent += "fichier 1 : <a href='" + e.attributes.url_1 + "' target='_blank'>Lien</a><br/>";
                    }
                }
                if (e.attributes.url_2) {
                    if (e.attributes.url_2.match('http://')) {
                        htmlContent += "fichier 2 : <a href='" + e.attributes.url_2 + "' target='_blank'>Lien</a><br/>";
                    }
                 }
            }
			
			//****************************
            var size = new OpenLayers.Size(20, 34);
            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);

            popup = new GeoExt.Popup({
                title: ident,
                map: map,
                anchored: true,
                location: e.geometry,
                width: 200,
                html: htmlContent,
                collapsible: true,
                maximizable: false

            });
            popup.show();
            // map.addPopup(popup);                  
        };

    var desactivatePopup = function () {
            selectFeatureCtrl.deactivate();
        };

    var createUploadForm = function (id) {
            var uploadFormWindow = new Ext.Window({
                closable: false,
                resizable: false,
                width: 510,
                height: 150,
                border: false,
                plain: true,
                region: 'center',
                items: createfileUploadForm(id)
            });
            uploadFormWindow.render(Ext.getBody());
            uploadFormWindow.show();
        };

    var createfileUploadForm = function (fieldTarget) {

            var fileUploadForm = new Ext.FormPanel({
                fileUpload: true,
                width: 500,
                frame: true,
                title: 'Upload de fichier',
                autoHeight: true,
                bodyStyle: 'padding: 10px 10px 0 10px;',
                labelWidth: 60,
                defaults: {
                    anchor: '95%',
                    height: 20,
                    allowBlank: false,
                    msgTarget: 'side'
                },
                items: [{
                    xtype: 'fileuploadfield',
                    id: 'lefichier',
                    emptyText: 'Sélectionnez un document',
                    fieldLabel: 'Document',
                    name: 'lefichier',
                    buttonText: '',
                    buttonCfg: {
                        iconCls: 'upload-icon'
                    }
                }],
                buttons: [{
                    text: 'Transfert',
                    handler: function () {
                        if (fileUploadForm.getForm().isValid()) {
                            fileUploadForm.getForm().submit({
                                //url: '../proxy/?url=http://kartenn.region-bretagne.fr/signalement/ws/upload.php',
                                url: phplocation + 'upload.php',
                                waitMsg: 'Transfert du document...',
                                success: function (frm, o) {
                                    Ext.getCmp(fieldTarget).setValue(o.result.file);
                                    Ext.getCmp(fieldTarget + "2").setValue(o.result.file);
                                    fileUploadForm.findParentByType('window').destroy();
                                },
                                failure: function (fileUploadForm, o) {
                                    alert(o.result.message);
                                }
                            });
                        }
                    }
                }, {
                    text: 'Annuler',
                    iconCls: "cancel",
                    tooltip: 'Annuler les modifications courantes',
                    handler: function () {
                        this.findParentByType('window').destroy();
                    }
                }]
            });
            return fileUploadForm;
        };

    var deleteIndividualSignal = function () {
            var featureToDelete = wfsLayer.selectedFeatures[0];
            deletePtCtrl.selectFeature(featureToDelete);
            wfsLayer.events.triggerEvent("beforefeaturesdeleted", {
                feature: featureToDelete
            });
            deletePtCtrl.deleteFeatures();

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

        create: function (m, mp, tb, l, hover, phploc,disclaimer, cluster) {
            map = m;
            mapPanel = mp;
            phplocation = phploc;
            toolbar = tb;
            wfsLayer = l;
            enableSelectOver = hover;
			//cluster
			if (cluster) {
				wfsLayer.styleMap = clusterStyleMap;
			} else {
				wfsLayer.styleMap = normalStyleMap;
			}
            // Outil ajout d'un nouvel enregistrement
            drawPtCtrl = new OpenLayers.Control.DrawFeature(wfsLayer, OpenLayers.Handler.Point, {
                title: 'Dessiner un signalement'
            });
            // Outil modifier un enregistrement
            modifyPtCtrl = new OpenLayers.Control.ModifyFeature(wfsLayer, {
                title: 'Modifier un signalement'
            });
            // Outil supprimer un enregistrement   
            deletePtCtrl = new OpenLayers.Control.DeleteFeature(wfsLayer, {
                'box': true,
                title: "Supprimer un signalement"
            });
            // Outil Sélection d'entité
            /*selectFeatureCtrl = new OpenLayers.Control.SelectFeature(wfsLayer);
        selectFeatureCtrl.hover = true;
        selectFeatureCtrl.onSelect = popUP;*/
            selectFeatureCtrl = new OpenLayers.Control.SelectFeature(wfsLayer, {
                hover: enableSelectOver,
                // Fait reference a la fonction popUp
                onSelect: popUP
                //selectStyle :feature_style

            });

            selectFeatureCtrlAction = new GeoExt.Action({
                iconCls: "identify",
                map: map,
                pressed: false,
                toggleGroup: "tools",
                allowDepress: false,
                tooltip: "Identifier",
                control: selectFeatureCtrl
            });

            /*actions.push(new Ext.Toolbar.Spacer());
        actions.push(new Ext.Toolbar.Separator());
        actions.push(new Ext.Toolbar.Spacer());*/
            drawPtCtrlAction = new GeoExt.Action({
                iconCls: "drawpoint",
                map: map,
                id: "drawptaction",
                toggleGroup: "tools",
                allowDepress: false,
                tooltip: "Créer on nouveau signalement",
                control: drawPtCtrl
            });

            modifyPtCtrlAction = new GeoExt.Action({
                iconCls: "modifyfeature",
                map: map,
                toggleGroup: "tools",
                allowDepress: false,
                tooltip: "Modifier un signalement",
                control: modifyPtCtrl
            });


            deletePtCtrlAction = new GeoExt.Action({
                iconCls: "deletefeature",
                id: 'edf',
                hidden: (enabledeletecontrol == false),
                map: map,
                toggleGroup: "tools",
                allowDepress: false,
                tooltip: "Supprimer un signalement",
                control: deletePtCtrl
            });
            toolbar.addItem(new Ext.Toolbar.Spacer());
            toolbar.addItem(new Ext.Toolbar.Separator());
            toolbar.addItem(new Ext.Toolbar.Spacer());
            toolbar.addItem(selectFeatureCtrlAction);
            toolbar.addItem(drawPtCtrlAction);
            toolbar.addItem(modifyPtCtrlAction);
            toolbar.addItem(deletePtCtrlAction);
            toolbar.addItem(new Ext.Toolbar.Separator());



            // Crꢴion des listeners d'ꥩtion de la couche WFS
            wfsLayer.events.register("beforefeaturemodified", '', onSignalModificationStart);
            wfsLayer.events.register("featuremodified", '', onSignalModification);
            wfsLayer.events.register("afterfeaturemodified", '', onSignalModificationEnd);

            //Dꧩnition de la stratꨩe d'enregistrement WFST OpenLayers
            saveStrategy = new OpenLayers.Strategy.Save();
            saveStrategy.events.register("success", null, showSuccessMsg);
            saveStrategy.events.register("fail", null, showFailMsg);
            saveStrategy.setLayer(wfsLayer);

            drawPtCtrl.events.register("featureadded", '', signalFeatureAdded);
            //drawPtCtrl.events.register("activate", '', function(){filterStrategy.deactivate();}); // FILTER TIME

            deletePtCtrl.events.register("beforefeaturesdeleted", '', beforeSignalDeleted);
            deletePtCtrl.events.register("deletefeatures", '', deleteSignal);

            // Requ뵥 DescribeFeatureType sur la couche WFS pour rꤵp곥r la liste des attributs
            var descFeatTypeRequest = wfsLayer.protocol.schema;
            OpenLayers.loadURL(descFeatTypeRequest, '', this, setSignalAttributes);



            var referentielData = [
                ['voie', 'voie'],
                ['adresse', 'adresse']
            ];
            var natureData = [
                ['creation', 'création'],
                ['modification', 'modification'],
                ['suppression', 'suppression']
            ];
            var naturemodData = [
                ['sens', 'sens de la voie'],
                ['tracé', 'tracé'],
                ['dénom.', 'dénomination voie'],
                ['nb. voies', 'nombre de voies'],
                ['adresse', 'adresse ou lieu-dit'],
                ['vitesse', 'vitesse'],
                ['autre', 'autre']
            ];
            var booleanData = [
                ['oui', 'oui'],
                ['non', 'non']
            ];

            var contributeurData = [
                ['public', 'public'],
                ['privé', 'privé']
            ];
            
            var referentielStore = new Ext.data.SimpleStore({
                fields: ['value', 'text'],
                data: referentielData
            });


            var natureStore = new Ext.data.SimpleStore({
                fields: ['value', 'text'],
                data: natureData
            });
            
            var naturemodStore = new Ext.data.SimpleStore({
                fields: ['value', 'text'],
                data: naturemodData
            });
            
            var contributeurStore = new Ext.data.SimpleStore({
                fields: ['value', 'text'],
                data: contributeurData
            });

            var booleanStore = new Ext.data.SimpleStore({
                fields: ['value', 'text'],
                data: booleanData
            });
            // Crꢴions des contr孥s du formulaire
            // l'id de chaque contr孥 correspond ࡵn champ de la couche WFS  

            var referentielCombo = new Ext.form.ComboBox({
                id: 'type_ref',
                fieldLabel: '<font color=red>*</font>' + 'Référentiel',
                store: referentielStore,
                valueField: 'value',
                displayField: 'text',
                editable: false,
                mode: 'local',
                triggerAction: 'all',
                emptyText: 'Référentiel ...',
                listWidth: 167,
                allowBlank: false
            });

            var natureCombo = new Ext.form.ComboBox({
                id: 'nature_ref',
                fieldLabel: '<font color=red>*</font>' + 'nature',
                store: natureStore,
                valueField: 'value',
                displayField: 'text',
                editable: false,
                mode: 'local',
                triggerAction: 'all',
                emptyText: 'Nature ...',
                listWidth: 167,
                allowBlank: false
            });
            
            natureCombo.on('select', function(box, record, index) {
                if (record.data.value === 'modification') {
                    showField(signalForm.getForm().findField('nature_mod'));
                    signalFormWindow.setHeight(525);
                }
                else {
                   hideField(signalForm.getForm().findField('nature_mod'));
                   signalFormWindow.setHeight(500);
                }                
            });
            
            var naturemodCombo = new Ext.form.ComboBox({
                id: 'nature_mod',
                fieldLabel: '<font color=red>*</font>' + 'nature de la modification',
                store: naturemodStore,
                valueField: 'value',
                displayField: 'text',
                editable: false,
                mode: 'local',
                triggerAction: 'all',
                emptyText: 'Type de modification ...',
                listWidth: 167,
                allowBlank: false
            });
            
            var contributeurCombo = new Ext.form.ComboBox({
                id: 'contributeur',
                fieldLabel: '<font color=red>*</font>' + 'contributeur',
                store: contributeurStore,
                valueField: 'value',
                displayField: 'text',
                editable: false,
                mode: 'local',
                triggerAction: 'all',
                emptyText: 'Contributeur ...',
                listWidth: 167,
                allowBlank: false
            });

            var acteCombo = new Ext.form.ComboBox({
                id: 'acte_ref',
                fieldLabel: '<font color=red>*</font>' + 'Existence acte administratif',
                store: booleanStore,
                valueField: 'value',
                displayField: 'text',
                editable: false,
                mode: 'local',
                triggerAction: 'all',
                emptyText: 'Acte ...',
                listWidth: 167,
                allowBlank: false
            });


            /*var publicradio = new Ext.form.RadioGroup({
                id: 'public',
                fieldLabel: '<font color=red>*</font>' + 'Libération du signalement',
                columns: 2,
                items: [{
                    boxLabel: 'oui',
                    name: 'public1',
                    inputValue: 'oui'
                }, {
                    boxLabel: 'non',
                    name: 'public1',
                    inputValue: 'non'
                }]
            });*/

            
            var disclaimerPanel = new Ext.Panel({
                html:disclaimer.htmltext.value,
                //title:"Avertissement",
                frame: true});
                
            var mandatoryPanel = new Ext.Panel({
                html:'<font color=red>(*)   Champs obligatoires</font>',
                //title:"Avertissement",
                frame: true});

            // Crꢴion du formulaire de saisie
            signalForm = new Ext.FormPanel({
                labelWidth: 120,
                id: 'myForm',
                frame: true,
                monitorValid: true,
                bodyStyle: 'padding:5px 5px 0',
                width: 320,
                defaults: {
                    width: 150,
                    allowBlank: false
                },
                defaultType: 'textfield',
                items: [{
                    fieldLabel: '<font color=red>*</font>' + 'insee',
                    id: 'depco',
                    maxLength: 5,
                    minLength: 5,
                    readOnly: true
                }, {
                    fieldLabel: '<font color=red>*</font>' + 'commune',
                    id: 'libco',
                    maxLength: 50,
                    readOnly: true
                },
                referentielCombo, natureCombo, naturemodCombo, acteCombo,
                {
                    xtype: 'textarea',
                    allowBlank: true,
                    fieldLabel: 'commentaires ou description de la modification',
                    id: 'comment_ref',
                    maxLength: 100
                }, /*{
                    fieldLabel: '<font color=red>*</font>' + 'utilisateur',
                    id: 'iduser',
                    name: 'user',
                    maxLength: 10
                }, */contributeurCombo,
                {
                            fieldLabel: '<font color=red>*</font>' + 'mail',
                            xtype: 'textfield',
                            id: 'mel',
                            name: 'mail',
                            maxLength: 80
                },          
                
                //*******************************
                {
                    xtype: 'compositefield',
                    fieldLabel: 'Document 1',
                    id: 'url_1',
                    msgTarget: 'side',
                    defaults: {
                        flex: 1
                    },
                    items: [{
                        xtype: 'textfield',
                        id: 'url_12',
                        allowBlank: true,
                        maxLength: 100
                    }, {
                        xtype: 'button',
                        width: 25,
                        iconCls: 'upload-icon',
                        tooltip: 'Charger un document',
                        handler: function () {
                            createUploadForm('url_1');
                        }
                    }]
                }, {
                    xtype: 'compositefield',
                    fieldLabel: 'Document 2',
                    id: 'url_2',
                    msgTarget: 'side',
                    defaults: {
                        flex: 1
                    },
                    items: [{
                        xtype: 'textfield',
                        id: 'url_22',
                        allowBlank: true,
                        maxLength: 100
                    }, {
                        xtype: 'button',
                        width: 25,
                        iconCls: 'upload-icon',
                        tooltip: 'Charger un document',
                        handler: function () {
                            createUploadForm('url_2');
                        }
                    }]
                }],
                buttons: [{
                    text: 'supprimer',
                    formBind: true,
                    id: 'deleteBtn',
                    iconCls: "deletefeature2",
                    tooltip: 'Supprimer ce signalement',
                    handler: function () {
                        deleteIndividualSignal();
                        resetForm();
                    }
                }, {
                    text: 'Enregistrer',
                    formBind: true,
                    iconCls: "save",
                    tooltip: 'Enregistrer les modifications courantes et la géométrie',
                    handler: function () {                        
						var oFeature = getSelectedSignal();
                        saveSignal(oFeature);
                    }
                }, {
                    text: 'Annuler',
                    iconCls: "cancel",
                    tooltip: 'Annuler les modifications courantes',
                    handler: function () {
                        var oFeature = getSelectedSignal();
                        if (oFeature.state == "Insert") {
                            wfsLayer.removeFeatures([oFeature]);
                            resetForm();
                        } else {
                            oFeature.geometry = backupGeom;
                            wfsLayer.drawFeature(oFeature);
                            modifyPtCtrl.selectControl.unselect(getSelectedSignal());
                        }
                    }
                }]
            });

            // Window contenant le Panel Formulaire
            signalFormWindow = new Ext.Window({
                title: 'Signalement',
                closable: false,
                resizable: false,
                width: 333,
                height: 500,
                border: false,
                plain: true,
                region: 'center',
                items: [signalForm,  mandatoryPanel, disclaimerPanel]
            });
            signalFormWindow.render(Ext.getBody());


            return signalFormWindow;
        },
        showDeleteButton: function () {
            var outputmsg = "";
            if (deletePtCtrlAction.isHidden()) {
                deletePtCtrlAction.show();
                outputmsg = "Outil de suppression activé";
            } else {
                deletePtCtrlAction.hide();
                outputmsg = "Outil de suppression désactivé";
            }
            return outputmsg;
        }
    }
})();