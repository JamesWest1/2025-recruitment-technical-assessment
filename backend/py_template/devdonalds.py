from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int

# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = []

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str | None]:
	recipeName = recipeName.lower()
	recipeName = re.sub(r'[-_]', ' ', recipeName)
	recipeName = re.sub(r'[^a-z ]', '', recipeName)
	recipeName = re.sub(r' +', ' ', recipeName)
	recipeName = re.sub(r'^ ', '', recipeName)
	recipeName = re.sub(r' $', '', recipeName)
	if len(recipeName) == 0:
		return None
	splitStr = recipeName.split(' ')
	recipeName = ''
	for word in splitStr:
		if len(word) > 1:
			recipeName += word[0].upper() + word[1:] + ' '
		else:
			recipeName += word[0].upper()
	recipeName = re.sub(r' $', '', recipeName) # remove trailing white space
	return recipeName


# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook


# return true if the object data is a recipe object
def parseRecipe(data):
	if data['type'] != "recipe":
		return False
	if 'requiredItems' not in data:
		return False
	if not isinstance(data['requiredItems'], list):
		return False
	for item in data['requiredItems']:
		if 'name' not in item:
			return False
		if 'quantity' not in item:
			return False
		if len(item) != 2:
			return False
	return True

# return true if the object data is an ingredient object
def parseIngredient(data):
	if data['type'] != "ingredient":
		return False
	if 'cookTime' not in data:
		return False
	if int(data['cookTime']) < 0:
		return False
	return True

# return true if name is in the cookbook
def cookbookContains(name):
	for entry in cookbook:
		if entry['name'] == name:
			return True
	return False

# insert the object data into the cookbook, assumes that data is valid
def insertIntoCookbook(data):
	cookbook.append(data)

@app.route('/entry', methods=['POST'])
def create_entry():
	data = request.get_json()
	if 'name' not in data:
		return 'key name not found', 400
	if 'type' not in data:
		return 'key type not found', 400
	if cookbookContains(data['name']):
		return 'entry already in cookbook', 400
	if parseRecipe(data):
		insertIntoCookbook(data)
		return 'recipe logged', 200
	elif parseIngredient(data):
		insertIntoCookbook(data)
		return 'ingredient logged', 200
	return 'invalid entry', 400


# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name

def getEntry(name):
	for entry in cookbook:
		if entry['name'] == name:
			return entry
	return None


# returns the cooking time for entry 'name'
# updates mp (ingredientName -> quantity) with the quantity of each ingredient
# if an entry with name 'name' isn't in the cookbook return -1. if name is a recipe and one of the required items is
# invalid return -1
def getIngredients(name, mp, amount):
	entry = getEntry(name)
	if entry == None:
		return -1
	if entry['type'] == 'ingredient':
		if entry['name'] in mp:
			mp[entry['name']] += amount
		else:
			mp[entry['name']] = amount
		return amount * entry['cookTime']
	else:
		total = 0
		for item in entry['requiredItems']:
			entry = getEntry(item['name'])
			if entry == None:
				return -1
			cookTime = getIngredients(entry['name'], mp, amount * item['quantity'])
			if cookTime < 0:
				return -1
			total += cookTime
		return total

@app.route('/summary', methods=['GET'])
def summary():
	name = request.args.get('name')
	if not cookbookContains(name):
		return 'entry not found', 400
	entry = getEntry(name)
	if entry['type'] != 'recipe':
		return 'entry is not a recipe', 400
	mp = {}
	cookTime = getIngredients(entry['name'], mp, 1) # this loades the base ingredients into mp in the form (ingredientName -> quantity)
	if cookTime < 0:
		return 'required item not found in the cookbook', 400
	ingredients = []
	for key in mp:
		ingredients.append({'name': key, 'quantity': mp[key]})
	return {'name': entry['name'], 'cookTime': cookTime, 'ingredients': ingredients}, 200


# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
