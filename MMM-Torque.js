'use strict';

/**
 * Torque module for MagicMirror²
 * Module properties and methods from https://github.com/MagicMirrorOrg/MagicMirror/blob/master/js/module.js
 */
Module.register('MMM-Torque', {
  /**
   * Lowest required version of MagicMirror, checked after module load
   * @returns {string} version string
   */
  requiresVersion: '2.25.0',
  /**
   * Configuration defaults
   * @returns {object} Defaults for config
   */
  defaults: {
    refreshIntervalMs: 60 * 1000,
    dataDirPaths: [],
    allowedExtensions: ['.apng', '.png', '.avif', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.webp'],
    showHeader: false,
    randomizeImages: true,
    randomizeAnimations: true,
  },
  init() {
    this.torque.onInit(this);
  },
  async start() {
    this.torque.onStart();
  },
  /**
   * Additional styles to be loaded with module
   * @returns {string[]} An array with filenames
   */
  getStyles() {
    return ['torque.css'];
  },
  getHeader() {
    return this.torque.getHeader();
  },
  /**
   * Nunjucks template string | filename
   * @returns {string} Template string | filename
   */
  getTemplate() {
    return 'torque.njk';
  },
  /**
   * Nunjucks template variable dictionary
   * @returns {object} Template data
   */
  getTemplateData() {
    return this.torque.getNunjucksData();
  },
  notificationReceived(notification, payload, sender) {
    this.torque.onNotification(notification, payload, sender);
  },
  socketNotificationReceived(notification, payload) {
    this.torque.onNotification(notification, payload, this.torque.nodeHelperSender);
  },
  suspend() { 
    this.torque.enableHearthbeat(false, 'Torque: Suspended');
  },
  resume() {
    this.torque.enableHearthbeat(true);
  },
  /**
   * Torque namespaced functionality
   */
  torque: {
    headerMessage: 'Torque: Loading...',
    filesLoaded: false,
    dataUrl: null,
    dataName: null,
    refreshTimer: null,
    heartbeatTimer: null,
    lastUpdateTime: null,
    nodeHelperSender: 'torque_node_helper',
    indexBegAnimation: 0,
    indexEndAnimation: 0,
    begAnimations: ['bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake', 'swing', 'tada', 'wobble', 'jello', 'heartBeat', 'backInDown', 'backInLeft',
      'backInRight', 'backInUp', 'bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp', 'fadeIn', 'fadeInDown', 'fadeInDownBig', 'fadeInLeft',
      'fadeInLeftBig', 'fadeInRight', 'fadeInRightBig', 'fadeInUp', 'fadeInUpBig', 'fadeInTopLeft', 'fadeInTopRight', 'fadeInBottomLeft', 'fadeInBottomRight',
      'flip', 'flipInX', 'flipInY', 'lightSpeedInRight', 'lightSpeedInLeft', 'rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight',
      'jackInTheBox', 'rollIn', 'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp', 'slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp'],
    endAnimations: ['backOutDown', 'backOutLeft', 'backOutRight', 'backOutUp', 'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp', 'fadeOut',
      'fadeOutDown', 'fadeOutDownBig', 'fadeOutLeft', 'fadeOutLeftBig', 'fadeOutRight', 'fadeOutRightBig', 'fadeOutUp', 'fadeOutUpBig', 'fadeOutTopLeft', 'fadeOutTopRight',
      'fadeOutBottomRight', 'fadeOutBottomLeft', 'flipOutX', 'flipOutY', 'lightSpeedOutRight', 'lightSpeedOutLeft', 'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight',
      'rotateOutUpLeft', 'rotateOutUpRight', 'hinge', 'rollOut', 'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp', 'slideOutDown', 'slideOutLeft',
      'slideOutRight', 'slideOutUp'],
    /**
     * Initialize module for Torque
     * @param {Module} module MagicMirror module reference
     */
    onInit(module) {
      Log.info(`Initialize module: MMM-Torque`);
      this.module = module;
    },
    /**
     * Begin heartbeat
     */
    onStart() {
      Log.info(`Starting module: ${this.module.name}#${this.module.identifier} with config => ${JSON.stringify(this.module.config)}`);
      if (this.module.config.randomizeAnimations) {
        this.shuffleArray(this.begAnimations);
        this.shuffleArray(this.endAnimations);
      }
      this.enableHearthbeat(true);
    },
    /**
     * Clear heartbeat timer
     * Reset heartbeat timer
     * Enable starts heartbeat timer
     * Disable sets header
     * Request file list
     * @param {boolean} enable start/stop heartbeat
     */
    enableHearthbeat(enable=true, disableStatus='') {
      this.lastUpdateTime = Date.now();
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
      }
      if (enable) {
        Log.info(`Enable module: ${this.module.name}#${this.module.identifier}`);
        this.heartbeatTimer = setInterval(() => this.onHeartbeat(), 1500);
      } else {
        Log.info(`Disable module: ${this.module.name}#${this.module.identifier} status=${disableStatus}`);
        this.headerMessage = disableStatus;
        this.module.updateDom();
      }
      if (enable && !this.filesLoaded) {
        this.module.sendSocketNotification('BUILD_FILE_LIST', {module_id: this.module.identifier, config: this.module.config});
      }
    },
    /**
     * Refresh DOM
     * Request another file
     * @param {boolean} immediate skip refresh and perform update
     */
    onHeartbeat(immediate = false) {
      if (immediate || Date.now() - this.lastUpdateTime > this.module.config.refreshIntervalMs) {
        this.lastUpdateTime = Date.now();
        this.module.updateDom({options: {speed: 3000, animate: {in: this.getRandomBegAnimate(), out: this.getRandomEndAnimate()}}});
        this.module.sendSocketNotification('RETRIEVE_DATA_URL', {module_id: this.module.identifier, config: this.module.config});
      }
    },
    /**
     * Response for file list request
     * @param {Object} payload socket payload
     */
    onHelperFilesLoaded(payload) {
      Log.info(`${this.module.name}#${this.module.identifier} has ${payload.file_count} files`)
      this.filesLoaded = true;
      if (payload.file_count > 0) {
        this.module.sendSocketNotification('RETRIEVE_DATA_URL', {module_id: this.module.identifier, config: this.module.config});
      }
    },
    /**
     * Response from data request
     * @param {Object} payload socket payload
     */
    onHelperData(payload) {
      const immediateUpdate = this.dataUrl === null && payload.file_content !== null;
      if (this.module.config.showHeader) {
        this.headerMessage = payload.file_name;
      } else {
        this.headerMessage = '';
      }
      this.dataName = payload.file_name;
      this.dataUrl = payload.file_content;
      if (immediateUpdate) {
        this.onHeartbeat(immediateUpdate);
      }
    },
    /**
     * Nunjucks template data
     * @returns {Object} data
     */
    getNunjucksData() {
      return {
        dataUrl: this.dataUrl,
      };
    },
    getHeader() {
      return this.headerMessage;
    },
    /**
     * Handle module-to-module, system-to-module, or node-to-module notifications
     * @param {string} notification notification type
     * @param {*} payload notification payload
     * @param {Module} sender notification sender, if undefined then is it from the core system
     * @returns {void}
     */
    onNotification(notification, payload = {}, sender = null) {
      const isSystem = typeof sender === 'undefined' || sender == null;

      if (sender === this.nodeHelperSender) {
        if (payload && 'module_id' in payload && payload.module_id === this.module.identifier) {
          if ('NODE_HELPER_FILE_COUNT' === notification) {
            this.onHelperFilesLoaded(payload);
          } else if ('NODE_HELPER_DATA_URL' === notification) {
            this.onHelperData(payload)
          } else if ('NODE_HELPER_STOP' === notification) {
            this.enableHearthbeat(false, 'Torque: Helper Stopped');
          }
        }
      } else if (isSystem) {
        // core notifications: MODULE_DOM_CREATED, MODULE_DOM_UPDATED, DOM_OBJECTS_CREATED
        if ('MODULE_DOM_UPDATED' === notification && this.dataName) {
          Log.info(`Loaded ${this.module.name}#${this.module.identifier} with ${this.dataName}`);
        }
      } else {
        // module-to-module notification
      }
    },
    /**
     * Random animate value
     * @returns random `in` animate value
     */
    getRandomBegAnimate() {
      let result = this.begAnimations[this.indexBegAnimation];
      if (this.indexBegAnimation >= this.begAnimations.length) {
        this.indexBegAnimation = 0;
      } else {
        this.indexBegAnimation = this.indexBegAnimation + 1;
      }
      return result;
    },
    /**
     * Random animate value
     * @returns random `out` animate value
     */
    getRandomEndAnimate() {
      let result = this.endAnimations[this.indexEndAnimation];
      if (this.indexEndAnimation >= this.endAnimations.length) {
        this.indexEndAnimation = 0;
      } else {
        this.indexEndAnimation = this.indexEndAnimation + 1;
      }
      return result;
    },
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
  },
});
