# MMM-Torque

`MMM-Torque` is an image slideshow module for MagicMirror²

Initial inspiration taken from [MMM-ImageSlideshow](https://github.com/AdamMoses-GitHub/MMM-ImageSlideshow), and the goal of learning how to create a module in MagicMirror². The `Torque` name does not mean anything, [naming things is hard](https://martinfowler.com/bliki/TwoHardThings.html).

## Install

```bash
# install
cd ~/MagicMirror/modules
git clone https://github.com/jbnimble/MMM-Torque
```

## Update

```bash
# update
cd ~/MagicMirror/modules/MMM-Torque
git pull
```

## Dependencies

The `node_helper.js` uses `node:fs/promises`, which should theoretically be available in Node by default. No external API has been used, the module only reads the file system using the `dataDirPaths` provided.

## Configuration

Add to modules configuration file `~/MagicMirror/config/config.js` or `~/MagicMirror/config/config.js.template`.

The module is best viewed using `position: 'fullscreen_above'`, because the CSS uses most of the screen for the images.

All `config` values can be omitted, with the exception of `dataDirPaths` should have one or more directory paths added.

Simple Example Configuration:

```javascript
{
    module: "MMM-Torque",
    position: "fullscreen_above",
    config: {
        dataDirPaths: ["/path/to/data", "/other/path/to/data"],
    }
},
```

Configuration Options:

- `refreshIntervalMs`, Number of milliseconds between changing images
- `dataDirPaths`, String Array of directory paths accessible by the Node process
- `allowedExtensions`, String Array of file extensions that will be loaded
- `showHeader`, Boolean to show the file path in the header
- `randomizeImages`, Boolean to shuffle list of images
- `randomizeAnimations`, Boolean to shuffle the animations

## Development

Useful commmands used during development

```bash
# copy files to test instance
scp MMM-Torque.js node_helper.js torque.css torque.njk mirror@magicmirror.local:/home/mirror/MagicMirror/modules/MMM-Torque

# tail Node logs
pm2 logs mm

# linting
npm run lint
npm run lint:fix

# After updating package.json
npm update
```

Installing the [MMM-Remote-Control](https://github.com/Jopyth/MMM-Remote-Control) module was useful during development

## Wishlist

Potential features and improvements, in no particular order:

- Test show/hide feature
- Start versioning with Git tags
- More CSS options for sizing/placement of images
- Add sanity checks for `config` values
- Add opacity configuration?
- Add file list reload
- Add `CHANGELOG.md`
- Add `CODE_OF_CONDUCT.md`

## License

Using the [__ISC__](https://opensource.org/license/isc-license-txt), see the [LICENSE.md](LICENSE.md) file
