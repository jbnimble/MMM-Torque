'use strict';

const NodeHelper = require('node_helper');
const Log = require('logger');
const fs = require('node:fs/promises');

/**
 * Torque node_helper
 */
class TorqueServer {
  constructor() {
    this.state = {
      /* 
      Data structure for handling file references, and ordering 
      module_id: {
        files: [], // full_path of files
        index: 0,  // index of files Array to send, increments per send
        config: {} // config received from front end
      }
      */
    };
  }
  /**
   * Name of the MagicMirror² module
   * @returns {string} module name
   */
    getName() {
      return 'MMM-Torque';
    }

  /**
   * Module initializing
   * @returns {void}
   */
  init(module) {
    Log.info(`Initializing module: ${this.getName()}`);
    this.module = module;
  }

  /**
   * Module loaded
   * @returns {void}
   */
  loaded() {
    Log.info(`Loaded module helper: ${this.module.name}`);
  }

  /**
   * Module starting
   * @returns {void}
   */
  start() {
    Log.info(`Starting module helper: ${this.module.name}`);
    // socket not initialized
  }

  /**
   * Module stopping
   * @returns {void}
   */
  stop() {
    Log.log(`Stopping module helper ${this.module.name}`);
    this.module.sendSocketNotification('NODE_HELPER_STOP', {});
  }

  /**
   * Handle notifications from module
   * @param {String} notification identifier
   * @param {Object} payload notification payload
   * @returns {void}
   */
  onNotification(notification, payload) {
    if (payload && 'module_id' in payload) {
      this.initModuleFiles(payload.module_id);
      if ('BUILD_FILE_LIST' === notification) {
        this.readFiles(payload.module_id, payload.config.dataDirPaths, payload.config.allowedExtensions);
        this.state[payload.module_id].config = payload.config;
      } else if ('RETRIEVE_DATA_URL' === notification) {
        this.sendData(payload.module_id);
      }
    } else {
      Log.warn(`${this.getName()} recieved ${notification} with ${payload}`);
    }
  }

  /**
   * Recursive build from `dataDirPaths` directories of a list of data files
   * sends socket notification per `dataDirPaths` entry
   * file results stored in `state.fileLlist`
   * 
   * @param {String} module_id module instance identifier 
   * @param {String[]} dataDirPaths directories to look for images
   * @param {String[]} allowedExtensions allowed file extension filter
   * @returns {void}
   */
  async readFiles(module_id, dataDirPaths, allowedExtensions) {
    if (dataDirPaths.length > 0) {
      let result = [];
      for (const path of dataDirPaths) {
        if (path && path.trim()) {
          try {
            const files = await fs.readdir(path, {'recursive': true});
            for (const file of files) {
              const full_path = `${path}/${file}`;
              // add if ends with allowed extension and not already in Array
              if (allowedExtensions.some((element) => file.endsWith(element)) && !this.state[module_id].files.includes(full_path)) {
                result.push(full_path);
              }
            }
          } catch (err) {
            Log.error(`${module_id} failed to read files in ${path} due to ${err}`);
          }
        }
      }
      if (this.state[module_id].config && 'randomizeImages' in this.state[module_id].config && this.state[module_id].config.randomizeImages) {
        this.shuffleArray(result);
      }
      this.state[module_id].files = result;
    }
    const file_count = this.state[module_id].files.length;
    Log.info(`${module_id} file count ${file_count}`);
    this.module.sendSocketNotification(`NODE_HELPER_FILE_COUNT`, {'module_id': module_id, 'file_count': file_count});
  }

  /**
   * Initialize an empty `files` for the requested module_id
   * 
   * @param {String} module_id module instance identifier
   * @returns {void}
   */
  initModuleFiles(module_id) {
    if (!(module_id in this.state)) {
      this.state[module_id] = {};
    }
    if (!('files' in this.state[module_id])) {
      this.state[module_id]['files'] = [];
    }
    if (!('index' in this.state[module_id])) {
      this.state[module_id]['index'] = 0;
    }
  }

  async sendData(module_id) {
    if (this.state[module_id].files.length > 0) {
      const file_name = this.state[module_id].files[this.state[module_id].index];
      try {
        const contents = await fs.readFile(file_name);
        const base64_contents = contents.toString('base64');
        const mimeType = this.mapMimeType(file_name);
        const file_content = `data:${mimeType};base64,${base64_contents}`;
        Log.info(`Sending ${module_id} index=${this.state[module_id].index} file_name=${file_name}`);
        this.module.sendSocketNotification(`NODE_HELPER_DATA_URL`, {'module_id': module_id, 'file_name': file_name, 'file_content': file_content});
        // update index
        if (this.state[module_id].index >= this.state[module_id].files.length) {
          this.state[module_id].index = 0; // reset index if looped file length
        } else {
          this.state[module_id].index = this.state[module_id].index + 1;
        }
      } catch (err) {
        Log.error(`Failed to read ${module_id} file ${file_name} due to ${err}`);
      }
    } else {
      Log.warn(`${module_id} attempted to request data when none is available`);
    }
  }

  /**
   * Map the filename extension to MIME type
   * Reference https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types
   * @param {string} filename 
   * @returns {string} MIME type
   */
  mapMimeType(filename) {
    let result = 'image/jpeg';
    if (filename.endsWith('.apng')) {
      result = 'image/apng';
    } else if (filename.endsWith('.avif')) {
      result = 'image/avif';
    } else if (filename.endsWith('.gif')) {
      result = 'image/gif';
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.jfif') || filename.endsWith('.pjpeg') || filename.endsWith('.pjp')) {
      result = 'image/jpeg';
    } else if (filename.endsWith('.png')) {
      result = 'image/png';
    } else if (filename.endsWith('.svg')) {
      result = 'image/svg+xml';
    } else if (filename.endsWith('.webp')) {
      result = 'image/webp';
    }
    return result;
  }
  /**
   * Shuffle in place Array
   * @param {string []} array 
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

let torque = new TorqueServer();

module.exports = NodeHelper.create({
  init: function() { torque.init(this) },
  loaded: () => torque.loaded(),
  start: () => torque.start(),
  stop: () => torque.stop(),
  socketNotificationReceived: (notification, payload) => torque.onNotification(notification, payload),
});
