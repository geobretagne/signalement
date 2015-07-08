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

Signalement.remotefilter = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;

    var toolbar = null;

    var filtre_type = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.OR,
        filters: []
    });
	var filtre_contributeur = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.OR,
        filters: []
    });
	var filtre_autre = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.OR,
        filters: []
    });
	var filtre_nature = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.OR,
        filters: []
    });

    var filter = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.AND,
        filters: []
    });

    var filterList = null;

    var datefilter = null;

    var drawPtCtrl = null;

    var progressBar = new Ext.ProgressBar({
        text: '',
        id: 'pgb1'
    });

    var frenchMonths = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    var frenchDays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    var beginDate = null;

    var today = null;

    var datefield1 = null;

    var datefield2 = null;

    var anteriority = null;

    var slider = null;

    var maximumValue = null;

    var convertDateToFr = function (date) {
        var d = new Date(date);
        var curr_date = d.getDate();
        var curr_month = d.getMonth() + 1; //months are zero based
        var curr_year = d.getFullYear();
        return curr_date + "/" + curr_month + "/" + curr_year;
    };

    var timeFilter = function (d1, d2) {
        if (drawPtCtrl.active) {
            drawPtCtrl.deactivate();
        }
        datefilter.lowerBoundary = d1;
        datefilter.upperBoundary = d2;
    };

    var getDateInterval = function (dateref, newdate) {
        var days = Math.floor((newdate - dateref) / (24 * 3600 * 1000)) + 1;
        return days;
    };

    var createTimeFilter = function (dateref, d1, d2) {
        var t1 = dateref.add(Date.DAY, d1);
        var t2 = dateref.add(Date.DAY, d2);
        var r1 = t1.toISOString().split("T")[0];
        var r2 = t2.toISOString().split("T")[0];
        timeFilter(r1, r2);
    };
    var onRemoteloadstart = function (e) {
        progressBar.show();
        progressBar.wait({
            interval: 50,
            increment: 25,
            text: ''
        });
    };
    var onRemoteloadend = function (e) {
        progressBar.reset();
        progressBar.hide();
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

        create: function (m, l, tb, a, s) {
            map = m;
            layer = l;
            layer.events.register("loadstart", '', onRemoteloadstart);
            layer.events.register("loadend", '', onRemoteloadend);
            toolbar = tb;
            drawPtCtrl = toolbar.items.item("drawptaction").baseAction.control;
            anteriority = a;
            today = new Date();
            beginDate = new Date(new Date().add(Date.MONTH, anteriority));

            maximumValue = Math.floor((today - beginDate) / (24 * 3600 * 1000)) + 1; //différence en jours

            datefilter = new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.BETWEEN,
                property: "date_saisie",
                lowerBoundary: OpenLayers.Date.toISOString(beginDate),
                upperBoundary: OpenLayers.Date.toISOString(today)
            });

            filter.filters.push(datefilter);
			layer.filter = filter;
            layer.refresh();

            Ext.apply(Ext.form.VTypes, {
                daterange: function (val, field) {
                    var date = field.parseDate(val);

                    if (!date) {
                        return false;
                    }
                    if (field.startDateField) {
                        var start = Ext.getCmp(field.startDateField);
                        if (!start.maxValue || (date.getTime() != start.maxValue.getTime())) {
                            start.setMaxValue(date);
                            start.validate();
                        }
                    } else if (field.endDateField) {
                        var end = Ext.getCmp(field.endDateField);
                        if (!end.minValue || (date.getTime() != end.minValue.getTime())) {
                            end.setMinValue(date);
                            end.validate();
                        }
                    }
                    return true;
                }
            });

            // form creation

            var timeTip = new Ext.slider.Tip({
                getText: function (thumb) {
                    return convertDateToFr(beginDate.add(Date.DAY, thumb.value));
                }
            });

            slider = new Ext.slider.MultiSlider({
                renderTo: document.body,
                width: 200,
                minValue: 0,
                increment: 1,
                maxValue: maximumValue,
                values: [0, maximumValue],
                plugins: timeTip
            });

            slider.on('changecomplete', function (sld, value, thumb) {
                var ctrl = (thumb.index === 0) ? "startdt" : "enddt";
                Ext.getCmp(ctrl).setValue(beginDate.add(Date.DAY, value));
                createTimeFilter(beginDate, sld.getValues()[0], sld.getValues()[1]);
            });

            datefield1 = new Ext.form.DateField({
                width: 100,
                minValue: new Date(2011, 11, 30),
                value: beginDate,
                fieldLabel: 'Du',
                name: 'startdt',
                id: 'startdt',
                vtype: 'daterange',
                endDateField: 'enddt' // id of the end date field
            });
            datefield1.format = "d/m/Y";
            datefield1.on('select', function (f, d) {
                slider.setValue(0, getDateInterval(beginDate, d));
                createTimeFilter(beginDate, getDateInterval(beginDate, d), slider.getValues()[1]);
            });

            datefield2 = new Ext.form.DateField({
                width: 100,
                maxValue: today,
                fieldLabel: 'Au',
                name: 'enddt',
                value: today,
                id: 'enddt',
                vtype: 'daterange'
            });
            datefield2.format = "d/m/Y";
            datefield2.on('select', function (f, d) {
                slider.setValue(1, getDateInterval(beginDate, d));
                createTimeFilter(beginDate, slider.getValues()[0], getDateInterval(beginDate, d));
            });


            filterList_autre = {
                xtype: 'fieldset',
                title: 'Autres filtres',
                autoHeight: true,
                defaultType: 'checkbox',
                items: [{
                    fieldLabel: '',
                    labelSeparator: '',
                    boxLabel: 'Comporte au moins une pièce jointe',
                    id: 'filtre_pj',
                    filter: new OpenLayers.Filter.Logical({
                        type: OpenLayers.Filter.Logical.OR,
                        filters: [
                            new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LIKE,
                                property: "url_1",
                                value: "http*"
                            }),
                            new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LIKE,
                                property: "url_2",
                                value: "http*"
                            })
                        ]
                    })
                }]
            };
            
            //...filtre voie / adresse / alerte ...
			filterList_type = {
                xtype: 'fieldset',
                title: 'Par type de référentiel',
                autoHeight: true,
                defaultType: 'checkbox',
                items: [{
                    fieldLabel: '',
                    boxLabel: 'Adresses',
                    id: 'filtre_adresse',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "type_ref",
                        value: "adresse"
                    })
                },{
                    fieldLabel: '',
                    boxLabel: 'Voies',
                    id: 'filtre_voie',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "type_ref",
                        value: "voie"
                    })
                },{
                    fieldLabel: '',
                    boxLabel: 'Alertes',
                    id: 'filtre_alerte',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "type_ref",
                        value: "alerte"
                    })
                }]
			};
			
			//... filtre creation / modification ...
			filterList_nature = {
                xtype: 'fieldset',
                title: 'Par nature des signalements',
                autoHeight: true,
                defaultType: 'checkbox',
                items: [{
                    fieldLabel: '',
                    boxLabel: 'Création',
                    id: 'filtre_creation',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "nature_ref",
                        value: "creation"
                    })
                },{
                    fieldLabel: '',
                    boxLabel: 'Modification',
                    id: 'filtre_modification',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "nature_ref",
                        value: "modification"
                    })
                },{
                    fieldLabel: '',
                    boxLabel: 'Suppression',
                    id: 'filtre_suppression',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "nature_ref",
                        value: "suppression"
                    })
                }]
			};
			
			//...filtre prive / Eurométropole Strasbourg / CAC / M2A / SDIS68 / SDIS67...
            filterList_contributeur = {
                xtype: 'fieldset',
                title: 'Par contributeur',   //présentation
                autoHeight: true,
                defaultType: 'checkbox',
                items: [{
                    fieldLabel: '',
                    boxLabel: 'Eurométropole Strasbourg',
                    id: 'filtre_cus',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "CUS" //présentation
					})
				}, {
                    fieldLabel: '',
                    boxLabel: 'CAC',
                    id: 'filtre_cac',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "CAC" //présentation
					})
                }, {
                    fieldLabel: '',
                    boxLabel: 'M2A',
                    id: 'filtre_m2a',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                       property: "contributeur", //présentation
                        value: "M2A" //présentation
					})
				}, {
                    fieldLabel: '',
                    boxLabel: 'SDIS67',
                    id: 'filtre_sdis67',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "SDIS67" //présentation
					})
                }, {
                    fieldLabel: '',
                    boxLabel: 'SDIS68',
                    id: 'filtre_sdis68',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "SDIS68" //présentation
					})
                }, {
                    fieldLabel: '',
                    boxLabel: 'Kochersberg',
                    id: 'filtre_cocoko',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "KOCHERSBERG" //présentation
					})
                }, {
                    fieldLabel: '',
                    boxLabel: 'Webpart',
                    id: 'filtre_webpart',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "WEBPART" //présentation
					})
                }, {
                    fieldLabel: '',
                    boxLabel: 'Privé',
                    id: 'filtre_prive',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LIKE,
                        property: "contributeur", //présentation
                        value: "prive" //présentation
					})
                }]
            };
            
            

            var filterdateForm = new Ext.Panel({
                title: '1) Filter par date',
                id: 'filterdateForm',
                componentCls: 'x-panel-header-rose',
                frame: true,
                items: [{
                        xtype: 'panel',
                        html: "Jouer sur l'<b>intervalle de temps</b> ci dessous"
                    },
                    datefield1,
                    datefield2,
                    slider,
                    ],
                collapsible: true,
				collapsed: false,
				animCollapse: true,
				split: false
            });
            
            var filterautreForm = new Ext.Panel({
				title: '2) Autres filtres',
                id: 'filterautreForm',
                frame: true,
                items: [{
                        xtype: 'panel',
                        html: "Jouez sur les <b>attributs</b> ci dessous. <i>Vider les cases d'une catégorie ignore le filtrage de cette catégorie.</i>",
                        //height:100                 
                    },
                    filterList_type,
					filterList_nature,
                    filterList_contributeur,
                    filterList_autre],
				collapsible: true,
				collapsed: true,
				animCollapse: true,
				split: false
            });	
            
            var filterForm = new Ext.form.FormPanel({
                title: 'Filtrer les signalements',
                id: 'filterForm',
                frame: true,
                iconCls: 'filter',
				collapsible: true,
                items: [filterdateForm,
					filterautreForm,					
                    progressBar					
                ],
                buttons: [{
                        iconCls: "save",
                        text: "Appliquer",
                        tooltip: "Appliquer le filtre",
                        handler: function () {
                            filtre_type.filters = [];
                            filtre_nature.filters = [];
                            filtre_contributeur.filters = [];
                            filtre_autre.filters = [];
                            filter.filters = [];
                            Ext.each(filterList_type.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                if (item.checked) {
                                    filtre_type.filters.push(item.filter);
                                }
                            });
                            //... filtre public/prive...
							Ext.each(filterList_contributeur.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                if (item.checked) {
                                    filtre_contributeur.filters.push(item.filter);
                                    // filter.filters.push(item.filter);
                                }
                            });
							//...filtre autre...
							Ext.each(filterList_autre.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                if (item.checked) {
                                    filtre_autre.filters.push(item.filter);
                                    // filter.filters.push(item.filter);
                                }
                            });
							//...filtre creation/modification...
							Ext.each(filterList_nature.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                if (item.checked) {
                                    filtre_nature.filters.push(item.filter);
                                    // filter.filters.push(item.filter);
                                }
                            });
                            filter.filters.push(datefilter);
                            if(filtre_type.filters.length !==0)  {filter.filters.push(filtre_type);};
                            if(filtre_contributeur.filters.length !==0)  {filter.filters.push(filtre_contributeur);};
                            if(filtre_autre.filters.length !==0)  {filter.filters.push(filtre_autre);};
                            if(filtre_nature.filters.length !==0)  {filter.filters.push(filtre_nature);};
                            layer.filter = filter;

                            layer.refresh();						
                        }
                    },
					{
						text: "Décocher tout",
                        tooltip: "Décocher toutes les checkbox",
                        handler: function () {
							var etat = false;
                        Ext.each(filterList_nature.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                item.setValue(etat);
                                }
                            );
    					Ext.each(filterList_contributeur.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                item.setValue(etat);
                                }
                            );
    					Ext.each(filterList_type.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                item.setValue(etat);
                                }
                            );
    					Ext.each(filterList_autre.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                item.setValue(etat);
                                }
                            );
    						
                        }
					}

                ]
            });

            /*drawPtCtrl.events.register("activate", '', function () {
                filterStrategy.deactivate();
            });*/

            return filterForm;
        }
    }
})();
