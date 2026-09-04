import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/I18nContext';
import type { Language } from '@/config/languages';

type LangOption = {
    code: Language;
    label: string;
};

const LANG_OPTIONS: LangOption[] = [
    { code: 'en-US', label: 'English' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
];

// 页面文案（选中语言后实时切换）
const PAGE_TEXT: Record<string, { title: string; choose: string }> = {
    'en-US': { title: 'Choose your language', choose: 'Choose' },
    'zh-CN': { title: '选择你的语言', choose: '选择' },
    'zh-TW': { title: '選擇你的語言', choose: '選擇' },
};

const SERIF_FONT = 'Georgia, "Songti SC", "SimSun", "Times New Roman", serif';

// 配色
const COLOR_TITLE = '#3A332C';
const COLOR_OPTION = '#867A6C';
const COLOR_SELECTED_BG = '#EBE1D3';
const COLOR_BUTTON = '#867A6C';

// 语言选择页：仅当数据库 isFinishGuide 为 false 时出现；确认后写入标记并进入开屏动画页
const SelectLanguage: React.FC = () => {
    const navigate = useNavigate();
    const { setLanguage } = useTranslation();

    // 默认不选中任何语言
    const [selected, setSelected] = useState<Language | null>(null);
    // 防止重复点击确认
    const [saving, setSaving] = useState(false);

    const text = PAGE_TEXT[selected ?? 'en-US'] ?? PAGE_TEXT['en-US'];


    // 点击语言：立即应用（写入 localStorage + 数据库并广播），页面文案实时切换
    const handleSelect = (code: Language) => {
        setSelected(code);
        setLanguage(code);
    };

    // 确认语言选择：生成对应语言的引导笔记，然后进入 hotkey 设置页
    const handleChoose = async () => {
        if (!selected || saving) return;
        setSaving(true);
        // await window.electronAPI.setConfig({
        //     key: 'isFinishGuide',
        //     value: true,
        //     type: 'boolean',
        // });
        // navigate('/onboarding', { replace: true });

        // 选择完语言后生成对应语言的引导笔记（幂等，已存在则不重复创建；失败不阻塞流程）
        try {
            await window.electronAPI.initializeGuideNote(selected);
        } catch (error) {
            console.error('初始化引导笔记失败:', error);
        }

        // 跳转到设置hotkey页面（路由表注册的路径是 /hotkeys）
        navigate('/hotkeys', { replace: true });
    };


    return (
        <div
            className="w-screen h-screen flex flex-col px-12 pt-10 pb-12 select-none"
            style={{ fontFamily: SERIF_FONT, backgroundColor: '#f6f4ee' }}
        >
            {/* 标题 */}
            <h1
                className="text-[40px] font-bold leading-tight"
                style={{ color: COLOR_TITLE }}
            >
                {text.title}
            </h1>

            {/* 语言选项 */}
            <div className="flex items-center justify-between w-full mt-12">
                {LANG_OPTIONS.map((opt) => {
                    const isActive = selected === opt.code;
                    return (
                        <button
                            key={opt.code}
                            onClick={() => handleSelect(opt.code)}
                            className="text-[48px] leading-none rounded-lg px-4 py-2.5 transition-colors duration-150 cursor-pointer"
                            style={{
                                fontFamily: SERIF_FONT,
                                color: isActive ? COLOR_TITLE : COLOR_OPTION,
                                backgroundColor: isActive ? COLOR_SELECTED_BG : 'transparent',
                            }}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* 底部确认按钮（未选择时背景 25% 透明度） */}
            <div className="mt-auto flex justify-center">
                <button
                    onClick={handleChoose}
                    disabled={!selected}
                    className="w-75 h-12 rounded-full text-[18px] text-white transition-colors duration-200"
                    style={{
                        fontFamily: SERIF_FONT,
                        backgroundColor: COLOR_BUTTON,
                        opacity: selected ? 1 : 0.25,
                        cursor: selected ? 'pointer' : 'not-allowed',
                    }}
                >
                    {text.choose}
                </button>
            </div>
        </div>
    );
};

export default SelectLanguage;
