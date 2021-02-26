/*	Attack Target Conditions "berwickfliers" system v1.0 - 2chang 2/26/2021

	This script adds a custom skill that allows you to create units that are only targetable
	under certain conditions. Counterattacks are not handled here, so they can still happen.
	
	To use, go to your game's database, then skills. Click "Create Skill" and
	give it the "Custom" effect. Then click keyword<> and put in the effect you want here.
	Add your new skill to any class, state, unit, or weapon that you want to be affected.

	Keyword<> "Flier" inspired by Berwick Saga
	-units with higher agility than flier can target a unit that has this skill
	--change HigherAgiCanTargetFlier to false to disable this
	-units with ranged weapons/magic can target a unit that has this skill
	-other flying units can target a unit that has this skill

	Keyword<> "Swiftfoot" 
	-only units in melee range can target a unit that has this skill
	--change HigherAgiCanTargetSwift to false to disable this

	Keyword<> "MagicTarget"
	-units with magic can target a unit that has this skill, best for status effects

	Keyword<> "Untargetable"
	-no units can target a unit that has this skill, best for status effects

	Keyword<> "Provoke"
	-player skill, increases likelyhood enemy will attack unit that has this skill, best for status effects

	This plugin overwrites AttackChecker.getAttackIndexArray and BaseCombinationCollector._setUnitRangeCombination, 
	and as such is incompatible with any plugins that also modify said functions. If you need a compatibility patch contact 
	@2chang#1605 on discord(preferably on the SRPG university server, not dm), if I'm not busy I might be able to do it.

	This originally started as a plugin just for the berwick flier targeting behavior, but since I was already overwriting
	two functions I figured adding some extra functionality would be cool. If you don't want a certain feature, dont assign 
	the corresponding keyword, keywords that are unassigned have no effect.

	Planned updates: hide in trees, ui box explaining why unit cant be targeted
*/

(function() {
	//Configure plugin here
	var HigherAgiCanTargetFlier = true; //true = unit with higher agility than flier can target them
	var HigherAgiCanTargetSwift = true; //true = unit with higher agility than swiftfoot user can target them
	var agiDif = 1; //how much more agi the ground unit needs to attack flier eg ground 13, flier 12 = ground can attack
	//
	//
	//
	//don't edit past here
	//store old functions just in case
	var alias1 = AttackChecker.getAttackIndexArray;
	var alias2 = BaseCombinationCollector._setUnitRangeCombination;

	//create some vars
	var skill, canTarget, unitAgi, targetAgi, totalAgi;
	//check target conditions
	var checkTargetStatus = function(unit, targetUnit) { //this code is messy, dont yell at me
		skill = SkillControl.getPossessionCustomSkill(targetUnit, "Flier");
		root.log("weapon type: "+ ItemControl.getEquippedWeapon(unit).getWeaponCategoryType());
		//calc agi difference
		unitAgi = AbilityCalculator.getAgility(unit, ItemControl.getEquippedWeapon(unit));
		targetAgi = AbilityCalculator.getAgility(targetUnit, ItemControl.getEquippedWeapon(targetUnit));
		if (skill){ 
			totalAgi = unitAgi - targetAgi;
			if(totalAgi >= agiDif && HigherAgiCanTargetFlier) { //allow higher agi to attack flier
				canTarget = true;
			}
			else if (ItemControl.getEquippedWeapon(unit).getEndRange() > 1) { //weapons with an end range greater than 1 can attack
				canTarget = true;
			}
			else if (SkillControl.getPossessionCustomSkill(unit, "Flier")) { //fliers can attack fliers, obviously.
				canTarget = true;
			}
			else { //everything else can't attack
				canTarget = false;
			}
			
		}
		else if (SkillControl.getPossessionCustomSkill(targetUnit, "Swiftfoot")) { //can only be attacked in melee range 
			var adj = false;
			if (unit.getMapX() == targetUnit.getMapX() && unit.getMapY() == targetUnit.getMapY() - 1) adj = true;
			if (unit.getMapX() == targetUnit.getMapX() && unit.getMapY() == targetUnit.getMapY() + 1) adj = true;
			if (unit.getMapX() == targetUnit.getMapX() - 1 && unit.getMapY() == targetUnit.getMapY()) adj = true;
			if (unit.getMapX() == targetUnit.getMapX() + 1 && unit.getMapY() == targetUnit.getMapY()) adj = true;
			if (adj) {
				canTarget = true;	
			}
			else if(totalAgi >= agiDif && HigherAgiCanTargetSwift) { //allow higher agi to attack flier
				canTarget = true;
			}
			else {
				canTarget = false;
			}												  
		}
		else if (SkillControl.getPossessionCustomSkill(targetUnit, "MagicTarget")) { //only targetable by magic attacks
			if(ItemControl.getEquippedWeapon(unit).getWeaponCategoryType() === AttackTemplateType.MAGE ) { 
				canTarget = true;	
			}
			else {
				canTarget = false;	
			}														 
		}
		else if (SkillControl.getPossessionCustomSkill(targetUnit, "Untargetable")) { //tip: add the skill to a state to create
			canTarget = false;														  //a temporary unattackable state
		}
		else {
			canTarget = true;
		}
		
		return canTarget;
	}
	
	//player -> enemy targeting
	AttackChecker.getAttackIndexArray = function(unit, weapon, isSingleCheck) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				//check for skill
				checkTargetStatus(unit, targetUnit);
				if (FilterControl.isReverseUnitTypeAllowed(unit, targetUnit) && canTarget) {
					indexArrayNew.push(index);
					if (isSingleCheck) {
						return indexArrayNew;
					}
				}
			}
		}
		
		return indexArrayNew;
	},
	//enemy -> player targeting
	BaseCombinationCollector._setUnitRangeCombination = function(misc, filter, rangeMetrics) {
		var i, j, indexArray, list, targetUnit, targetCount, score, combination, aggregation;
		var unit = misc.unit;
		var filterNew = this._arrangeFilter(unit, filter);
		var listArray = this._getTargetListArray(filterNew, misc);
		var listCount = listArray.length;
		
		if (misc.item !== null && !misc.item.isWeapon()) {
			aggregation = misc.item.getTargetAggregation();
		}
		else if (misc.skill !== null) {
			aggregation = misc.skill.getTargetAggregation();
		}
		else {
			aggregation = null;
		}
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			targetCount = list.getCount();
			for (j = 0; j < targetCount; j++) {
				targetUnit = list.getData(j);
				if (unit === targetUnit) {
					continue;
				}
				
				if (aggregation !== null && !aggregation.isCondition(targetUnit)) {
					continue;
				}
				
				score = this._checkTargetScore(unit, targetUnit);
				if (score < 0) {
					continue;
				}
				checkTargetStatus(unit, targetUnit);

				if(!canTarget) { //check if can target
					continue;
				}
				if (SkillControl.getPossessionCustomSkill(targetUnit, "Provoke")) { 
					score += 10000;													
				}
				
				// Calculate a series of ranges based on the current position of targetUnit (not myself, but the opponent).
				indexArray = IndexArray.createRangeIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), rangeMetrics);
				
				misc.targetUnit = targetUnit;
				misc.indexArray = indexArray;
				misc.rangeMetrics = rangeMetrics;
				
				// Get an array to store the position to move from a series of ranges.
				misc.costArray = this._createCostArray(misc);
				
				if (misc.costArray.length !== 0) {
					// There is a movable position, so create a combination.
					combination = this._createAndPushCombination(misc);
					combination.plusScore = score;
				}
			}
		}
	}

}) ();
