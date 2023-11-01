/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "lwalvc39tqsgjr3",
    "created": "2023-10-31 17:35:41.011Z",
    "updated": "2023-10-31 17:35:41.011Z",
    "name": "ticket_contents",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "a3zzvwyg",
        "name": "dish",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "v2srfajwtbdb0tb",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "bzzewwuu",
        "name": "ticket",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "uw06ok54mw3xmlg",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("lwalvc39tqsgjr3");

  return dao.deleteCollection(collection);
})
