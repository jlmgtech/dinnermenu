/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uw06ok54mw3xmlg")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "d9qcs9tc",
    "name": "active",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uw06ok54mw3xmlg")

  // remove
  collection.schema.removeField("d9qcs9tc")

  return dao.saveCollection(collection)
})
