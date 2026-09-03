import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTranslation } from '@/contexts/I18nContext';
import { Language } from '@/config/languages';
import welcomeEn from '@/assets/welcome.lottie?url';
import welcomeZh from '@/assets/welcome-chinese.lottie?url';

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

// 动画播放速度（1 为原速，调大加快、调小减慢）
const ANIMATION_SPEED = 2;
// 动画播放失败时的兜底进入首页时长（毫秒）
const ANIMATION_FALLBACK_DURATION = 8000;

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { setLanguage, currentLanguage } = useTranslation();

    // step 为 null 时表示正在读取 isFinishGuide（此时先展示动画占位，兼作加载画面）
    const [step, setStep] = useState<1 | 2 | null>(null);
    // 默认不选中任何语言
    const [selected, setSelected] = useState<Language | null>(null);
    // 是否为首次引导（未完成过引导时才需要在结束时写入 isFinishGuide）
    const firstRunRef = useRef(false);

    const text = PAGE_TEXT[selected ?? 'en-US'] ?? PAGE_TEXT['en-US'];

    // 启动时读取引导标记：未完成引导 -> 先选语言；已完成 -> 直接进动画步骤
    useEffect(() => {
        window.electronAPI.getConfig('isFinishGuide').then((done) => {
            firstRunRef.current = !done;
            setStep(done ? 2 : 1);
        });
    }, []);

    // 结束引导：首次需写入 isFinishGuide，并记录本次会话已展示过开屏
    const finish = async () => {
        if (firstRunRef.current) {
            await window.electronAPI.setConfig({
                key: 'isFinishGuide',
                value: true,
                type: 'boolean',
            });
            firstRunRef.current = false;
        }
        sessionStorage.setItem('onboarding_shown', '1');
        navigate('/');
    };

    // 第二步：动画播放完成后自动进入首页；兜底定时器防止动画加载失败卡死
    // （加载多语言 / MCP 脚本同步在动画播放期间进行）
    useEffect(() => {
        if (step !== 2) return;
        const timer = window.setTimeout(finish, ANIMATION_FALLBACK_DURATION);
        return () => window.clearTimeout(timer);
    }, [step]);

    // 点击语言：立即应用（写入 localStorage + 数据库并广播），页面文案实时切换
    const handleSelect = (code: Language) => {
        setSelected(code);
        setLanguage(code);
    };

    // 第一步：确认语言选择
    const handleChoose = () => {
        if (!selected) return;
        setStep(2);
    };

    // 开屏动画：英文用 welcome.lottie，非英文用 welcome-chinese.lottie
    const animationSrc = currentLanguage === 'en-US' ? welcomeEn : welcomeZh;

    // 动画（第二步，及读取配置期间的加载画面）：播放一次完成后进入首页
    const animationPlaceholder = (
        <div className="flex-1 flex items-center justify-center">
            <DotLottieReact
                src={animationSrc}
                autoplay
                speed={ANIMATION_SPEED}
                dotLottieRefCallback={(dotLottie) => {
                    dotLottie?.addEventListener('complete', finish);
                }}
                style={{ width: '100%', height: '70%' }}
            />
        </div>
    );

    return (
        <div
            className="w-screen h-screen flex flex-col px-12 pt-10 pb-12 select-none"
            style={{ fontFamily: SERIF_FONT, backgroundColor: '#f6f4ee' }}
        >
            {step === 1 ? (
                <>
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
                            className="w-[300px] h-[48px] rounded-full text-[18px] text-white transition-colors duration-200"
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
                </>
            ) : (
                // 第二步（或读取配置中）：动画占位，结束后自动进入首页
                animationPlaceholder
            )}
        </div>
    );
};

export default Onboarding;
