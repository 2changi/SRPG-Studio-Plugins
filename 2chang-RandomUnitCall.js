/*  Random Unit Call v1 by 2chang
	this script allows you to use a line of code in your events to spawn a random unit defined 
	in the event ally/event enemy/bookmark tab of the SRPG Studio enemy/ally unit window. 
	You can even pick player units that are defined in the database.

	You must set up the units that are to be randomly selected by adding these custom parameters to them:
	{chapter: 1, group: 1}

	Call the function in a script execute event command and store the return in an ID variable. 
	Afterwards use the unit appearance event command to spawn the randomly selected unit from the variable.
	The function looks like this:
		RandomEnemy(1,1,1);

	here's what the numbers mean:
		RandomUnit(chapter, group, unitType);
	@param {number} chapter (chapter in which you want the unit to spawn in)
							(note that this number is arbitrary and you can call chapter 1 units in chapter 4 for example)
	@param {number} group (group of enemies, so you can have multiple random spawns in one map)
	@param {number} unitType (0 - guest, 1 - enemy, 2 - ally, 3 - player)

*/


var getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

var unitarray = [];
var bookmarks;


var buildUnitArray = function(chapter, group, unitType, unitarray){
	var i, unit;
	bookmarks;
	switch(unitType){
		case 0:
			bookmarks = root.getCurrentSession().getCurrentMapInfo().GetListFromUnitGroup(UnitGroup.BOOKMARK);
			break;
		case 1:
			bookmarks = root.getCurrentSession().getCurrentMapInfo().GetListFromUnitGroup(UnitGroup.ENEMYEVENT);
			break;
		case 2:
			bookmarks = root.getCurrentSession().getCurrentMapInfo().GetListFromUnitGroup(UnitGroup.ALLYEVENT);
			break;
		case 3:
			bookmarks = root.getCurrentSession().getCurrentMapInfo().GetListFromUnitGroup(UnitGroup.PLAYER);
			break;
	}
	
	var count = bookmarks.getCount();
	for (i = 0; i < count; i++) {
		unit = bookmarks.getData(i);
		if(unit.custom.active != 1 && unit.custom.chapter != null && unit.custom.group != null) {
			if(unit.custom.chapter == chapter && unit.custom.group == group){
				unitarray.push(unit.getId());
			}
		}
	}
}

var RandomUnit = function(chapter, group, unitType){
	var count2;
	if(unitarray.length > 0 || count2 > 0){ //reset
		unitarray.length = 0;
		count2 = 0;
	}
	buildUnitArray(chapter, group, unitType, unitarray);
	count2 = unitarray.length;
	if(count2 > -1){
		var returnunit = unitarray[getRandomInt(0,count2)];
		if(returnunit != null){
			bookmarks.getDataFromID(returnunit).custom.active = 1;
			return returnunit;
		}
		
	}
	
}