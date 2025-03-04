const request = require("supertest");

describe("Task 1", () => {
  describe("POST /parse", () => {
    const getTask1 = async (inputStr) => {
      return await request("http://localhost:8080")
        .post("/parse")
        .send({ input: inputStr });
    };

    it("example1", async () => {
      const response = await getTask1("Riz@z RISO00tto!");
      expect(response.body).toStrictEqual({ msg: "Rizz Risotto" });
    });

    it("example2", async () => {
      const response = await getTask1("alpHa-alFRedo");
      expect(response.body).toStrictEqual({ msg: "Alpha Alfredo" });
    });

    it("error case", async () => {
      const response = await getTask1("");
      expect(response.status).toBe(400);
    });

    it("error case 2", async () => {
      const response = await getTask1("__-----   ");
      expect(response.status).toBe(400);
    });

    it("more complex scenario", async () => {
      const response = await getTask1(" - -__ -_  alp009911}{-  -___-- hA-alF_____RedEEo_  ___--");
      expect(response.body).toStrictEqual({ msg: "Alp Ha Alf Redeeo" });
    });
    it("single word", async () => {
      const response = await getTask1(" beef ");
      expect(response.body).toStrictEqual({ msg: "Beef" });
    });
  });
});

describe("Task 2", () => {
  describe("POST /entry", () => {
    const putTask2 = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    it("Add Ingredients", async () => {
      const entries = [
        { type: "ingredient", name: "Bacon", cookTime: 6 },
        { type: "ingredient", name: "Lettuce", cookTime: 1 },
      ];
      for (const entry of entries) {
        const resp = await putTask2(entry);
        expect(resp.status).toBe(200);
        expect(resp.body).toStrictEqual({});
      }
    });

    it("Add Recipe", async () => {
      const meatball = {
        type: "recipe",
        name: "Meatball",
        requiredItems: [{ name: "Beef", quantity: 1 }],
      };
      const resp1 = await putTask2(meatball);
      expect(resp1.status).toBe(200);
    });

    it("Congratulations u burnt the pan pt2", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "beef",
        cookTime: -1,
      });
      expect(resp.status).toBe(400);
    });

    it("Congratulations u burnt the pan pt3", async () => {
      const resp = await putTask2({
        type: "pan",
        name: "pan",
        cookTime: 20,
      });
      expect(resp.status).toBe(400);
    });

    it("Unique names", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 10,
      });
      expect(resp.status).toBe(200);

      const resp2 = await putTask2({
        type: "ingredient",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp2.status).toBe(400);

      const resp3 = await putTask2({
        type: "recipe",
        name: "Beef",
        cookTime: 8,
      });
      expect(resp3.status).toBe(400);
    });

    it("Unique names 2", async () => {
      const resp = await putTask2({
        type: "ingredient",
        name: "Cream",
        cookTime: 10,
      });
      expect(resp.status).toBe(200);

      const resp2 = await putTask2({
        type: "ingredient",
        name: "Apple",
        cookTime: 0,
      });
      expect(resp2.status).toBe(200);

      const resp3 = await putTask2({
        type: "recipe",
        name: "Cream",
        cookTime: 8,
      });
      expect(resp3.status).toBe(400);
    });
  });
});

describe("Task 3", () => {
  describe("GET /summary", () => {
    const postEntry = async (data) => {
      return await request("http://localhost:8080").post("/entry").send(data);
    };

    const getTask3 = async (name) => {
      return await request("http://localhost:8080").get(
        `/summary?name=${name}`
      );
    };

    it("What is bro doing - Get empty cookbook", async () => {
      const resp = await getTask3("nothing");
      expect(resp.status).toBe(400);
    });

    it("What is bro doing - Get ingredient", async () => {
      const resp = await postEntry({
        type: "ingredient",
        name: "beef",
        cookTime: 2,
      });
      expect(resp.status).toBe(200);

      const resp2 = await getTask3("beef");
      expect(resp2.status).toBe(400);
    });

    it("Unknown missing item", async () => {
      const cheese = {
        type: "recipe",
        name: "Cheese",
        requiredItems: [{ name: "Not Real", quantity: 1 }],
      };
      const resp1 = await postEntry(cheese);
      expect(resp1.status).toBe(200);

      const resp2 = await getTask3("Cheese");
      expect(resp2.status).toBe(400);
    });

    it("Bro cooked", async () => {
      const meatball = {
        type: "recipe",
        name: "Skibidi",
        requiredItems: [{ name: "Bruh", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "ingredient",
        name: "Bruh",
        cookTime: 2,
      });
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Skibidi");
      expect(resp3.status).toBe(200);
      expect(resp3.body).toEqual({
        name: "Skibidi",
        cookTime: 2,
        ingredients: [
          {name: "Bruh", quantity: 1}
        ]
      })
    });
    it("big test", async () => {
      const meatball = {
        type: "recipe",
        name: "Top",
        requiredItems: [{ name: "Egg", quantity: 7 }, {name: "Vinegar", quantity: 5}, {name: "Cake", quantity: 2}],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "recipe",
        name: "Egg",
        requiredItems: [{ name: "Base", quantity: 2 }]
      });
      expect(resp2.status).toBe(200);
      const resp3 = await postEntry({
        type: "recipe",
        name: "Vinegar",
        requiredItems:[{ name: "Base", quantity: 3 }]
      });
      expect(resp3.status).toBe(200);
      const resp4 = await postEntry({
        type: "ingredient",
        name: "Base",
        cookTime: 1
      });
      expect(resp4.status).toBe(200);
      const resp5 = await postEntry({
        type: "recipe",
        name: "Cake",
        requiredItems: [{name: "Chocolate", quantity: 10}, {name: "Flour", quantity: 3}]
      });
      expect(resp5.status).toBe(200);
      const resp6 = await postEntry({
        type: "ingredient",
        name: "Chocolate",
        cookTime: 3
      });
      expect(resp6.status).toBe(200);
      const resp7 = await postEntry({
        type: "ingredient",
        name: "Flour",
        cookTime: 5
      });
      expect(resp7.status).toBe(200);
      const resp8 = await getTask3("Top");
      expect(resp8.status).toBe(200);
      expect(resp8.body).toEqual({
        name: "Top",
        cookTime: 119,
        ingredients: [
          {name: "Base", quantity: 29},
          {name: "Chocolate", quantity: 20},
          {name: "Flour", quantity: 6}
        ]
      })
    });
    it("Error test", async () => {
      const meatball = {
        type: "recipe",
        name: "Bleh",
        requiredItems: [{ name: "Boo", quantity: 1 }],
      };
      const resp1 = await postEntry(meatball);
      expect(resp1.status).toBe(200);

      const resp2 = await postEntry({
        type: "recipe",
        name: "Boo",
        requiredItems: [{name: "Bonk", quantity: 10}]
      });
      expect(resp2.status).toBe(200);

      const resp3 = await getTask3("Bleh");
      expect(resp3.status).toBe(400);
      expect(resp3.text).toEqual("required item not found in the cookbook")
    });
  });
});
