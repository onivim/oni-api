# Oni API

This documents the surface area of Oni's API, which is available to both _plugins_ and _configuration_.

A good starting point is the [Plugin API](interfaces/plugin.api.html), which is the object passed into the `activate` methods.

An example `config.js` using the API object is:

```
const activate = (oni) => {
    // The passed in `oni` object is an instance of the Plugin API
}

module.exports = {
    activate,
}
```

Likewise, for a plugin, the entry point is an `activate` method with a [Plugin API](interfaces/plugin.api.html) object passed in.


