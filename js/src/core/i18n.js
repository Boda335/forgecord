'use strict';

const fs = require('fs');
const path = require('path');
const { Logger } = require('./logger');
const { ROOT_DIR } = require('./paths');

class I18nManager {
  constructor(defaultLang = 'en') {
    this.translations = {};
    this.defaultLang = defaultLang;
    this.cache = new Map();
    this.userLanguages = new Map();
    this.languageStore = path.join(ROOT_DIR, 'data', 'user-languages.json');

    this.loadTranslations();
    this.loadUserLanguages();
  }

  loadUserLanguages() {
    try {
      if (fs.existsSync(this.languageStore)) {
        const data = JSON.parse(fs.readFileSync(this.languageStore, 'utf-8'));
        for (const [userId, lang] of Object.entries(data || {})) {
          if (typeof lang === 'string') this.userLanguages.set(String(userId), lang);
        }
      }
    } catch (error) {
      Logger.error('Failed to load user language preferences:', error);
    }
  }

  saveUserLanguages() {
    try {
      fs.mkdirSync(path.dirname(this.languageStore), { recursive: true });
      const data = Object.fromEntries(this.userLanguages.entries());
      const temp = `${this.languageStore}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(temp, this.languageStore);
    } catch (error) {
      Logger.error('Failed to save user language preferences:', error);
    }
  }

  async setUserLanguage(userId, lang) {
    if (!this.translations[lang]) return false;
    this.userLanguages.set(String(userId), lang);
    this.saveUserLanguages();
    return true;
  }

  getUserLanguage(userId) {
    const lang = this.userLanguages.get(String(userId));
    return lang && this.translations[lang] ? lang : this.defaultLang;
  }

  loadTranslations() {
    const langDir = path.join(ROOT_DIR, 'lang');

    if (!fs.existsSync(langDir)) {
      return;
    }

    const files = fs.readdirSync(langDir);

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      try {
        const lang = path.basename(file, '.json');

        const content = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf-8'));

        this.translations[lang] = content;
      } catch (error) {
        Logger.error(`Failed to load language file ${file}:`, error);
      }
    }
  }

  t(lang, key, variables = {}) {
    const value = this.getNestedValue(this.translations[lang], key) ?? this.getNestedValue(this.translations[this.defaultLang], key) ?? key;

    if (typeof value !== 'string') {
      return key;
    }

    return value.replace(/\{(\w+)\}/g, (_, varName) => String(variables[varName] ?? `{${varName}}`));
  }

  tDefault(key, variables = {}) {
    return this.t(this.defaultLang, key, variables);
  }

  getNestedValue(obj, key) {
    if (!obj || !key) {
      return undefined;
    }

    return key.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  getLocalizations(key, { includeDefault = false } = {}) {
    const localizations = {};

    for (const [lang, data] of Object.entries(this.translations)) {
      if (!includeDefault && lang === this.defaultLang) continue;

      const value = this.getNestedValue(data, key);

      if (typeof value === 'string' && value.trim()) {
        localizations[lang] = value;
      }
    }

    return localizations;
  }

  getAvailableLanguages() {
    return Object.entries(this.translations).map(([lang, data]) => ({
      lang,

      name: data?.langConfig?.name ?? lang,

      flag: data?.langConfig?.flag ?? '',

      short: data?.langConfig?.short ?? lang,
    }));
  }

  get(lang) {
    const safeLang = this.translations[lang] ? lang : this.defaultLang;

    if (!this.cache.has(safeLang)) {
      this.cache.set(safeLang, new I18nInstance(safeLang, this));
    }

    return this.cache.get(safeLang);
  }


}

class I18nInstance {
  constructor(lang, manager) {
    this.lang = lang;
    this.manager = manager;
  }

  t(key, variables = {}) {
    return this.manager.t(this.lang, key, variables);
  }

  getLang() {
    return this.lang;
  }
}

module.exports = {
  I18nManager,
  I18nInstance,
};
