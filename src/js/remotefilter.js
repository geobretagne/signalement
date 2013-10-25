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


            filterList = {
                xtype: 'fieldset',
                title: 'Autres filtres',
                autoHeight: true,
                defaultType: 'checkbox',
                items: [{
                    fieldLabel: '',
                    boxLabel: 'Signalements publics',
                    id: 'filtre_public',
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: "contributeur",
                        value: "public"
                    })
                }, {
                    fieldLabel: '',
                    labelSeparator: '',
                    boxLabel: 'Pièce jointe',
                    id: 'filtre_pj',
                    filter: new OpenLayers.Filter.Logical({
                        type: OpenLayers.Filter.Logical.OR,
                        filters: [
                            new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LIKE,
                                property: "url_1",
                                value: "http://*"
                            }),
                            new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LIKE,
                                property: "url_2",
                                value: "http://*"
                            })
                        ]
                    })
                }]
            };

            var filterForm = new Ext.form.FormPanel({
                title: 'Filtrer les signalements',
                id: 'filterForm',
                frame: true,
                padding: "20 10 15 10",
                iconCls: 'filter',
                items: [{
                        xtype: 'panel',
                        padding: "10 10 10 10",
                        html: "<b>Filtrage des signalements en jouant sur l'intervalle de temps ci dessous</b>",
                        //height:100                 
                    },
                    datefield1,
                    datefield2,
                    slider,
                    filterList,
                    progressBar
                ],
                buttons: [{
                        iconCls: "save",
                        text: "Appliquer",
                        tooltip: "Appliquer le filtre",
                        handler: function () {
                            filter.filters = [];
                            Ext.each(filterList.items, function (rec) {
                                var item = Ext.getCmp(rec.id);
                                if (item.checked) {
                                    filter.filters.push(item.filter);
                                }
                            });
                            filter.filters.push(datefilter);
                            layer.filter = filter;
                            layer.refresh()
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