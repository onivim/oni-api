# Oni API

This documents the surface area of Oni's API, which is available to both _plugins_ and _configuration_.

A good starting point is the [Plugin API](interfaces/plugin.api.html), which is the object passed into the `activate` methods.

The [Plugin API](interfaces/plugin.api.html) is available in a few places:

### Developer Tools

There is a global `Oni` object available in the developer tools:
- Open the command palette and execute `Open Devtools`
- Go to the `Console` tab
- Start executing against the `Oni` object

![example](./../images/devtools-example.png)

This is great for quick debugging or exploring the API surface area.

### User Configuration

An `Oni` API object is passed to the `activate` method of your config. An example `config.js` using the API object is:

```
const activate = (oni) => {
    // The passed in `oni` object is an instance of the Plugin API
}

module.exports = {
    activate,
}
```

### Plugins

Like the user configuration, for plugins, the entry point is an `activate` method with an Oni object passed in.
