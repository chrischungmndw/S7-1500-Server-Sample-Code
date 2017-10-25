"use strict"; // Defines that JavaScript code should be executed in "strict mode".
// diagnostic.js
// 13.11.2015 bastian.geier@siemens.com
// read diagnosticdata from standard webserverpages and show up on user-defined-webpbages

// Changelog V0.0.2 - Date: 201-01-16
// adjustment with the browser history, remove outher "allways" event

// Changelog V0.0.2 - Date: 2016-10-19
// adjust from FW 1.8.4 to 2.01 for S7-1500 / 4.1.3 to 4.2.0 for S7-1200

// Changelog V0.0.1 - Date: 2015-11-13
// first implementation

/*************************************************************/
/** Diagnose Module 										**/
/*************************************************************/
var diagnose = (function($, undefined) {

	var model = null;
	var view = null;
	var controller = null;
	var elements = {};
	var initialized = false;
	var _plcType = null;
	var prevState;
	var prevTitle;
	var prevUrl;

	// Datenmodell
	function Model() {
		var self = this;
		
		self.loadDiagDetail = function(detailStr) {
			if (_plcType == "1200") {
				// eventcount, eventnumber, eventid, eventdata, time, date
				// "'50','8','02:400C','7','23:28:47:885','06.01.2012'"
				//console.log("String bevor :=", detailStr );
				var detailStr = detailStr.replace(/"|'|\s/g, "");
				//console.log("String after :=", detailStr );
				var detailStr = detailStr.split(",");
				//console.log("Array after  :=", detailStr );
				var eventcount	= detailStr[0];
				var eventnumber	= detailStr[1];
				var eventid		= detailStr[2];
				var eventdata	= detailStr[3];
			}
			else if (_plcType == "1500") {
				// eventnumber, eventid, eventdata, time, date
				// "'2','02:400E','0020+0001+0F00+0E40+010C+00406600+0010+3400+0200+0000+00000604+0120+0F00+1414+1414+C51C+75D0+0E40+010C+6','14:43:56.179','07.11.2015'"
				//console.log("String bevor :=", detailStr );
				var detailStr = detailStr.replace(/"|'|\s/g, "");
				//console.log("String after :=", detailStr );
				var detailStr = detailStr.split(",");
				var eventnumber	= detailStr[0];
				var eventid		= detailStr[1];
				var eventdata	= detailStr[2];
				
				var script = $("#diagTableDiv > table tbody tr:first script").html();
				//console.info( script );
				var start = script.indexOf("var eventcount="); 
					start = script.indexOf("=", start) + 1;
				var end = script.indexOf(";", start);
				
				var eventcount = parseInt( script.slice(start,end), 10 );
				
				//console.info( start, end, eventcount );
				
				var eventcount	= detailStr[0];
			}
			else {
				console.error("Wrong PLC Type given to diagnose.initialize('plcType');");
				return false;
			}
			
			var linkDetail = '/ClientArea/DiagDetail.mwsl';
			linkDetail += ('?EventNumber=' + eventnumber + '&EventID=' + eventid + '&EventData=' + eventdata) + ((eventcount != "")? ('&EventCount=' + eventcount) : "");
			
			var linkDetailLong = '/ClientArea/DiagLong.mwsl';
			linkDetailLong += '?EventNumber=' + eventnumber + '&EventData=' + eventdata;
			
			$.get(location.origin + linkDetail , "")
				.done(function(ret_val){ // .complete
					//console.log(ret_val);
					var div = $('<div/>').html(ret_val);
					// in case of new firmware V2.0.1 we dont need to make another call :-)
					if(div.find("#EventLongText").length > 0){
						$(elements.pages.diagDetail.No).html( "Detail No.: " + eventnumber );
						$(elements.pages.diagDetail.EventID).html( "Event-ID: 16# " + eventid );
						$(elements.pages.diagDetail.Text).html( div.find("#EventLongText").html() );
					}
					else{
						// set referer to main entrypage of webserver --> Portal.mwsl
						if( location.origin != "null" && location.origin != "file://" ){
							history.pushState({ MyObj: "PriNav" }, "PriNav", linkDetail);
						}
						$.get(location.origin + linkDetailLong , "")
						.done(function(ret_val){ // .complete
							//console.log(ret_val);
							
							var div = $('<div/>').html(ret_val)
							var diagLongText = "";
							
							if (_plcType == "1200") {
								diagLongText = div.find("#diagLongTextDiv").html();
								if(diagLongText == undefined)
									diagLongText = div.find(".ContentLongText").parent().html();
							}
							else if (_plcType == "1500") {
								diagLongText = div.find("td").html();
							}
							else {
								console.error("Wrong PLC Type given to diagnose.initialize('plcType');");
								return false;
							}
							
							$(elements.pages.diagDetail.No).html( "Detail No.: " + eventnumber );
							$(elements.pages.diagDetail.EventID).html( "Event-ID: 16# " + eventid );
							$(elements.pages.diagDetail.Text).html( diagLongText );
						});
						history.replaceState(prevState, prevTitle, prevUrl);
					}
				});
				history.replaceState(prevState, prevTitle, prevUrl);
		}
		
		self.loadDiagTable = function(index) {
			// set referer to main entrypage of webserver --> Portal.mwsl
			if( location.origin != "null" && location.origin != "file://" ){
				history.pushState({ MyObj: "PriNav" }, "PriNav", location.origin + "/Portal/Portal.mwsl?PriNav=Diag");
			}
			// calculate start and end index
			var res;
			var start = 0;
			var end =   0;
			var url = "";
			
			if (_plcType == "1200" && index.includes("ThrNav")) {
				// build URL
				url = location.origin + "/ClientArea/DiagTable.mwsl?" + index;
			}
			else if (_plcType == "1200" && index.includes("Diag")) {
				res = parseInt(index.replace("Diag", ""));
				start = (res - 1) * 25 + 1;
				end =    res * 25;
				// build URL
				url = location.origin + "/ClientArea/DiagTable.mwsl?Start=" + start + "&End=" + end;
			}
			else if (_plcType == "1500" && index.includes("Diag")) {
				res = parseInt(index.replace("Diag", ""));
				start = (res - 1) * 50 + 1;
				end =    res * 50;
				// build URL
				url = location.origin + "/ClientArea/DiagTable.mwsl?Start=" + start + "&End=" + end;
			}
			else {
				console.error("Wrong PLC Type given to diagnose.initialize('plcType');");
				return false;
			}
			
			$.get(url , "", function(ret_val){})
				.done(function(ret_val){ // .complete
					// create temp html element
					var div = $('<div/>').html(ret_val)
					var table = null;
					
					if (_plcType == "1200") {
						table = div.find("#updateDiagDiv").html();
						if(table == null)
							table = div.find("#diag_table").parent().html();
					}
					else if (_plcType == "1500") {
						table = div.find("#UpdateDiagDiv").html();
					}
					else {
						console.error("Wrong PLC Type given to diagnose.initialize('plcType');");
						return false;
					}
					
					$(elements.pages.diagTableDiv).html( table );
					if($(elements.pages.diagTable.onclick).length > 0)
					{
						$(elements.pages.diagTable.onclick).each(function(){
							if ($(this).attr("onClick") == undefined) return true;
							var tOnclickAtt = $(this).attr("onclick");
							tOnclickAtt = tOnclickAtt.replace("SelectRow(", "");
							tOnclickAtt = tOnclickAtt.replace(")", "");
							//$(this).removeAttr("onclick").data("diag", tOnclickAtt);
							$(this).removeAttr("onclick").attr('data-diag', tOnclickAtt);
							
							// Eventhandler for Table Row ONCLICK diagnostic page
							$(elements.pages.diagTable.data).off();
							$(elements.pages.diagTable.data).click(function(){
								$(elements.pages.diagTable.selected).removeAttr("id").removeClass("rowSelected").addClass("rowVisited");
								$(this).removeClass("rowNonselected rowVisited").addClass("rowSelected").attr('id', 'rowSelected');
								
								var detailStr = $(this).attr('data-diag');
								//console.log("Click on TR", detailStr );
								self.loadDiagDetail( detailStr );
							});
						});
						$(elements.pages.diagTable.data).first().trigger("click");
					}
					else
					{
						$("#diagTableDiv > table.ContentTable").off();
						$("#diagTableDiv > table.ContentTable tbody tr[data-event-number]").each(function(){
							$(this).click(function(){
								$("#diagTableDiv > table.ContentTable tbody tr[id=rowSelected]").removeAttr("id").removeClass("rowSelected").addClass("rowVisited");
								$(this).removeClass("rowNonselected rowVisited").addClass("rowSelected").attr('id', 'rowSelected');
									// eventcount, eventnumber, eventid, eventdata, time, date
									// "'50','8','02:400C','7','23:28:47:885','06.01.2012'"
									// <tr class="table_row" data-event-number="4" data-event-id="02:4000" data-event-data="0240001264FA18DE8FE1F801">
								var detailStr = " ," + $(this).attr('data-event-number') + "," + $(this).attr('data-event-id') + "," + $(this).attr('data-event-data');
								//console.log("Click on TR", detailStr );
								self.loadDiagDetail( detailStr );
							});
						});
						
						$("#diagTableDiv > table.ContentTable tbody tr[data-event-number]").first().trigger("click");
					}
				});
				history.replaceState(prevState, prevTitle, prevUrl);
		}
		
		self.loadDiagMain = function() {
			// set referer to main entrypage of webserver --> Portal.mwsl
			if( location.origin != "null" && location.origin != "file://" ){
				history.pushState({ MyObj: "PriNav" }, "PriNav", location.origin + "/Portal/Portal.mwsl?PriNav=Diag");
			}
			// load startinformation, how many diag entrys are inside the plc
			$.get(location.origin + "/Portal/Portal.mwsl?PriNav=Diag", "", function(ret_val){})
				.done(function(ret_val){ // .complete
					//console.log(ret_val);
					var div = $('<div/>').html(ret_val);
					var options = div.find("select[name=ThrNav]").html();
					//console.log(options);
					$(elements.pages.diagSelector).html( options );
					$(elements.pages.diagSelector).find("option").each(function() {
						var str = $(this).val();
						var res;
						if(str.includes("Diag"))
							res = str.replace("DiagTable", "Diag");
						else
							res = "ThrNav=" + str;
						
						$(this).val( res );
					});
					// first call startindex is ONE
					model.loadDiagTable( $(elements.pages.diagSelector).val() );
				});
				history.replaceState(prevState, prevTitle, prevUrl);
		}
	} // Model

	// Reagiert auf Aenderungs-Events des Model und aktualisiert die Anzeige
	function View() {
		var self = this;
		
		self.resize = function(){
			/*
			elements.container.outerWidth( elements.container.parent().width() - 20 );
			elements.container.outerHeight( elements.container.parent().height() - 30 );
			
			elements.pages.diagnose.iframeTable.width( elements.container.width() - 0 );
			elements.pages.diagnose.iframeTable.height( elements.container.height() - 0 );
			*/
		} // resize
	} // View

	// Reagiert auf UI-Events und setzt die Variablen in Model entsprechend
	function Controller() {
		var self = this;
		
		// Initialisiert das Modul.
		// Wird beim Auswaehlen der HWConfi aus dem Menue aufgerufen.
		self.initialize = function(plcType) {
			// falls schon initialisiert wurde, zurueck
			if (!initialized) {
				// Kennzeichen setzen, dass OBJEKT Instanziert wurde
				initialized = true;
				
				// save CPU Typ from arguments to local object storage
				if (arguments.length >= 1) {
					_plcType = plcType;
				}
				else {
					console.error("Missing Parameter @ diagnose.initialize(plcType)", "\n", "Initialisation aborted!!!");
					return false;
				}
				
				// Model und View Instanzen erzeugen
				model = new Model();
				view = new View();
				
				// relevante Elemente referenzieren
				elements.pages = $("#content");
				elements.pages.diagSelector = "select[name=diagSelector]";
				elements.pages.diagTableDiv = "#diagTableDiv";
				elements.pages.diagTable = $("#diagTableDiv > table");
				elements.pages.diagTable.onclick = "#diagTableDiv > table tbody tr[onclick]";
				elements.pages.diagTable.data = "#diagTableDiv > table tbody tr[data-diag]";
				elements.pages.diagTable.selected = "#diagTableDiv > table tbody tr[id=rowSelected]";
				elements.pages.diagDetail = $("#diagDetailDiv");
				elements.pages.diagDetail.No = "#diagDetailNo";
				elements.pages.diagDetail.EventID = "#diagDetailEventID";
				elements.pages.diagDetail.Text = "#diagDetailText";
				
				$(window).resize(function() {
					view.resize();
				});
				
				// Eventhandler for SELECT diagnostic page
				$(elements.pages.diagSelector).change(function(){
					model.loadDiagTable( $(this).val() );
				});
				
				prevState = history.state;
				prevTitle = document.title;
				prevUrl = location.href;
			}
			
			// daten laden
			model.loadDiagMain();

			return true;
		} // initialize
	} // Controller

	// Controller erzeugen
	controller = new Controller();
	return controller;
})(jQuery);
