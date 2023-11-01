/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uw06ok54mw3xmlg")

  collection.listRule = "@request.auth.id = user.id && active = true"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("uw06ok54mw3xmlg")

  collection.listRule = "@request.auth.id = user.id"

  return dao.saveCollection(collection)
})
