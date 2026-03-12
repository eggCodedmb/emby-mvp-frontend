<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { applyLocale, type AppLocale } from '../i18n'

const { locale, t } = useI18n()

const onLocaleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as AppLocale
  applyLocale(value)
}
</script>

<template>
  <label class="language-switcher">
    <span class="language-switcher__label">{{ t('language.label') }}</span>
    <select class="language-switcher__select" :value="locale" @change="onLocaleChange">
      <option value="zh-CN">{{ t('language.zhCN') }}</option>
      <option value="en">{{ t('language.en') }}</option>
    </select>
  </label>
</template>
