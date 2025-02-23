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
  recipeName.replace(/[-_]/, " ")
  recipeName.replace(/ +/, " ")
  recipeName.replace(/^ /, "")
  recipeName.replace(/ $/, "")
  let words = recipeName.split(" ")
  for (let ind in words) {
    words[ind] = words[ind].charAt(0).toUpperCase();
  }
  recipeName = words.join(" ")
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

const hasKey = (obj:any, str:string) => {
  return str in obj;
}
const readJson = async (req:Request):Promise<any> => {
  return await req.json()
}
const checkValidRecipe = (obj:any): boolean =>{
  if(!hasKey(obj, "requiredItems")) return false;
  if (!Array.isArray(obj.requiredItems)) return false;
  let initialSize = obj.requiredItems.length;
  obj.requiredItems.filter((item:any) => {
    return hasKey(item, "quantity") && hasKey(item, "name") && (item.keys().length == 2)
  })
  if (initialSize !== obj.requiredItems.length) return false;
  let seen = new Set(obj.name)
  for (let item of obj.requiredItems) {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
  }
  return true;
}
const checkValidIngredient = (obj:any):boolean => {
  if(!hasKey(obj, "cookTime")) return false;
  if (parseInt(obj.cookTime) < 0) return false;
  return true;
}

const convertFromObj = (obj:any, ): ingredient | recipe | null => {
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
  return null
}

app.post("/entry", (req:Request, res:Response) => {
  let dataProm = readJson(req)
  dataProm
  .then((cookbook:any) => {
    let cookObj = convertFromObj(cookbook);
    if (cookObj == null) {
      res.status(400).send("invalid")
    }
    else {
      writeCookbook(cookObj)
      res.status(200).send("valid")
    }
  })
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
