/* eslint-disable @typescript-eslint/no-explicit-any */
// 翻譯系統類型定義

// 從統一配置文件導入語言類型
import type { Language } from '@/config/languages';
export type { Language } from '@/config/languages';

// 動態生成語言鍵值的映射類型
type LanguageKeys = Record<Language, string>;

// 翻譯鍵值類型 - 基於AI搜索應用的界面文本結構
export interface TranslationKeys {
  app: {
    title: string;
    edit: {
      test: string;
      placeholder: string;
      titlePlaceholder: string;
      imageMenu: {
        copy: string;
        shrink: string;
        enlarge: string;
      };
    };
    // 新增模塊：工具欄
    toolBar: {
      addDraft: {
        mac: string;
        win: string;
      };
      showAllDrafts: string;
      backDraft: string;
      chatAI: {
        mac: string;
        win: string;
      };
      exportMarkdown: string;
      downloading: string;
      updateAvailable: string;
      formatBold: {
        mac: string;
        win: string;
      };
      formatItalic: {
        mac: string;
        win: string;
      };
      formatList: {
        mac: string;
        win: string;
      };
      insertImage: string;
      searchDrafts: {
        mac: string;
        win: string;
      };
    };
    search: {
      placeholder: string;
      button: string;
      results: string;
      noResults: string;
      untitled: string;
      global: string;
      inNote: string;
      matches: string;
      noKeyword: string;
      start: string;
    };
    settings: {
      title: string;
      visualIndex: string;
      gpuService: string;
      userExperience: string;
      language: string;
      logFolder: string;
      open: string;
      community: string;
      feedback: string;
      activationPageTitle?: string;
      activationJoinDiscord?: string;
      activationPrice?: string;
      activationCodeLabel?: string;
      activationCodePlaceholder?: string;
      activationCodeHelper?: string;
      activationButton?: string;
      activationLoading?: string;
      activationTrialButton?: string;
      activationSuccessTitle?: string;
      activationSuccessDesc?: string;
      activationBackButton?: string;
      activationSuccessToast?: string;
      install?: string;
      reInstall?: string;
      checkUpdate?: string;
      check?: string;
      checking?: string;
      checkUpdateStatusLatest?: string;
      checkUpdateStatusNewVersion?: string;
      generalSettings?: string;
      aiSettings?: string;
      update?: string;
      about?: string;
      website?: string;
      trialDaysLeft?: string;
    };
    common: {
      confirm: string;
      cancel: string;
      save: string;
      close: string;
      on: string;
      off: string;
      settings: string;
    };
    language: {
      title: string;
    } & LanguageKeys; // 使用映射類型動態生成語言鍵值
    // 新增模塊：預載入/更新對話
    preload: {
      loading: string;
      updateTitle: string;
      updateContent: string;
      updatePrimary: string;
      updateSecondary: string;
      initFailed: string;
      openLog: string;
    };
    // 新增模塊：使用者體驗改進協議
    reportProtocol: {
      title: string;
      primaryButtonText: string;
      secondaryButtonText: string;
      content: string;
      notRemindLabel: string;
    };
    // 新增模塊：版本更新提示
    updateTips: {
      title: string;
      primaryButtonText: string;
      content: string;
    };
    // 新增模塊：聯絡我們
    contact: {
      title: string;
      joinDiscord: string;
      addWechat: string;
    };
  };
}

// 翻譯資源類型
export type TranslationResources = Record<Language, TranslationKeys>;

// 動態生成語言路徑的工具類型
type LanguagePaths = `app.language.${Language}`;

// 翻譯鍵路徑類型 - 支援點分隔的巢狀鍵值
export type TranslationKeyPath =
  | 'app.title'
  | 'app.edit.test'
  | 'app.edit.placeholder'
  | 'app.edit.titlePlaceholder'
  | 'app.edit.imageMenu.copy'
  | 'app.edit.imageMenu.shrink'
  | 'app.edit.imageMenu.enlarge'

  // 新增模塊：工具欄
  | 'app.toolBar.addDraft.mac'
  | 'app.toolBar.addDraft.win'
  | 'app.toolBar.showAllDrafts'
  | 'app.toolBar.backDraft'
  | 'app.toolBar.chatAI.mac'
  | 'app.toolBar.chatAI.win'
  | 'app.toolBar.exportMarkdown'
  | 'app.toolBar.downloading'
  | 'app.toolBar.updateAvailable'
  | 'app.toolBar.formatBold.mac'
  | 'app.toolBar.formatBold.win'
  | 'app.toolBar.formatItalic.mac'
  | 'app.toolBar.formatItalic.win'
  | 'app.toolBar.formatList.mac'
  | 'app.toolBar.formatList.win'
  | 'app.toolBar.insertImage'
  | 'app.toolBar.searchDrafts.mac'
  | 'app.toolBar.searchDrafts.win'
  | 'app.search.placeholder'
  | 'app.search.noResults'
  | 'app.search.untitled'
  | 'app.search.global'
  | 'app.search.inNote'
  | 'app.search.matches'
  // 设置
  | 'app.settings.title'
  | 'app.settings.visualIndex'
  | 'app.settings.gpuService'
  | 'app.settings.userExperience'
  | 'app.settings.language'
  | 'app.settings.logFolder'
  | 'app.settings.open'
  | 'app.settings.activationPageTitle'
  | 'app.settings.activationJoinDiscord'
  | 'app.settings.activationPrice'
  | 'app.settings.activationCodeLabel'
  | 'app.settings.activationCodePlaceholder'
  | 'app.settings.activationCodeHelper'
  | 'app.settings.activationButton'
  | 'app.settings.activationLoading'
  | 'app.settings.activationTrialButton'
  | 'app.settings.activationSuccessTitle'
  | 'app.settings.activationSuccessDesc'
  | 'app.settings.activationBackButton'
  | 'app.settings.activationSuccessToast'
  | 'app.settings.checkUpdate'
  | 'app.settings.check'
  | 'app.settings.checking'
  | 'app.settings.checkUpdateStatusLatest'
  | 'app.settings.checkUpdateStatusNewVersion'
  | 'app.settings.aiSettings'
  | 'app.settings.update'
  | 'app.settings.about'
  | 'app.settings.trialDaysLeft'
  | 'app.common.confirm'
  | 'app.common.cancel'
  | 'app.common.save'
  | 'app.common.close'
  | 'app.common.on'
  | 'app.common.off'
  | 'app.common.settings'
  | 'app.language.title'
  | LanguagePaths // 使用工具類型動態生成語言路徑

  // 新增模塊：預載入/更新對話
  | 'app.preload.loading'
  | 'app.preload.updateTitle'
  | 'app.preload.updateContent'
  | 'app.preload.updatePrimary'
  | 'app.preload.updateSecondary'
  | 'app.preload.initFailed'
  | 'app.preload.openLog'
  // 新增模塊：使用者體驗改進協議
  | 'app.reportProtocol.title'
  | 'app.reportProtocol.primaryButtonText'
  | 'app.reportProtocol.secondaryButtonText'
  | 'app.reportProtocol.content'
  | 'app.reportProtocol.notRemindLabel'
  // 新增模塊：版本更新提示
  | 'app.updateTips.title'
  | 'app.updateTips.primaryButtonText'
  | 'app.updateTips.content'
  // 新增模塊：聯絡我們
  | 'app.contact.title'
  | 'app.contact.joinDiscord'
  | 'app.contact.addWechat'
  // 新增模塊：列表表格
  | 'app.table.columns.name'
  | 'app.table.columns.path'
  | 'app.table.columns.modifiedAt'
  | 'app.table.columns.fileType'
  | 'app.table.menu.openFile'
  | 'app.table.menu.openFolder'
  | 'app.table.menu.aiMark';

// 翻譯上下文類型
export interface I18nContextType {
  currentLanguage: Language;
  translations: Partial<TranslationResources>;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  isLoading: boolean;
}

// useTranslation 返回值類型
export interface UseTranslationReturn {
  t: (key: TranslationKeyPath, params?: Record<string, any>) => string;
  currentLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
}

// 語言配置類型
export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
}
