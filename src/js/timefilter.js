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

Signalement.timefilter = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;
    
   var toolbar = null;
   
   var drawPtCtrl = null;
    
    var frenchMonths = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    
    var frenchDays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi","Samedi"];
    
        
    var beginDate = null;
    
    var today = null;   
    
    var datefield1 = null;
    
    var datefield2 = null;
    
    var filter = null;

    var anteriority = null;
  
    var filterStrategy = null;
    
    var slider = null;
    
    var maximumValue = null;	
    
    var convertDateToFr = function (date) {
          var d = new Date(date);
          var curr_date = d.getDate();
          var curr_month = d.getMonth() + 1; //months are zero based
          var curr_year = d.getFullYear();
          return curr_date + "/" + curr_month + "/" + curr_year ;
        };

    var timeFilter = function (d1,d2) {
          if (drawPtCtrl.active){
            drawPtCtrl.deactivate();
          }  
          if (!filterStrategy.layer){
            filterStrategy.setLayer(layer);
          }    
          if (filterStrategy.active == false){      
              filterStrategy.activate();
          }
          filter.lowerBoundary = d1;
            filter.upperBoundary = d2;
            filterStrategy.setFilter(filter);  
        };

    var getDateInterval = function (dateref,newdate) {
         var days = Math.floor((newdate - dateref) / (24*3600*1000)) +1;         
        return days;
        };

    var createFilter = function (dateref,d1,d2) {
            var t1 = dateref.add(Date.DAY,d1);
            //t1.setUTCHours(0,0,0,0);
            var t2 = dateref.add(Date.DAY, d2);
            //t2.setUTCHours(23,59,59,59);            
            var r1 = t1.toISOString().split("T")[0];
            var r2 = t2.toISOString().split("T")[0];
            timeFilter(r1,r2); 
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

        create: function (m,l,tb,a) {
            map = m;
            layer = l;
            toolbar = tb;
            drawPtCtrl = toolbar.items.item("drawptaction").baseAction.control;
            //ctrl = c;
            //Date.monthNames = frenchMonths;
            //Date.dayNames = frenchDays;
            anteriority = a;
            today = new Date();
            //today.setHours(23,59,59);
            beginDate = new Date(new Date().add(Date.MONTH, anteriority));
            //beginDate.setHours(0,0,1);            
                       
            maximumValue = Math.floor((today - beginDate)/(24*3600*1000)) +1;//différence en jours
            filter = new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.BETWEEN,
                property: "date_saisie",
                lowerBoundary: OpenLayers.Date.toISOString(beginDate),
                upperBoundary: OpenLayers.Date.toISOString(today)
            });
            filterStrategy = new OpenLayers.Strategy.Filter({filter: filter});
            
            Ext.apply(Ext.form.VTypes, {
                daterange : function(val, field) {
                    var date = field.parseDate(val);

                    if(!date){
                        return false;
                    }
                    if (field.startDateField) {
                        var start = Ext.getCmp(field.startDateField);
                        if (!start.maxValue || (date.getTime() != start.maxValue.getTime())) {
                            start.setMaxValue(date);
                            start.validate();
                        }
                    }
                    else if (field.endDateField) {
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
                getText: function(thumb){
                    return convertDateToFr(beginDate.add(Date.DAY,thumb.value));
                }
            });
            
            slider = new Ext.slider.MultiSlider({
                renderTo:document.body,
                width :200,
                minValue : 0,
                increment:1,
                maxValue:maximumValue,
                values:[0,maximumValue],    
                plugins:timeTip    
            });
              
            slider.on('changecomplete', function(sld,value,thumb) {
                var ctrl = (thumb.index ===0)? "startdt" : "enddt";
                Ext.getCmp(ctrl).setValue(beginDate.add(Date.DAY,value));
                createFilter(beginDate,sld.getValues()[0],sld.getValues()[1]);    
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
            datefield1.on('select',function(f,d){
                            slider.setValue(0,getDateInterval(beginDate,d ));
                            createFilter(beginDate,getDateInterval(beginDate,d),slider.getValues()[1]);
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
            datefield2.on('select',function(f,d){
                            slider.setValue(1,getDateInterval(beginDate,d));
                            createFilter(beginDate,slider.getValues()[0],getDateInterval(beginDate,d));
            });
             
             var timeFilterForm = new Ext.form.FormPanel({
                title: 'Filtrer les signalements',    
                id: 'filterForm',   
                frame: true,
                iconCls:'filter',
                items: [{
                  xtype:'panel',
                  html:"<b>Filtrage des signalements en jouant sur l'intervalle de temps ci dessous</b>",
                  height:100                 
                  },
                  datefield1,
                  datefield2,                 
                  slider
                  ]
              });
              
            drawPtCtrl.events.register("activate", '', function(){filterStrategy.deactivate();}); // FILTER TIME
			
            return timeFilterForm;
        }
    }
})();