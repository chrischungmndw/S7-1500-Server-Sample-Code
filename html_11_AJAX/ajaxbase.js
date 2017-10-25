    // support functions
    var g_browser_ie       = false;
    var g_browser_opera    = false;
    var g_browser_firefox  = false;

    function DetermineBrowser() {
        var userAgent  = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf("msie") >= 0) {
            browser = "IE";
            g_browser_ie = true;
        } else if (userAgent.indexOf("opera") >= 0) {
            browser = "Opera";
            g_browser_opera = true;
        } else if (userAgent.indexOf("firefox") >= 0) {
            browser = "FireFox";
            g_browser_firefox = true;
        }
    }

	// Create an HTTP Requests Object independent of browser type
	// and send the request to the provided URL
	function DoHttpRequest(userobj, url, proc, asynch, xml) {
	  	var httpRequest;

		httpRequest = GetXMLHttpRequestObj(xml);	
	  	if (!httpRequest) { 
	    	alert("HttpRequest failed: cannot create"); 
	    	return false;
	  	}

	  	userobj.userProc	 = proc;            // user defined handler
	  	userobj.httpRequest  = httpRequest;
	  	userobj.currUrl	     = url;
	    userobj.isXMLRequest = xml;
	  	
	  	httpRequest.open('GET', url, asynch);   // process the request asynchronously
	  		// HttpRequestHandler max be called now, but not with readyState 4 !
	  	httpRequest.onreadystatechange = function() { HttpRequestHandler(userobj); }; 
            // force requesting from server, otherwise IE may take the response from cache !
		httpRequest.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
	  	httpRequest.send(null);
        if (g_browser_firefox && !asynch) {
            // firefox does not call the handler if synchron !
            HttpRequestHandler(userobj);
        }
        httpRequest = null; // necessary for IE, to break the object cycle imposed by the use of closures,
                            // which prevents IE's garbage collector from releasing the objects
        return true;
	}

	// Create an HTTP Requests Object independent of browser type
	function GetXMLHttpRequestObj(xml) {
	  	var bHttpRequest = false;
	  	var httpRequest  = null;

		// Test whether the browser provides an XMLHttpRequest Objekt (Mozilla and other)
		try {
			bHttpRequest = (window.XMLHttpRequest != null);
		} catch (e) {
		}
		if (bHttpRequest) {     
			httpRequest = new XMLHttpRequest(); 
			if (httpRequest.overrideMimeType && xml) {
	      		// The result is to be handled as XML doc
	      		httpRequest.overrideMimeType('text/xml');     
	    	}
	  	} else if (window.ActiveXObject) { 
	  		// use ActiveXObject if Browser is IE
	   		try {
                // Microsoft IE >= V5
	   			httpRequest = new ActiveXObject("Msxml2.XMLHTTP");	   			
	   		} catch (e) {
	   			try {
                    // Microsoft IE >= V6
	        		httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
	      		} catch (e) {}
	    	}
	  	}
	  	return httpRequest;
	}


    // Handler for the HTTP request, calls in turn the user defined handler
	function HttpRequestHandler(userobj) {
	  	var httpRequest = userobj.httpRequest;
	  	// check if loading response has finished
	 	if (httpRequest && httpRequest.readyState == 4) { 
	    	var userProc = userobj.userProc;
	    	userobj.httpRequest = null;
	    	userobj.userProc    = null;	
            if (userProc) {
                userProc(userobj, httpRequest.responseText, httpRequest.status);
            }            
	  	}
	}
	
	function send_ajax_request(variable, fieldId) 
	{
		if (window.XMLHttpRequest) 
		{
			req = new XMLHttpRequest();		// Mozilla and others
		} 
		else if (window.ActiveXObject) 
		{
			req = new ActiveXObject("Microsoft.XMLHTTP");	// Microsoft
		} 
		else 
		{
			alert("Der Browser unterstuezt kein Ajax");
		}
		var value = document.getElementById(fieldId).value;
		
		var req_url = "?"+variable+"="+value+"&"+Math.random();
		//debug alert(req_url);
		req.open("GET", req_url, false);
		req.onreadystatechange = ajax_callback;
		req.send(null);
	}

	function ajax_callback() 
	{
		if (req.readyState == 4) 
		{
			//debug alert(req.responseText);
			//debug alert("Schreiben erfolgreich!");
		}
	}