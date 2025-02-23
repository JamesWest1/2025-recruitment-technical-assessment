import express, { Request, Response } from "express";
import { json } from "stream/consumers";
import * as fs from "fs";

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
  if (recipeName.length == 0) return null
  return recipeName
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook

const readCookbook = ():any => {
  try {
    const data = fs.readFileSync("cookbook.json", "utf8");
    return JSON.parse(data);
  }
  catch (err) {
    console.log(err)
    return [];
  }
}

const writeCookbook = (obj:cookbookEntry) => {
  let data = readCookbook()
  data.push(obj)
  const toJsonData = JSON.stringify(data)
  try {
    fs.writeFileSync("cookbook.json", toJsonData)
  }
  catch (err) {
    console.log(err)
  }
}

const checkUnique = (obj:any) => {
  let seen = new Set(obj.name)
  let cookbook = readCookbook()
  for (let item of cookbook) {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
  }
  return true;
}

const hasKey = (obj:any, str:string) => {
  return str in obj;
}
const checkValidRecipe = (obj:any): boolean =>{
  if(!hasKey(obj, "requiredItems")) return false;
  if (!Array.isArray(obj.requiredItems)) return false;
  let initialSize = obj.requiredItems.length;
  obj.requiredItems.filter((item:any) => {
    return hasKey(item, "quantity") && hasKey(item, "name") && (Object.keys(item).length == 2)
  })
  if (initialSize !== obj.requiredItems.length) return false;
  if (!checkUnique(obj)) return false
  return true;
}
const checkValidIngredient = (obj:any):boolean => {
  if(!hasKey(obj, "cookTime")) return false;
  if (parseInt(obj.cookTime) < 0) return false;
  if (!checkUnique(obj)) return false;
  return true;
}

const convertFromObj = (obj:any): ingredient | recipe | null => {
  if (!hasKey(obj, "name")) return null;
  if (!hasKey(obj, "type")) return null;
  if (obj.type === "recipe") {
    if (!checkValidRecipe(obj)) return null;
    let castObj:recipe = obj as recipe;
    return castObj;
  }
  else if (obj.type === "ingredient") {
    if (!checkValidIngredient(obj)) return null;
    let castObj:ingredient = obj as ingredient;
    return castObj;
  }
  else return null;
}

app.post("/entry", (req:Request, res:Response) => {
  const cookbook = req.body
  let cookObj = convertFromObj(cookbook);
  if (cookObj == null) {
    res.status(400).send("invalid")
  }
  else {
    writeCookbook(cookObj)
    res.status(200).send("valid")
  }
});
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  // TODO: implement me
  res.status(500).send("not yet implemented!")

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
