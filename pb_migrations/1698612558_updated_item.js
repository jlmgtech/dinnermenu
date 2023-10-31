/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("5kzvw0t4xxpl6vp")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "o9fgnefb",
    "name": "ingredients",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("5kzvw0t4xxpl6vp")

  // remove
  collection.schema.removeField("o9fgnefb")

  return dao.saveCollection(collection)
})
