from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .logger import Logger
from .paths import ROOT_DIR


_LOGGER: Logger | None = None

def _logger() -> Logger:
    global _LOGGER
    if _LOGGER is None:
        _LOGGER = Logger()
    return _LOGGER


class I18nInstance:
    def __init__(self, lang: str, manager: "I18nManager"):
        self.lang = lang
        self.manager = manager

    def t(self, key: str, variables: dict[str, Any] | None = None) -> str:
        return self.manager.t(self.lang, key, variables or {})

    def get_lang(self) -> str:
        return self.lang


class I18nManager:
    def __init__(self, default_lang: str = "en"):
        self.default_lang = default_lang
        self.translations: dict[str, dict[str, Any]] = {}
        self.cache: dict[str, I18nInstance] = {}
        self.user_languages: dict[str, str] = {}
        self.language_store = ROOT_DIR / 'data' / 'user-languages.json'
        self.load_translations()
        self.load_user_languages()

    def load_user_languages(self) -> None:
        try:
            if self.language_store.exists():
                data = json.loads(self.language_store.read_text(encoding='utf-8'))
                self.user_languages = {str(k): str(v) for k, v in data.items() if isinstance(v, str)}
        except Exception as exc:
            _logger().error(f'Failed to load user language preferences: {exc}')

    def _save_user_languages(self) -> None:
        try:
            self.language_store.parent.mkdir(parents=True, exist_ok=True)
            temp = self.language_store.with_suffix('.tmp')
            temp.write_text(json.dumps(self.user_languages, ensure_ascii=False, indent=2), encoding='utf-8')
            temp.replace(self.language_store)
        except Exception as exc:
            _logger().error(f'Failed to save user language preferences: {exc}')

    def set_user_language(self, user_id: int | str, lang: str) -> bool:
        if lang not in self.translations:
            return False
        self.user_languages[str(user_id)] = lang
        self._save_user_languages()
        return True

    def get_user_language(self, user_id: int | str) -> str:
        lang = self.user_languages.get(str(user_id), self.default_lang)
        return lang if lang in self.translations else self.default_lang

    def get_for_user(self, user_id: int | str) -> I18nInstance:
        return self.get(self.get_user_language(user_id))

    def load_translations(self) -> None:
        lang_dir = ROOT_DIR / "lang"
        if not lang_dir.exists():
            return
        for file in lang_dir.glob("*.json"):
            try:
                self.translations[file.stem] = json.loads(file.read_text(encoding="utf-8"))
            except Exception as exc:
                _logger().error(f"Failed to load language file {file.name}: {exc}")

    @staticmethod
    def _nested(data: Any, key: str) -> Any:
        if not isinstance(data, dict) or not key:
            return None
        current: Any = data
        for part in key.split("."):
            if not isinstance(current, dict) or part not in current:
                return None
            current = current[part]
        return current

    def t(self, lang: str, key: str, variables: dict[str, Any] | None = None) -> str:
        variables = variables or {}
        value = self._nested(self.translations.get(lang), key)
        if not isinstance(value, str):
            value = self._nested(self.translations.get(self.default_lang), key)
        if not isinstance(value, str):
            return key
        return __import__("re").sub(r"\{(\w+)\}", lambda m: str(variables.get(m.group(1), m.group(0))), value)

    def t_default(self, key: str, variables: dict[str, Any] | None = None) -> str:
        return self.t(self.default_lang, key, variables)

    def get(self, lang: str) -> I18nInstance:
        safe = lang if lang in self.translations else self.default_lang
        self.cache.setdefault(safe, I18nInstance(safe, self))
        return self.cache[safe]

    def get_available_languages(self) -> list[dict[str, str]]:
        return [
            {
                "lang": lang,
                "name": str(data.get("langConfig", {}).get("name", lang)),
                "flag": str(data.get("langConfig", {}).get("flag", "")),
                "short": str(data.get("langConfig", {}).get("short", lang)),
            }
            for lang, data in self.translations.items()
        ]
