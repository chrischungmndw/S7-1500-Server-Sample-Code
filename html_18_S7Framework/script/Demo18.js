var plcType;
$(document).ready(function(){
	// every time if the DOM refresh
	if (plcType != "1200" && plcType != "1500")
	{
		$.ajax({ type: "GET", url: "../../../Portal/Intro.mwsl", data: "", dataType: "text"})
					.done(function(webpageData){ // .success
						var search12 = webpageData.search("CPU12");
						var search15 = webpageData.search("CPU15");
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
	
	S7Framework.readData
	("script/dataRead.json","init read data",updateValues);	//readData and givt it to the function "updateValues"
	function updateValues(values)
	{
		$("#myRect").attr("x",values[0] - 100);//values[0]=Position of myRect, the Rect should start 100px out of the svg to appear step by step
		if (values[1] == true)//values[1]=lightbarrier (it is true if its broken)
		{
			$("#myCircle").attr("fill","red");
		}
		else
		{
			$("#myCircle").attr("fill","green");				
		}
		$("#counter").html(values[2]);//writes down how many times the Rect passed
		S7Framework.readData("script/dataRead.json", "init read data", updateValues);//=> cycylic reading
	}
	
	$("#speed").change(function () {//if the value in the input "speed" changed write new value to PLC
		value = $("#speed").val();
		data = '"Plc2Web".speed' + "=" + value;
		S7Framework.writeData("script/dataWrite.json", data, "speed transmition failed", updateValues);	
	});
	$("#sendFormular").click(function () {//if the button "sendFormular" was clicked send the data of the formular to PLC
		S7Framework.writeForm("script/dataWrite.json", "#formular", "transmition of personal data failed", updateValues);		
	});
	
}
