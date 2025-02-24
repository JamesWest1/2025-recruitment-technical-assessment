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

const cookbookArray: cookbookEntry[] = []

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any = null;

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
  // TODO: implement me
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

const writeCookbook = (obj:cookbookEntry) => {
  obj.name = parse_handwriting(obj.name)
  cookbookArray.push(obj)
}

const checkContains = (name:string):boolean => {
  return (cookbookArray.filter((obj:cookbookEntry) => obj.name === name).length !== 0)
}

const hasKey = (obj:any, str:string) => {
  return str in obj;
}
const checkValidRecipe = (obj:any): boolean =>{
  if(!hasKey(obj, "requiredItems")) return false;
  if (!Array.isArray(obj.requiredItems)) return false;
  let initialSize = obj.requiredItems.length;
  obj.requiredItems.filter((item:any) => {
    return hasKey(item, "quantity") && hasKey(item, "name") && (Object.keys(item).length === 2)
  })
  if (initialSize !== obj.requiredItems.length) return false;
  return true;
}
const checkValidIngredient = (obj:any):boolean => {
  if(!hasKey(obj, "cookTime")) return false;
  if (parseInt(obj.cookTime) < 0) return false;
  return true;
}

const validItem = (obj:any): boolean => {
  if (!hasKey(obj, "name")) return false;
  if (!hasKey(obj, "type")) return false;
  if (obj.type === "recipe") {
    return checkValidRecipe(obj);
  }
  else if (obj.type === "ingredient") {
    return checkValidIngredient(obj);
  }
  else return false;
}

const convertToEntry = (obj:any): recipe | ingredient | null => {
  if (!validItem(obj)) return null;
  else if (obj.type === "recipe") return obj as recipe;
  else if (obj.type === "ingredient") return obj as ingredient;
  else return null
}

app.post("/entry", (req:Request, res:Response) => {
  const cookbook = req.body
  let cookObj = convertToEntry(cookbook);
  if (checkContains(cookbook.name)) {
    res.status(400).send("already in the cookbook")
  }
  else if (cookObj === null) {
    res.status(400).send("could not convert to recipe or ingredient")
  }
  else {
    writeCookbook(cookbook)
    res.status(200).send("entry has been logged")
  }
});
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name

const getEntry = (name:string): cookbookEntry | null => {
  for (let item of cookbookArray) {
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
  interface expectedFormat {
    name: string,
    cookTime: number,
    ingredients: requiredItem[]
  };
  let result:expectedFormat = {
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
  map.forEach((value, key) => {
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
