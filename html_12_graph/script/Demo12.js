var plcType;

$(document).ready(function(){
	// this function is only needed if the type of the PLC is not known. Otherwise just call the functions of $.init here and replace plcType by "1200" or "1500"
	if (plcType != "1200" && plcType != "1500")//If the plcType is not defined, find out the plc type
	{
		$.ajax({cache: false, type: "GET", url: "../../../Portal/Intro.mwsl", data: "", dataType: "text"})//Load the code of the intro page of the standard webpages
					.done(function(webpageData){ // .success
						var search12 = webpageData.search("CPU12");//search for "CPU12" in the code of the intro page if yes -> plcType = 1200
						var search15 = webpageData.search("CPU15");//search for "CPU15" in the code of the intro page if yes -> plcType = 1500
						if (search12 >= 0)
						{
							plcType = "1200";
							$.init();
						}
						else if (search15 >= 0)
						{
							plcType = "1500";
							$.init();
						}
						else
						{
							alert("The PLC Type coudn't be identified!");
						}
					})
					.fail(function(webpageData){ // .error
						
						alert("The PLC Type coudn't be identified!");
					});
	}
		
		
})
$.init = function(){
	S7Framework.initialize(plcType, "");
	S7Framework.readDataLog("SinusUndCosinus","Read Datalog failed", decodeCSV); //read the dataLog with the name SinusUndCosinus and give the data to the function decodeCSV
	$("#updData").click(function () {
		S7Framework.readDataLog("SinusUndCosinus","Read Datalog Failed", decodeCSV);
	});
}

function decodeCSV(CSVdata){//CSVdata = data of dataLog
	console.info( "CSV-Data" );
	console.log( CSVdata );
	var data;
	
	// seperate lines in array
	CSVdata = CSVdata.split("\r\n");
	// seperate header data
	var CSVheader = CSVdata[0].split(",");
	for (var i = 0; i < CSVheader.length; i++) {
		CSVheader[i] = CSVheader[i].trim();
	}
	CSVheader.shift();
	var xLabel = CSVheader[0];
	CSVheader.shift();
	CSVheader.shift();
	
	console.info( "CSV Header" );
	console.log( CSVheader );
	
	console.info( "CSV-Data Lines" );
	console.log( CSVdata );
	
	// seperate data in lines into array
	for (var i = 0; i < CSVdata.length-2; i++) {
		CSVdata[i] = CSVdata[i+1].split(",");
		// sequenz no / entrance ID
		CSVdata[i][0] = parseInt(CSVdata[i][0]);
		
		// Values convert time in DataLog to "Date.UTC". This data-type can be read by the graph template
		var timeStr1Split;
		var timeStr2Split;
		var timeStamp;
		if (plcType == "1500")
		{
			timeStr1Split = CSVdata[i][1].split("-");
			timeStr2Split = CSVdata[i][2].split(":");
			var timeStrSplitSecMs = timeStr2Split[2].split(".");
			timeStamp = new Date(
								Date.UTC(
									timeStr1Split[0],	// year
									timeStr1Split[1],	// month,
									timeStr1Split[2],	// day,
									timeStr2Split[0],	// hours,
									timeStr2Split[1],	// minutes,
									timeStrSplitSecMs[0],	// seconds,
									timeStrSplitSecMs[1] 	// milliseconds
									)
								);
		}
		else if (plcType == "1200")
		{
			timeStr1Split = CSVdata[i][1].split("/");
			timeStr2Split = CSVdata[i][2].split(":");
			timeStamp = new Date(
								Date.UTC(
									timeStr1Split[2],	// year
									timeStr1Split[1],	// month,
									timeStr1Split[0],	// day,
									timeStr2Split[0],	// hours,
									timeStr2Split[1],	// minutes,
									timeStr2Split[2],	// seconds,
									0 	// milliseconds
									)
								);
		}
		CSVdata[i][1] = timeStamp.getTime();
		// Values convert to float
		for (var x = 3; x < CSVdata[i].length; x++) {
			CSVdata[i][x] = parseFloat(CSVdata[i][x]).toFixed(2);
		}
		
	}
	
	console.info( "CSV Data" );
	console.log( CSVdata );
	
	
	//convertion of data in the right format for the graph template, sort the date if not chronological
	var dataArray = [];
	// colum
	for (var colum = 0; colum < CSVheader.length; colum++) {
		var dataArrayVal = [];
		var position = 0;
		// line
		for (var line = 0; line < CSVdata.length -2; line++) {
			var seqNo = CSVdata[line][0];
			if (line > 0)
			{
				if (seqNo > CSVdata[line - 1][0])
				{
					position = position + 1;
				}
				else //data is not chronological => sort it
				{
					position = 0;
					for (var a = line - 1; a >= 0  ; a--)
					{
						var tempPos = (CSVdata.length - 2) - line + a;
						dataArrayVal[tempPos] = dataArrayVal[a];
					}					
				}
			}
		
			var timeStamp = line;
			
			timeStamp = CSVdata[line][1];
			var value = parseFloat( CSVdata[line][colum+3] );
			
			dataArrayVal[position] = [timeStamp, value];
		}
		dataArray[colum] = dataArrayVal;
	}

	
	console.info( "Data Array" );
	console.log( dataArray );
	console.log( dataArray[0][0][0] );
	
	// save data in dataSet and define graph-properties 
	var dataSet = [];
	for (var x = 0; x < 4; x++) {
		dataSet[x] = 
		{
			label: CSVheader[x],
			data: dataArray[x],
			lines: { show: true, fill: false, steps: false },
			points: { show: false }
		};
	}
	
	console.info( "Data Set" );
	console.log( dataSet );
	
	//load the graph 
	$.plot("#graph-placeholder", dataSet,
		{
			xaxis: { 
				mode: "time",
				min: dataArray[0][0][0]
			}
		}
	);
}