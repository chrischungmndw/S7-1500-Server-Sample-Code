"use strict"; // Defines that JavaScript code should be executed in "strict mode".
// SIMATIC S7 PLC Controller Framework - using jQuery Framework

// changeLog
// V0.1.__ - 2017-____
// insert Option in AJAX Call for DataLoagf read functionality --> CACHE:False

// V0.1.12 - 2017-01-16
// change behaviour of read and write functions
// combine them into one general function and call them from each other
// change behaviour of "readDataLog" --> move "history.replaceState" out of "allways" event to the end of the function call!

// V0.1.11 - 2016-11-07
// add String.prototype.includes, ass IE dont'support it as standard functionality

// V0.1.10 - 2016-10-19
// add FileBrowser functionality,
// adjustments for FW 1.8.4 --> 2.0.1 and FW 4.1.3 --> 4.2.0

// V0.1.9 - 2016-10-12
// READ and WRITE - remove bug with unknown variable DATA in case of post fails...

// V0.1.8 - 2016-03-14
// var initializedRetVal insert to store init status

// V0.1.7 - 2015-11-16
// loginCheck() --> eingefügt
// AJAX Start / STOP Event eingefügt
// showHideIndicator() --> eingefügt, verhindert anzeige des Ladindikators
// change function Names to camelCasing

// V0.1.6 - 2015-11-12
// String.prototype.trim --> eingefügt

// V0.1.5 - 2015-11-03
// menuHighlight() --> eingefügt
// readDataLog() --> eingefügt

// V0.1.4 - 2015-09-16
// Change ALERT Windows to --> console.ERROR()

// V0.1.3 - 2015-09-11
// insert INIT Function
// Insert AJAX request Storage
// Insert AJAX Abort function

// V0.1.2 - Date: 2015-09-04
// Change conversation for LREAL --> add Fct HexToLongFloat

var S7Framework = (function($, undefined){
	// type of variable - 0=Bool, 1=unsigned INT, 2=signed INT, 3=real, 4=LReal, 5=String 
	var BOOL = 0, UINT = 1, INT = 2, REAL = 3, LREAL = 4, STRING = 5;
	var DEBUG = false;
	var initialized = false;
	var initializedRetVal = false;

	function htmlDecodeEntities(value) {
		return (typeof value === 'undefined') ? '' : $('<div/>').html(value).text();
	}

	function strTrim(x) {
		return x.replace(/^\s+|\s+$/gm,'');
	}

	function convString(DATA, LEN, TYPE, STR, ERROR) {
		var i = 0, j = 0;
		var values = [];
		// remove every form of white space
		DATA = htmlDecodeEntities(DATA);
		DATA = DATA.replace(/"|'|\s/g, "");
		LEN  = LEN.replace(/"|'|\s/g, "");
		TYPE = TYPE.replace(/"|'|\s/g, "");
		STR = htmlDecodeEntities(STR);
		STR = STR.replace(/"|'|\s/g, "");
		console.assert(!DEBUG,"CONV Items:=", DATA, LEN, TYPE, STR);
//		console.log("CONV Items:=", DATA, LEN, TYPE, STR);
		LEN = LEN.split(";");
		TYPE = TYPE.split(";");
		STR = STR.split(";");
		// convert LEN & TYPE to integer
		while(i < LEN.length){
			LEN[i]  = parseInt(LEN[i],10);
			TYPE[i] = parseInt(TYPE[i],10);
			i++;
		}
		i = 0;
		// loop trough string, disassembly and extract content
		while((j < DATA.length) && (i < LEN.length)){
			values[i] = (TYPE[i] != 5 ) ? convAsciiToHex(DATA.substr(j,LEN[i]),LEN[i]) : DATA.substr(j,LEN[i]);
			console.assert(!DEBUG,"Decode string part :=", i, values[i], TYPE[i]);
//			console.log("Decode string part :=", i, values[i], TYPE[i]);
			switch(TYPE[i]){
				case 0: // BOOL
					values[i] = HexToBool(values[i]);
					break;
				case 1: // INT
				case 2: // INT
					values[i] = HexToInt(values[i],TYPE[i],LEN[i]);
					break;
				case 3: // Real
					values[i] = HexToReal(values[i]);
					break;
				case 4: // LReal
					//values[i] = HexToLReal(values[i]);
					values[i] = HexToLongFloat(DATA.substr(j,LEN[i]));
					break;
				case 5: // String
					// nothing to do
					break;
				default:
					console.error("Type input failure in function -convString()- @ index" + i + "\n" + ERROR);
					break;
			}
			j += LEN[i];
			i++;
		}
		for(var index in STR) {
			values[i] = STR[index];
			i++;
		}
		return values
	}

	function convAsciiToHex(ASCII, N){
		var result = 0;
		var zeichen = 0;
		for(var i=0; i<N; i++){
			if(('0' <= ASCII[i]) && (ASCII[i] <= '9')){
				zeichen = ASCII.charCodeAt(i) - 48;
			}
			else if(('A'<=ASCII[i])&&(ASCII[i]<='F')){
				zeichen = ASCII.charCodeAt(i) - 55;
			}
			else if(('a'<=ASCII[i])&&(ASCII[i]<='f')){
				zeichen = ASCII.charCodeAt(i) - 87;
			}
			else{
				console.error("Character Failure = -" + ASCII + "-, " + N);
				//alert("Character Failure = -" + ASCII + "-, " + N);
				return Math.NaN;
			}
			result += zeichen * Math.pow(16, N-1-i);
		}
		return result;
	}

	function HexToBool(t_Bool){
		return (t_Bool === "1" || t_Bool === 1 || t_Bool === true)? true : false;
	}

	function HexToInt(number,TYPE,LEN){
		var result = 0, sign = 0;
		switch (TYPE){
			case 1: // UNSigned INT
				//alert("UInt");
				return number;
				break;
			case 2: // Signed INT
				//alert("Int");
				switch(LEN){
					case 2: // 8Bit Signed SINT
						sign = (number & 0x80)? 1 : 0;
						return (number & 0x7F) - sign*128;
					case 4: // 16Bit Signed INT	
						sign = (number & 0x8000)? 1 : 0;
						return (number & 0x7FFF) - sign*32768;
					case 8: // 32Bit Signed DINT
						sign = (number & 0x80000000)? 1 : 0;
						return (number & 0x7FFFFFFF) - sign*2147483648;
					case 16: // 64Bit Signed LINT
						sign = (number & 0x8000000000000000)? 1 : 0;
						return (number & 0x7FFFFFFFFFFFFFFF) - sign*9223372036854775808;
					default:
						console.error("Type INT LENGTH input failure, number, type, lenght := ", number, TYPE, LEN);
						//alert("Type INT LENGTH input failure");
						return Number.NaN;
				}
			default:
				console.error("Type input failure number, type, lenght := ", number, TYPE, LEN);
				//alert("Type input failure");
				return Number.NaN;
		}
	}

	function HexToReal(number){ // 32 Bit - single prescision -- just for normalized numbers
		var sign		= (number & 0x80000000);		// sign: 0=positive
		var exponent	= (number & 0x7F800000) >> 23;	// exponent
		var mantissa	= (number & 0x007FFFFF);		// mantissa

		if(exponent == 0x0000){									// special: zero
			if(mantissa != 0)									// positive denormalized
				return Number.NaN;
			else												// normalized numbers
				return sign ? -0.0 : +0.0;
		}
		else if(exponent == 0x00FF){							// 255 - special: ±INF or NaN
			if(mantissa != 0){									// is mantissa non-zero? indicates NaN
				return Number.NaN;
			}
			else{												// otherwise it's ±INF
				return sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
			}
		}
		mantissa |= 0x00800000;

		exponent -= 127;										// adjust by BIAS
		var float_val = mantissa * Math.pow(2, exponent-23);			// compute absolute result
		return sign ? -float_val : +float_val;					// and return positive or negative depending on sign
	}

	function HexToLReal(number){ // 64 Bit - double prescision -- just for normalized numbers
		var sign		= (number & 0x8000000000000000);		// sign: 0=positive
		//var exponent	= (number & 0x7FF0000000000000) >> 52;	// exponent
		//var exponent	= (number & 0x7FF0000000000000);	// exponent
		//var exponent	= number / Math.pow(2, 52);	// exponent
		var exponent	= (number) >> 52;	// exponent
		exponent &= 0x7FF;
		var mantissa	= (number & 0x000FFFFFFFFFFFFF);		// mantissa

		if(exponent == 0x0000){									// special: zero
			if(mantissa != 0)									// positive denormalized
				return Number.NaN;
			else												// normalized numbers
				return sign ? -0.0 : +0.0;
		}
		else if(exponent == 0x07FE){							// 2047 - special: ±INF or NaN
			if(mantissa != 0){									// is mantissa non-zero? indicates NaN
				return Number.NaN;
			}
			else{												// otherwise it's ±INF
				return sign ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
			}
		}
		mantissa |= 0x0001000000000000;

		exponent -= 1023;										// adjust exponent by BIAS
		float_val = mantissa * Math.pow(2, exponent-52);				// compute absolute result
		return sign ? -float_val : +float_val;					// and return positive or negative depending on sign
	}

	function HexToLongFloat(longStr){ // 64 Bit - double prescision -- just for normalized numbers
		var buffer = new ArrayBuffer(8);
		var bytes = new Uint8Array(buffer);
		var doubles = new Float64Array(buffer); // not supported in Chrome

		for (var x = 0; x < 8; x++) {
			bytes[7-x] = convAsciiToHex(longStr.substr(x*2,x*2+2),2);
		}
		return doubles[0];
	}

	function VarToASCIIString(VARIABLE,LEN){
		var t_string = '';
		var t_byte = 0x00;
		
		while(LEN > 0){
			t_byte = VARIABLE & 0x0F; // select last nibble
			if(t_byte < 10){ // if smaller add '0'
				t_byte += 48;
			}
			else{ // if greater add 'A'
				t_byte += 55;
			}
			t_string = String.fromCharCode(t_byte) + t_string;
			VARIABLE >>= 4; // shift 4 bit right
			LEN--;
		}
		return t_string;
	}

	function floatToReal(number){
		n = +number,
		status = ((n !== n) || n == -Infinity || n == +Infinity) ? n : 0,
		exp = 0,
		len = 281, // 2 * 127 + 1 + 23 + 3,
		bin = new Array(len),
		signal = (n = status !== 0 ? 0 : n) < 0,
		n = Math.abs(n),
		intPart = Math.floor(n),
		floatPart = n - intPart,
		i, lastBit, rounded, j, exponent;

		if(status !== 0){
			if(n !== n){
				return 0x7fc00000;
			}
			if(n === Infinity){
				return 0x7f800000;
			}
			if(n === -Infinity){
				return 0xff800000
			}
		}

		i = len;
		while(i){
			bin[--i] = 0;
		}

		i = 129;
		while(intPart && i){
			bin[--i] = intPart % 2;
			intPart = Math.floor(intPart / 2);
		}

		i = 128;
		while(floatPart > 0 && i){
			(bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart;
		}

		i = -1;
		while(++i < len && !bin[i]);

		if(bin[(lastBit = 22 + (i = (exp = 128 - i) >= -126 && exp <= 127 ? i + 1 : 128 - (exp = -127))) + 1]){
			if(!(rounded = bin[lastBit])){
				j = lastBit + 2;
				while(!rounded && j < len){
					rounded = bin[j++];
				}
			}

			j = lastBit + 1;
			while(rounded && --j >= 0){
				(bin[j] = !bin[j] - 0) && (rounded = 0);
			}
		}
		i = i - 2 < 0 ? -1 : i - 3;
		while(++i < len && !bin[i]);
		((exp = 128 - i) >= -126 && exp <= 127) ? ++i : exp < -126 && (i = 255, exp = -127);
		((intPart || status !== 0) && (exp = 128, i = 129, status == -Infinity) ? signal = 1 : (status !== status) && (bin[i] = 1));

		n = Math.abs(exp + 127);
		exponent = 0;
		j = 0;
		while(j < 8){
			exponent += (n % 2) << j;
			n >>= 1;
			j++;
		}

		var mantissa = 0;
		n = i + 23;
		for(; i < n; i++){
			mantissa = (mantissa << 1) + bin[i];
		}
		return ((signal ? 0x80000000 : 0) + (exponent << 23) + mantissa) | 0;
	}

	function readWriteToPLC(URL,DATA,ERROR,CALLBACK_OK,CALLBACK_ERROR){
		$.post(URL, DATA)
		.done(function(returnData){ // .success
			//alert("Write Data return Values: "+returnData);
			if(CALLBACK_OK != undefined && typeof CALLBACK_OK == 'function'){
				var obj = jQuery.parseJSON(returnData);
				var values = [];
				values = convString(obj.val, obj.len, obj.typ, obj.str, ERROR);
				CALLBACK_OK(values);
			}
		})
		.fail(function(returnData){ // .error
			if(CALLBACK_ERROR != undefined && typeof CALLBACK_ERROR == 'function'){
				CALLBACK_ERROR();
			}
			console.error("Error occurred while readWriteToPLC data\n"+ERROR+"\nData:\n"+returnData);
		});
	}

	function Controller () {
		var self = this;
		// Array für AJAX Requests
		var _xhrPool = [];
		// CPU Type ffor different functions
		var _plcType = null;
		// ID for Load image indicator
		var _loadImageID = null;
		var _loadImage = true;
		// Logon Variable
		var _logOnOff = true;

		// Logincheck
		self.loginCheck = function(){
			/*
			var iFrame = $("#WebserverIFrame").contents();
			var loginForm = iFrame.find("#loginForm"); //S7-1200 FW4.0
			if (loginForm == null){
				loginForm = iFrame.find("Login_Area_Form"); //S7-1200 FW2.2 and S7-1500 FW1.5
			}
			if(loginForm){
				$("#loginBox").html( loginForm.parent().html() );
				_logOnOff = false; // logged out
			}
			
			var logoutForm = iFrame.find("#logoutForm"); //S7-1200 FW4.0
			if(logoutForm == null){
				logoutForm = iFrame.find("#logout_form"); //S7-1200 FW2.2
			}
			if(logoutForm == null){
				logoutForm = iFrame.find("#Logout_Area_Form"); //S7-1500 FW1.5
			}
			if(logoutForm){
				$("#loginBox").html( logoutForm.parent().html() );
				document.getElementsByName("Redirection")[0]["value"] = window.location.href.split("?")[0]; // use the current webpage as redirection - remove additonal post values attached by "?" if necessary
				_logOnOff = true; // logged in
			}
			*/
			var iFrameElement = document.getElementById('WebserverIFrame');
			var loginForm = iFrameElement.contentWindow.document.getElementById('loginForm'); //S7-1200 FW4.0
			if (loginForm == null){
				loginForm = iFrameElement.contentWindow.document.getElementById('Login_Area_Form'); //S7-1200 FW2.2 and S7-1500 FW1.5
			}
			if(loginForm){
				document.getElementById('loginBox').innerHTML = loginForm.parentNode.innerHTML;
				_logOnOff = false; // logged out
			}
			
			
			
			var logoutForm = iFrameElement.contentWindow.document.getElementById('logoutForm'); //S7-1200 FW4.0
			if(logoutForm == null){
				logoutForm = iFrameElement.contentWindow.document.getElementById('logout_form'); //S7-1200 FW2.2
			}
			if(logoutForm == null){
				logoutForm = iFrameElement.contentWindow.document.getElementById('Logout_Area_Form'); //S7-1500 FW1.5
			}
			if(logoutForm){
				document.getElementById('loginBox').innerHTML = logoutForm.parentNode.innerHTML;
				document.getElementsByName("Redirection")[0]["value"] = window.location.href.split("?")[0]; // use the current webpage as redirection - remove additonal post values attached by "?" if necessary
				_logOnOff = true; // logged in
			}
			
			// return _logOnOff Variable
			if(_logOnOff == false && window.location.hostname){
				//alert("Please log in!"); // Alert if not logged in --> can't change values !!!
				_logOnOff = false;
				return _logOnOff;
			}
			else{
				// alert("logged ON");
				_logOnOff = true;
				return _logOnOff;
			}
		}

		// Check links and set class menuActive
		self.menuHighlight = function(){
			var loc	= location.href;							// get actual location
			var ref	= document.links;							// get all links
			for (var i=0; i<ref.length; i++){					// run trough the links
				if(loc == ref[i].href){							// location and link match
					ref[i].parentNode.className = "menuActive";	// add class
					//ref[i].removeAttribute("href");			// remove link
					break;										// leave the loop
				}
			}
		}

		// Check numeric inputs in range FUNCTION CALL --> $("#dev_table").change(limitInput);
		self.limitInput = function(){ // Check Device Table number input is in limits
			if(parseInt($(this).val(),10) > parseInt($(this).prop("max"),10)){
				$(this).val(parseInt($(this).prop("max"),10));
			}
			else if (parseInt($(this).val(),10) < parseInt($(this).prop("min"),10)){
				$(this).val(parseInt($(this).prop("min"),10));
			}
		};

		self.spriteSwitch = function(VAL, ARRAY_IMG, ARRAY_TXT, IMG_ID, TXT_ID){
			ARRAY_TXT[0] = VAL; // save new index
			// graphic values
			$(IMG_ID).css({"background-position": ARRAY_IMG[VAL][0] + "px " + ARRAY_IMG[VAL][1] + "px"});
			$(IMG_ID).prop({alt: ARRAY_TXT[VAL], title: ARRAY_TXT[VAL]});
			// span text
			if($(TXT_ID)) $(TXT_ID).text(ARRAY_TXT[VAL]);
		}

		self.fillTable = function(ID, CELL, VAL){
			var select = "table[id='" + ID + "'] tbody tr td:nth-of-type(" + CELL + ")";
			$(select).each(function(index){
				if(index < VAL.length){
					$(this).closest('tr').show();
					$(this).text(VAL[index]);
				}
				else{
					$(this).closest('tr').hide();
				}
			});
		}

		self.fillTable2 = function(ID, VAL){
			var select = "table[id='" + ID + "'] tbody tr td:nth-of-type(2)";
			$(select).each(function(index){
				if(index < VAL.length){
					$(this).closest('tr').show();
					$(this).text(VAL[index]);
				}
				else{
					$(this).closest('tr').hide();
				}
			});
		}

		self.writeData = function(URL,DATA,ERROR,CALLBACK_OK,CALLBACK_ERROR){
			// check if logged on or NOT --> if NOT --> can't write DATA
		//	if(log == false && window.location.hostname){
		//		alert("You need to log on in order to write Data!!!\nPlease log in!"); // Alert if not logged in --> can't change values !!!
		//		return false;
		//	}
			readWriteToPLC(URL,DATA,ERROR,CALLBACK_OK,CALLBACK_ERROR);
		}

		self.writeForm = function(URL,ID,ERROR,CALLBACK_OK,CALLBACK_ERROR){
			// check if logged on or NOT --> if NOT --> can't write DATA
		//	if(log == false && window.location.hostname){
		//		alert("You need to log on in order to write Data!!!\nPlease log in!"); // Alert if not logged in --> can't change values !!!
		//		return false;
		//	}
			readWriteToPLC(URL,$(ID).serialize(),ERROR,CALLBACK_OK,CALLBACK_ERROR);
		}

		self.readData = function(URL,ERROR,CALLBACK_OK,CALLBACK_ERROR) { // load data
			readWriteToPLC(URL,'',ERROR,CALLBACK_OK,CALLBACK_ERROR);
		}

		// read dataLogs from filebrowser and return content as String
		self.readDataLog = function(NAME,ERROR,CALLBACK_OK,CALLBACK_ERROR) { // load Data Log --> CSV File
			var prevState = history.state;
			var prevTitle = document.title;
			var prevUrl = location.href;
			var url = "";
			// set referer to main entrypage of webserver --> Portal.mwsl
			if( location.origin != "null" && location.origin != "file://" ){
				if (self._plcType == "1500") {
					history.pushState({ MyObj: "PriNav" }, "PriNav", location.origin + "/Portal/Portal.mwsl?PriNav=Filebrowser&Path=/DataLogs/");
					url = location.origin + "/Filebrowser?Path=/DataLogs/" + NAME + ".csv&RAW";
				}
				else if (self._plcType == "1200") {
					history.pushState({ MyObj: "PriNav" }, "PriNav", location.origin + "/Portal/Portal.mwsl?PriNav=FileBrowser&Path=/DataLogs/");
					url = location.origin + "/FileBrowser/Download?Path=/DataLogs/" + NAME + ".csv";
				}
				else {
					console.info('Wrong CPU TYPE Parameter given to S7Framework.initialize("plcType",....);\n "1200" or "1500" are possible types');
					return false;
				}
			}
			else {
				url = NAME + ".csv";
			}
			console.assert(!DEBUG,"DataLog URL:", url);
			$.ajax({ type: "GET", url: url, data: "", dataType: "text", cache: false })
				.done(function(CSVdata){ // .success
					if(CALLBACK_OK != undefined && typeof CALLBACK_OK == 'function'){
						CALLBACK_OK(CSVdata);
					}
				})
				.fail(function(CSVdata){ // .error
					if(CALLBACK_ERROR != undefined && typeof CALLBACK_ERROR == 'function'){
						CALLBACK_ERROR(CSVdata);
					}
					console.error("Error occurred while Read DataLog: "+NAME+"\n"+ERROR+"\nData:\n"+CSVdata);
				});
			//history.pushState(prevState, prevTitle, prevUrl);
			history.replaceState(prevState, prevTitle, prevUrl);
		}

		// show FileBrowser
		self.showFileBrowser = function(IFrameID) {
			// attach event ONLÖOAD to iFrame
			if (self._plcType == "1500") {
				$(IFrameID).on("load", function () {
					$(this).css('height', '');
					$(this).contents().find("head").append("<style type='text/css'>.Header_Area, #headerArea, #Header_Language_Time_Date, #dateTimeBar, #MainMenu_Area, #separatorLine1, #separatorLine2, #separatorLine3, #loginBox, .clearer, .Separation_Line, #navigationArea, #titleArea, #TR_319 {display:none;} div#clientArea, div#contentArea{margin:0; top:0; left:0;} </style>");
					//$(this).css("height", $(this).contents().find("table.Data_Area").height() + "px");
					if ($(this).contents().find("#clientArea").height() != null){
						//console.log( "FW >= 2.0" );
						$(this).css( {
									"height": (($(this).contents().find("#clientArea").height()+60) + "px"),
									"width": (($(this).contents().find("#clientArea").width()+10) + "px"),
									"border": "0"
						});
					}
					else {
						//console.log( "FW <= 1.8.4" );
						$(this).css( {
									"height": (($(this).contents().find("#TR_1278").height()+30) + "px"),
									"width": (($(this).contents().find("#TR_1278").width()+10) + "px"),
									"border": "0"
						});
					}
				});
				// attach source to iFrame - iFrame loads afterwards automaticly the content
				$(IFrameID).attr('src', '../../Portal/Portal.mwsl?PriNav=Filebrowser');
			}
			else if (self._plcType == "1200") {
				$(IFrameID).on("load", function () {
					$(this).css('height', '');
					$(this).contents().find("head").append("<style type='text/css'>body{ background: transparent;}.Header_Area, #headerArea, #Header_Language_Time_Date, #dateTimeBar, #MainMenu_Area, #separatorLine1, #separatorLine2, #separatorLine3, #loginBox, .clearer, .Separation_Line, #navigationArea, .Title_Area, div#titleArea, #titleArea, #TR_319 {display:none;} div#clientArea, div#contentArea{margin:0; top:0; left:0;} </style>");
					//$(this).css("height", $(this).contents().find("table.Data_Area").height() + "px");
					if ($(this).contents().find(".table_position").height() != null){
						console.log( "FW >= 4.2" );
						$(this).css( {
									"height": (($(this).contents().find(".table_position").height()+60) + "px"),
									"width": (($(this).contents().find(".table_position").width()+30) + "px"),
									"border": "0"
						});
					}
					else {
						console.log( "FW <= 4.1" );
						$(this).css( {
									"height": (($(this).contents().find("#fileBrowserWrapper").height()+30) + "px"),
									"width": (($(this).contents().find("#fileBrowserTable").width()+30) + "px"),
									"border": "0"
						});
					}
					
				});
				// attach source to iFrame - iFrame loads afterwards automaticly the content
				$(IFrameID).attr('src', '../../Portal/Portal.mwsl?PriNav=FileBrowser');
			}
			else {
				console.info('Wrong CPU TYPE Parameter given to S7Framework.initialize("plcType");\n "1200" or "1500" are possible types');
			}
		}

		// restart Method (tested on S7-1512SP and 1215C DC/DC/DC)
		self.restartCPU = function() {
			// save actual referer
			var prevState = history.state;
			var prevTitle = document.title;
			var prevUrl = location.href;
			
			if (self._plcType == "1500") {
				// set referer to main entrypage of webserver --> Portal.mwsl
				history.pushState({ MyObj: "PriNav" }, "PriNav", location.origin + "/Portal/Portal.mwsl?PriNav=Start");
				// request CPU Stop
				$.get("/ClientArea/CPUAction.mwsl?Action=Stop")
					.done(function(){ // .successfull stopped
						history.pushState({ MyObj: "PriNav" }, "PriNav", location.origin + "/Portal/Portal.mwsl?PriNav=Start");
						// request CPU StartUp
						$.get("/ClientArea/CPUAction.mwsl?Action=Start")
							.done(function(){ // .successfull started
								//_timeOutRestart = setTimeout( function() { model.confirmRestart() }, 1000*5 );
							})
							.fail(function(){ // .error
								console.error("Error occurred while trying to START 1500 CPU");
							})
							.always(function(){ // .complete
								// set referer back to refere bevor startup
								history.replaceState(prevState, prevTitle, prevUrl);
								//history.pushState(prevState, prevTitle, prevUrl);
							});
					})
					.fail(function(){ // .error
						console.error("Error occurred while trying to STOP 1500 CPU");
					})
					.always(function(){ // .complete
						// set referer back to refere bevor startup
						history.replaceState(prevState, prevTitle, prevUrl);
						//history.pushState(prevState, prevTitle, prevUrl);
					});
			}
			else if (self._plcType == "1200") {
				$.post(location.origin + "/CPUCommands", "PriNav=Start&Stop=STOP", function(ret_val){})
					.done(function(){ // .successfull stopped
						// request CPU StartUp
						$.post(location.origin + "/CPUCommands", "PriNav=Start&Run=RUN", function(ret_val){})
							.done(function(){ // .successfull started
								//_timeOutRestart = setTimeout( function() { model.confirmRestart() }, 1000*5 );
							})
							.fail(function(){ // .error
								console.error("Error occurred while trying to START 1200 CPU");
							})
							.always(function(){ // .complete
								// set referer back to refere bevor startup
								history.replaceState(prevState, prevTitle, prevUrl);
								//history.pushState(prevState, prevTitle, prevUrl);
							});
					})
					.fail(function(){ // .error
						console.error("Error occurred while trying to STOP 1200 CPU");
					})
					.always(function(){ // .complete
						// set referer back to refere bevor startup
						history.replaceState(prevState, prevTitle, prevUrl);
						//history.pushState(prevState, prevTitle, prevUrl);
					});
			}
			else {
				console.info('Wrong CPU TYPE Parameter given to S7Framework.initialize("plcType");\n "1200" or "1500" are possible types');
			}
		}

		// show and hide loadIndicator
		self.showHideIndicator = function(indicator) {
			if (arguments.length) {
				self._loadImage = indicator;
			}
			return self._loadImage;
		}

		// Abort all active AJAX tasks
		self.abortAllAjax = function() {
			for (i = 0; i < _xhrPool.length; i++) {
				_xhrPool[i].abort();
			}
			_xhrPool = [];
		}

		self.initialize = function(plcType, loadImageID) {
			if (initialized) {
				return initializedRetVal;
			}
			// Kennzeichen setzen, dass OBJEKT Instanziert wurde
			initialized = true;
			
			// define string.trim() if not defined
			if (!String.trim) {
				// String.prototype.trim = function () { return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''); };
				String.prototype.trim = function () { return this.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, ''); };
			}
			
			// workaround for IE, because location.orign is not supportet in IE
			if (!window.location.origin) {
				window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
			}
			// workaround for IE, because string.includes is not supportet in IE
			if (!String.prototype.includes)
				String.prototype.includes = function() {
					return String.prototype.indexOf.apply(this, arguments) !== -1;
				};
			
			// NOOPs for console
			if (window.console == undefined)
				window.console = {};
			if (window.console.log == undefined)
				window.console.log = function () { };
			if (window.console.debug == undefined)
				window.console.debug = function () { };
			if (window.console.info == undefined)
				window.console.info = function () { };
			if (window.console.warn == undefined)
				window.console.warn = function () { };
			if (window.console.error == undefined)
				window.console.error = function () { };
			if (window.console.assert == undefined)
				window.console.assert = function () { };
			
			// save CPU Typ from arguments to local object storage
			if (arguments.length >= 2) {
				self._plcType = plcType;
				self._loadImageID = loadImageID;
			}
			else {
				console.error("Missing Parameter @ S7Framework.initialize(plcType, loadImageID)", "\n", "Initialisation aborted!!!");
				initializedRetVal = false;
			}
			
			// AJAX Setup
			$.ajaxSetup(
				{
					mimeType: "text/plain", // to supress JSON Failure
					cache : false // avoid caching of JSON Files
					//isLocal: true
				},
				{ // Write alle AJAX Requests in array, and delet if finished
					beforeSend: function(jqXHR) {
						self._xhrPool.push(jqXHR);
					},
					complete: function(jqXHR) {
						var index = self._xhrPool.indexOf(jqXHR);
						if (index > -1) {
							self._xhrPool.splice(index, 1);
						}
					}
				}
			);
			
			// Loadindicator Event on START or STOP AJAX Call
			$(self._loadImageID).hide();
			// Show the load picture
			$(document).ajaxStart(function(){
				if ( self._loadImage ) $( self._loadImageID ).show();
			});
			// hide the load picture
			$(document).ajaxStop(function(){
				$( self._loadImageID ).hide();
				self._loadImage = true;
			});
			initializedRetVal = true;
			return initializedRetVal;
		}
	} // Controller

	// Controller erzeugen 
	var controller = new Controller();
	return controller;
})(jQuery);