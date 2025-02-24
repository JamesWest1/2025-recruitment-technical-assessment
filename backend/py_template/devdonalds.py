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
	recipeName = re.sub(r' $', '', recipeName)
	return recipeName


# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
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

def parseIngredient(data):
	if data['type'] != "ingredient":
		return False
	if 'cookTime' not in data:
		return False
	if int(data['cookTime']) < 0:
		return False
	return True

def cookbookContains(name):
	for entry in cookbook:
		if entry['name'] == name:
			return True


@app.route('/entry', methods=['POST'])
def create_entry():
	data = request.get_json()
	if 'name' not in data:
		return 'key name not found', 400
	data['name'] = parse_handwriting(str(data['name']))
	if 'type' not in data:
		return 'key type not found', 400
	if cookbookContains(data['name']):
		return 'entry already in cookbook', 400
	if parseRecipe(data):
		cookbook.append(data)
		return 'recipe logged', 200
	elif parseIngredient(data):
		cookbook.append(data)
		return 'ingredient logged', 200
	return 'invalid entry', 400


# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	# TODO: implement me
	return 'not implemented', 500


# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
