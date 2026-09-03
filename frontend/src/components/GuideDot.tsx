import { useRequest } from "ahooks";
import { useEvent } from "@/contexts/EvenContext";

/**
 * 新手引导小红点：笔记数量 ≤ 3 篇时在左下角常驻（8px），超过 3 篇后消失。
 * 仅作视觉提示，不响应点击（pointer-events: none，避免遮挡底部 ToolBar 的 hover 区）。
 * 底部 ToolBar 悬停浮现时红点先行隐藏（纯 CSS :has 实现，Chromium 105+ 支持），ToolBar 隐藏后红点再现。
 */
const GuideDot: React.FC = () => {
    const { notesChanged$ } = useEvent();

    // 只需判断「是否超过 3 篇」，取 4 条即可区分
    const { data, refresh } = useRequest(() => window.electronAPI.getDraft('', 4));

    // 笔记新增（首存）/ 清空删除后重新计数
    notesChanged$.useSubscription(() => refresh());

    const count = data?.length ?? 0;
    if (count > 3) return null;

    return (
        <>
            <style>{`
                /* 底部 ToolBar 出现时（hover .draftx-toolbar-root）隐藏红点 */
                body:has(.draftx-toolbar-root:hover) .draftx-guide-dot {
                    opacity: 0;
                }
            `}</style>
            <div
                className="draftx-guide-dot fixed z-20 pointer-events-none transition-opacity duration-150"
                style={{
                    left: 20,
                    bottom: 20,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#E36F1C',
                }}
            />
        </>
    );
};

export default GuideDot;
