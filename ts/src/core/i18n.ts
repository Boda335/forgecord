import fs from 'fs';
import path from 'path';
import { Logger } from './logger';
import { ROOT_DIR } from './paths';
import type { TranslationRecord } from '../types/i18n';
export type { TranslationRecord } from '../types/i18n';

export class I18nManager {
  translations: Record<string, TranslationRecord> = {};
  defaultLang: string;
  cache = new Map<string, I18nInstance>();
  private readonly userLanguages = new Map<string, string>();
  private readonly languageStore: string;

  constructor(defaultLang = 'en') {
    this.defaultLang = defaultLang;
    this.languageStore = path.join(ROOT_DIR, 'data', 'user-languages.json');
    this.loadTranslations();
    this.loadUserLanguages();
  }

  private loadUserLanguages(): void {
    try {
      if (!fs.existsSync(this.languageStore)) return;
      const data = JSON.parse(fs.readFileSync(this.languageStore, 'utf8')) as Record<string, string>;
      for (const [userId, lang] of Object.entries(data)) if (typeof lang === 'string') this.userLanguages.set(userId, lang);
    } catch (error) {
      Logger.error('Failed to load user language preferences:', error);
    }
  }

  private saveUserLanguages(): void {
    try {
      fs.mkdirSync(path.dirname(this.languageStore), { recursive: true });
      const temp = `${this.languageStore}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(Object.fromEntries(this.userLanguages), null, 2), 'utf8');
      fs.renameSync(temp, this.languageStore);
    } catch (error) {
      Logger.error('Failed to save user language preferences:', error);
    }
  }

  async setUserLanguage(userId: string, lang: string): Promise<boolean> {
    if (!this.translations[lang]) return false;
    this.userLanguages.set(String(userId), lang);
    this.saveUserLanguages();
    return true;
  }

  getUserLanguage(userId: string): string {
    const lang = this.userLanguages.get(String(userId));
    return lang && this.translations[lang] ? lang : this.defaultLang;
  }

  loadTranslations(): void {
    const langDir = path.join(ROOT_DIR, 'lang');
    if (!fs.existsSync(langDir)) return;

    for (const file of fs.readdirSync(langDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const lang = path.basename(file, '.json');
        this.translations[lang] = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf8'));
      } catch (error) {
        Logger.error(`Failed to load language file ${file}:`, error);
      }
    }
  }

  private getNestedValue(obj: unknown, key: string): unknown {
    if (!obj || !key || typeof obj !== 'object') return undefined;
    return key.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
      return undefined;
    }, obj);
  }

  t(lang: string, key: string, variables: Record<string, unknown> = {}): string {
    const value = this.getNestedValue(this.translations[lang], key)
      ?? this.getNestedValue(this.translations[this.defaultLang], key)
      ?? key;
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? `{${name}}`));
  }

  tDefault(key: string, variables: Record<string, unknown> = {}): string {
    return this.t(this.defaultLang, key, variables);
  }

  getLocalizations(key: string, { includeDefault = false } = {}): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [lang, data] of Object.entries(this.translations)) {
      if (!includeDefault && lang === this.defaultLang) continue;
      const value = this.getNestedValue(data, key);
      if (typeof value === 'string' && value.trim()) result[lang] = value;
    }
    return result;
  }

  getAvailableLanguages() {
    return Object.entries(this.translations).map(([lang, data]) => ({
      lang,
      name: data.langConfig?.name ?? lang,
      flag: data.langConfig?.flag ?? '',
      short: data.langConfig?.short ?? lang,
    }));
  }

  get(lang: string): I18nInstance {
    const safeLang = this.translations[lang] ? lang : this.defaultLang;
    if (!this.cache.has(safeLang)) this.cache.set(safeLang, new I18nInstance(safeLang, this));
    return this.cache.get(safeLang)!;
  }

  async getForUser(userId: string): Promise<I18nInstance> {
    return this.get(this.getUserLanguage(userId));
  }

}

export class I18nInstance {
  constructor(public readonly lang: string, private readonly manager: I18nManager) {}
  t(key: string, variables: Record<string, unknown> = {}): string { return this.manager.t(this.lang, key, variables); }
  getLang(): string { return this.lang; }
}
