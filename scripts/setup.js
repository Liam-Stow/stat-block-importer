import {convert} from './convert.js'

Hooks.on("renderActorDirectory", (app, html, data) => {
    const importStatButton = $('<button class="import-stat-button"> <i class="fas fa-camera"></i> Import Stat Block from OneNote</button>');
    
    const inputDialog = new Dialog({
        title: "Input stats from text",
        content: '<textarea cols=50 rows=50 id=input placeholder="Paste text..."></textarea>',
        buttons: {
            Import: {
                label: "Import",
                callback: async (html) => {
                    console.log(html.find("#input"))
                    convert(html.find("#input")[0].value);
                },
            },
            Cancel: {
                label: "Cancel",
            },
        },
    })
    
    importStatButton.click(ev => inputDialog.render(true));
    html.find('.header-actions').after(importStatButton);
})


