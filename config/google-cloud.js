// config/google-cloud.js
const config = require('./index');

class GoogleCloudConfig {
  static getSpeechToTextConfig() {
    const configOptions = {
      projectId: config.google.projectId,
    };

    if (config.google.keyFilename) {
      configOptions.keyFilename = config.google.keyFilename;
    } else if (config.google.credentials) {
      configOptions.credentials = config.google.credentials;
    }

    return configOptions;
  }

  static getTranslationConfig() {
    const configOptions = {
      projectId: config.google.projectId,
    };

    if (config.google.keyFilename) {
      configOptions.keyFilename = config.google.keyFilename;
    } else if (config.google.credentials) {
      configOptions.credentials = config.google.credentials;
    }

    return configOptions;
  }

  static getTextToSpeechConfig() {
    const configOptions = {
      projectId: config.google.projectId,
    };

    if (config.google.keyFilename) {
      configOptions.keyFilename = config.google.keyFilename;
    } else if (config.google.credentials) {
      configOptions.credentials = config.google.credentials;
    }

    return configOptions;
  }
}

module.exports = GoogleCloudConfig;