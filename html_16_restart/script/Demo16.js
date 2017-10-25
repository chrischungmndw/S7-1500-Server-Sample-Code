var plcType;
$(document).ready(function(){// every time if the DOM refresh
	// this function is only needed if the type of the PLC is not known. Otherwise just call the functions of $.init here and replace plcType by "1200" or "1500"
	if (plcType != "1200" && plcType != "1500")//If the plcType is not defined, find out the plc Type
	{
		$.ajax({ type: "GET", url: "../../../Portal/Intro.mwsl", data: "", dataType: "text"})//Load the code of the intro page of the standard webpages
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
	$("#restart").click(function(){
		S7Framework.restartCPU(); 
	});
}
