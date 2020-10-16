export const make = function (name, data, items) {
  let actorPromise= Actor.create({
    name: name,
    type: "npc",   
    data: JSON.parse(data)
  });
  actorPromise.then(actor => {
    JSON.parse(items).forEach(item => {
     actor.createOwnedItem(item, {renderSheet: false});
    })
  })
}