export const make = function (name, data, items) {
  console.log("making actor...");
  console.log(data)

  let actorPromise= Actor.create({
    name: name,
    type: "npc",   
    data: data
  });
  // actorPromise.then(actor => {
  //   JSON.parse(items).forEach(item => {
  //    actor.createOwnedItem(item, {renderSheet: false});
  //   })
  // })
}