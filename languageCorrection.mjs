Hooks.once("init", () => {
    CONFIG.DND5E.languages.standard.children.sylvan = {
        label: "Sylvan",
        children: {
            //highgibberish: "High Sylvan"
        }
    };
    CONFIG.DND5E.languages.exotic.children.parseltongue = {
        label: "Parseltongue",
        children: {
        }
    };
    delete CONFIG.DND5E.languages.exotic.children.sylvan;
    delete CONFIG.DND5E.languages.standard.children.elvish;
});