// React 核心庫導入
import React from 'react';
// 導入國際化翻譯 Hook
import { useTranslation } from '@/contexts/I18nContext';
// 導入語言類型定義和配置
import { Language } from '@/type/i18n';
import { LANGUAGE_CONFIGS, getLanguageConfig } from '@/config/languages';
// shadcn 組件
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
// 導入國旗 React 組件
import {
    ChinaFlag,
    FranceFlag,
    GermanyFlag,
    JapanFlag,
    SouthKoreaFlag,
    UnitedStatesFlag,
    SaudiArabiaFlag,
} from '@/assets/icons/flagIcons';

// 建立 flagName 與 React 國旗組件的映射
const FLAG_COMPONENTS: Record<string, React.FC<{ width?: number; height?: number; className?: string }>> = {
    cn: ChinaFlag,
    fr: FranceFlag,
    de: GermanyFlag,
    jp: JapanFlag,
    tw: ChinaFlag,
    kr: SouthKoreaFlag,
    us: UnitedStatesFlag,
    sa: SaudiArabiaFlag,
};

// 根據 flagName 取得對應的 React 國旗組件
const getFlagComponentByName = (flagName: string) => FLAG_COMPONENTS[flagName];

/**
 * 語言切換器組件的屬性接口
 * @interface LanguageSwitcherProps
 */
interface LanguageSwitcherProps {
    /** 顯示變體：按鈕、按鈕組或下拉選單 */
    variant?: 'button' | 'button-group' | 'select';
    /** 組件大小 */
    size?: 'small' | 'medium' | 'large';
    /** 是否顯示標籤文字 */
    showLabel?: boolean;
}

/**
 * 語言切換器組件
 * 支援多種顯示模式：按鈕、按鈕組、下拉選單
 * 提供8種語言的切換功能，每種語言都有對應的國旗圖示
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    variant = 'button-group',  // 預設使用按鈕組模式
    size = 'small',           // 預設使用小尺寸
    showLabel = true          // 預設顯示標籤
}) => {
    // 從國際化上下文中獲取翻譯函數、當前語言、設定語言函數和載入狀態
    const { t, currentLanguage, setLanguage, isLoading } = useTranslation();

    // 支援的語言列表
    // 從統一配置文件中提取所有語言代碼，用於遍歷渲染
    const languages: Language[] = LANGUAGE_CONFIGS.map(config => config.code as Language);

    /**
     * 根據語言代碼獲取國旗圖片路徑
     * @param languageCode 語言代碼
     * @returns 國旗圖片的 URL 路徑
     */
    const getFlagByLanguage = (languageCode: Language): React.ReactNode => {
        // 從統一配置中獲取對應的語言配置
        const config = getLanguageConfig(languageCode);
        if (!config) return null;
        const Flag = getFlagComponentByName(config.flagName);
        return Flag ? <Flag width={16} height={16} /> : null;
    };

    /**
     * 根據語言代碼獲取翻譯文本
     * @param languageCode 語言代碼
     * @returns 該語言的顯示名稱（已翻譯）
     */
    const getLanguageText = (languageCode: Language): string => {
        // 使用翻譯函數獲取語言的本地化名稱
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return t(`app.language.${languageCode}` as any);
    };

    /**
     * 處理語言切換事件
     * 異步函數，支援錯誤處理
     * @param language 要切換到的語言
     */
    const handleLanguageChange = async (language: Language) => {
        try {
            // 調用上下文中的設定語言函數
            await setLanguage(language);
        } catch (error) {
            // 如果切換失敗，在控制台輸出錯誤信息
            console.error('切换语言失败？请告知我们:', error);
        }
    };

    /**
     * 共用的按鈕渲染函數
     * 生成所有語言的按鈕元素，用於按鈕和按鈕組模式
     * @returns 語言按鈕陣列
     */
    const renderLanguageButtons = () => {
        return languages.map((lang) => (
            <Button
                key={lang}                                    // 使用語言代碼作為 key
                size={size === 'small' ? 'sm' : 'default'}    // 按鈕大小
                variant={currentLanguage === lang ? 'default' : 'outline'} // 當前語言為實心，其他為輪廓
                onClick={() => handleLanguageChange(lang)}    // 點擊事件處理
                disabled={isLoading}                          // 載入時禁用按鈕
            >
                {getFlagByLanguage(lang)}
                <span>{getLanguageText(lang)}</span>
            </Button>
        ));
    };

    // 載入狀態的渲染
    // 當語言切換正在進行時顯示載入提示
    if (isLoading) {
        return (
            <div className="flex items-center gap-1">
                {/* 條件渲染標籤 */}
                {showLabel && <span>{t('app.language.title')}</span>}
                {/* 禁用的載入按鈕 */}
                <Button disabled size={size === 'small' ? 'sm' : 'default'}>
                    載入中...
                </Button>
            </div>
        );
    }

    // 下拉選單模式的渲染
    if (variant === 'select') {
        return (
            <div className="flex items-center gap-1">
                {/* 條件渲染標籤 */}
                {showLabel && <span>{t('app.language.title')}</span>}
                <Select
                    value={currentLanguage}
                    onValueChange={(value) => handleLanguageChange(value as Language)}
                >
                    <SelectTrigger
                        size={size === 'small' ? 'sm' : 'default'}
                        className="min-w-[120px] border-[#3A332C]/20 bg-transparent text-[#3A332C]"
                    >
                        <SelectValue>
                            {(value: Language) => (
                                <span className="flex items-center gap-2">
                                    {getFlagByLanguage(value)}
                                    <span>{getLanguageText(value)}</span>
                                </span>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#F5F4EF] text-[#3A332C]">
                        {LANGUAGE_CONFIGS.map((config) => (
                            <SelectItem key={config.code} value={config.code}>
                                <span className="flex items-center gap-2">
                                    {getFlagByLanguage(config.code as Language)}
                                    <span>{getLanguageText(config.code as Language)}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    // 單獨按鈕模式的渲染
    if (variant === 'button') {
        return (
            <div className="flex items-center gap-1">
                {/* 條件渲染標籤 */}
                {showLabel && <span>{t('app.language.title')}</span>}
                {/* 渲染所有語言按鈕 */}
                {renderLanguageButtons()}
            </div>
        );
    }

    // 預設為 button-group 變體
    // 按鈕組模式：將所有按鈕組合在一起，形成統一的按鈕組
    return (
        <div className="flex items-center gap-1">
            {/* 條件渲染標籤 */}
            {showLabel && <span>{t('app.language.title')}</span>}
            <div className={cn("flex flex-wrap gap-1")}>
                {renderLanguageButtons()}
            </div>
        </div>
    );
};

// 導出語言切換器組件
export default LanguageSwitcher;
