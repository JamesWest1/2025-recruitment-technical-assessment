import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}


interface summaryFormat {
  name: string,
  cookTime: number,
  ingredients: requiredItem[]
};

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: cookbookEntry[] = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  recipeName =recipeName.replace(/[-_]/g, " ")
  recipeName = recipeName.replace(/ +/g, " ")
  recipeName =recipeName.replace(/^ /, "")
  recipeName =recipeName.replace(/ $/, "")
  recipeName = recipeName.replace(/[^a-zA-Z ]/g, "");
  let words = recipeName.split(" ")
  let capatilised = words.map((word:string) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
  recipeName = capatilised.join(" ")
  if (recipeName.length === 0) return null
  return recipeName
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook

const writeCookbook = (obj:recipe | ingredient) => {
  cookbook.push(obj)
}

// check if the cookbook contains an entry with a certain name
const checkContains = (name:string):boolean => {
  return (cookbook.filter((obj:cookbookEntry) => obj.name === name).length !== 0)
}

// check if an object contains a specific key
const hasKey = (obj:any, str:string) => {
  return str in obj;
}
// return true if obj:any is a valid recipe, false otherwise
const checkValidRecipe = (obj:any): boolean =>{
  if (!isCookbookEntry(obj)) return false
  if (!(obj.type === "recipe")) return false
  if(!hasKey(obj, "requiredItems")) return false;
  if (!Array.isArray(obj.requiredItems)) return false;
  let initialSize = obj.requiredItems.length;
  obj.requiredItems.filter((item:any) => {
    return hasKey(item, "quantity") && hasKey(item, "name") && (Object.keys(item).length === 2) && (item.quantity > 0)
  })
  if (initialSize !== obj.requiredItems.length) return false;
  return true;
}
// return true if obj:any is a valid ingredient, false otherwise
const checkValidIngredient = (obj:any):boolean => {
  if (!isCookbookEntry(obj)) return false
  if (!(obj.type === "ingredient")) return false
  if(!hasKey(obj, "cookTime")) return false;
  if (parseInt(obj.cookTime) < 0) return false;
  return true;
}

const isCookbookEntry = (obj:any) => {
  if (!hasKey(obj, "name")) return false;
  if (!hasKey(obj, "type")) return false;
  return true;
}
const validItem = (obj:any): boolean => {
  return (checkValidIngredient(obj) || checkValidRecipe(obj))
}

const convertToEntry = (obj:any): recipe | ingredient | null => {
  if (!validItem(obj)) return null;
  if (obj.type === "recipe") return obj as recipe
  else return obj as ingredient
}

app.post("/entry", (req:Request, res:Response) => {
  const body = req.body
  let cookObj = convertToEntry(body);
  if (checkContains(body.name)) {
    res.status(400).send("already in the cookbook")
  }
  else if (cookObj === null) {
    res.status(400).send("could not convert to recipe or ingredient")
  }
  else {
    writeCookbook(cookObj)
    res.status(200).send("entry has been logged")
  }
});
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name

const getEntry = (name:string): cookbookEntry | null => {
  for (let item of cookbook) {
    if (item.name === name && item.type === "recipe") return item as recipe;
    else if (item.name === name && item.type === "ingredient") return item as ingredient;
  }
  return null
}
// returns -1 if it can't find one  of the items, otherwise it returns the cookTime
// map will contain a count of the quantity of each ingredient
const addIngredientsToMap = (item:cookbookEntry, map:Map<string, number>, amount:number):number => {
  if (item.type === "ingredient") {
    let ingr = item as ingredient;
    if (map.has(item.name)) {
      map.set(item.name, map.get(item.name) + amount)
    }
    else {
      map.set(item.name, amount);
    }
    return ingr.cookTime * amount;
  }
  else {
    let total = 0;
    let recipe:recipe = item as recipe;
    for (let ingr of recipe.requiredItems) {
      if (!checkContains(ingr.name)) return -1;
      let entry:cookbookEntry = getEntry(ingr.name)
      let increment = addIngredientsToMap(entry, map, ingr.quantity * amount)
      if (increment === -1) return -1;
      total += increment
    }
    return total
  }
}
app.get("/summary", (req:Request, res:Request) => {
  const headers = req.query;
  if(!hasKey(headers, "name")){
    res.status(400).send("incorrect name field")
    return;
  }
  const name = headers.name;
  if (!checkContains(name)) {
    res.status(400).send("does not contain an entry with this name")
    return;
  }
  const entry:cookbookEntry = getEntry(name)
  if (entry.type !== "recipe") {
    res.status(400).send("entry is not a recipe")
    return;
  }
  const recipe:recipe = entry as recipe;
  let result:summaryFormat = {
    name: recipe.name,
    cookTime: 0,
    ingredients: []
  }
  let map = new Map()
  let cookTime = addIngredientsToMap(recipe, map, 1)
  if (cookTime === -1) {
    res.status(400).send("required item not found in the cookbook")
    return;
  }
  result.cookTime = cookTime;
  map.forEach((value, key) => { // add each of the values in the map to the ingredients array within the result object
    let obj = {
      name:key,
      quantity: value
    }
    result.ingredients.push(obj as requiredItem)
  })
  res.status(200).send(result)
});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
