import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import welcomeLogo from '@/assets/welcome-logo.lottie?url';

const SERIF_FONT = 'Georgia, "Songti SC", "SimSun", "Times New Roman", serif';

// 动画播放速度（1 为原速，调大加快、调小减慢）
const ANIMATION_SPEED = 2;
// 动画播放完成后停留时长（毫秒），再进入首页
const ANIMATION_LINGER = 1000;
// 动画播放失败时的兜底进入首页时长（毫秒）
const ANIMATION_FALLBACK_DURATION = 8000;

// 开屏动画页：每次启动应用都会进入；未完成引导（isFinishGuide=false）时先跳语言选择页
const Onboarding: React.FC = () => {
    const navigate = useNavigate();


    // 开屏动画：不论语言统一使用 welcome-logo.lottie（原生画布 176:48）
    // 播放一次完成后停留 1 秒再进入首页
    return (
        <div
            className="w-screen h-screen flex flex-col px-12 pt-10 pb-12 select-none"
            style={{ fontFamily: SERIF_FONT, backgroundColor: '#f6f4ee' }}
        >
            <div className="flex-1 flex items-center justify-center">
                <DotLottieReact
                    src={welcomeLogo}
                    autoplay
                    loop={false}
                    speed={ANIMATION_SPEED}
                    dotLottieRefCallback={(dotLottie) => {
                        if (!dotLottie) return;
                        // dotLottie.addEventListener('load', () => {
                        //     // 程序化关闭循环（防止文件内默认循环导致 complete 不触发）
                        //     dotLottie.setLoop(false);
                        //     // 按动画实际时长调度进入首页（时长 / 速度 + 停留 1 秒），complete 事件作为补充
                        //     window.setTimeout(finish, (dotLottie.duration * 1000) / ANIMATION_SPEED + ANIMATION_LINGER);
                        // });
                        dotLottie.addEventListener('complete', () => {
                            console.log('动画complete');
                            window.setTimeout(() => {
                                // 写入会话标记，放行首页门控（避免 '/' 再被重定向回引导页）
                                sessionStorage.setItem('onboarding_shown', '1');
                                navigate('/', { replace: true });
                            }, ANIMATION_LINGER);
                        });
                    }}
                    style={{ width: 352, height: 96 }}
                />
            </div>
        </div>
    );
};

export default Onboarding;
