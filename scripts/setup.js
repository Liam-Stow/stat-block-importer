Hooks.on("renderActorDirectory", (app, html, data) => {
    const importStatButton = $('<button>Import Stat Block from OneNote</button>');

    html.find('.directory-footer').append(importStatButton);
})