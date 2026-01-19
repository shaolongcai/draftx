import { Box } from "@mui/material"
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CodeHighlightPlugin } from '@/plugin/CodeHighlightPlugin';
import { CodeActionPlugin } from '@/plugin/CodeActionPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from "@/plugin/MarkdownShortcutPlugin";
import { MarkdownPastePlugin } from "@/plugin/MarkdownPastePlugin";
import { TableKeyboardPlugin } from "@/plugin/TableKeyboardPlugin";
import { MermaidPlugin } from "@/plugin/MermaidPlugin";
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { $createParagraphNode, $getRoot } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useKeyPress, useUpdateEffect } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import TabFocusPlugin from '@/plugin/TabFocusPlugin';
import { theme } from "@/theme/editorTheme";
import PickerPlugin from "@/plugin/PickerPlugin";
import { MathNode } from "@/nodes/MathNode";
import { MathPlugin } from "@/plugin/MathPlugin";
import { AutoPastePlugin } from "@/plugin/AutoPastePlugin";
import { BlockTipPlugin } from "@/plugin/BlockTipPlugin";
import AiPickerPlugin from "@/plugin/AIPickerPlugin";
import { LoadingNode } from "@/nodes/LoadingNode";
import { ConfigParams } from "@/type/electron";
// import { useSettings } from '@/contexts/SettingContext';


function Placeholder() {
    return <Box sx={{
        color: '#ccc',
        // overflow: 'hidden',
        position: 'absolute',
        top: '26px',
        fontSize: '16px',
        userSelect: 'none',
        display: 'inline-block',
        pointerEvents: 'none',
    }}>Press / bring up the menu <br /> Press ` bring up the AI tool....</Box>;
}


/**
 * 内容编辑器
 */
const EditorContext: React.FC = () => {

    const [currentUuid, setCurrentUuid] = useState<string>('');
    const lastSavedRef = useRef<{ title?: string; contentJson: string; contentText: string }>({ contentJson: '', contentText: '' }); // 上次已保存

    const [editor] = useLexicalComposerContext()
    const { loadStickys$, handleOnclickTool$ } = useEvent();
    const notification = useNotifications();
    const isMac = window.electronUtils?.platform === 'darwin' || /macintosh|mac os x/i.test(navigator.userAgent);

    // 初始化
    useEffect(() => {
        setCurrentUuid(uuidv4());
        getGuideMemo();
    }, []);

    // 监听点击新建草稿
    handleOnclickTool$.useSubscription((tool) => {
        if (tool === 'addDraft') {
            addNewDraft();
        }
    })

    // 监听加载新的便利贴
    loadStickys$.useSubscription((sticky) => {
        console.log('加载新的便利贴', sticky);
        // 刷新删除天数
        window.electronAPI.refreshDeleteDay(sticky.id);
        // 清空编辑器内容
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            // 插入新的便利贴内容
            try {
                // 创建root
                const root = $getRoot();
                root.append($createParagraphNode());
                const initialEditorState = editor.parseEditorState(sticky.content_json);
                editor.setEditorState(initialEditorState);
                setCurrentUuid(sticky.uuid);
            } catch (error) {
                root.append($createParagraphNode()); // 解析失败时兜底：新增空段落
                console.log('解析失败，插入空段落', error);
            }
        });
    })

    // 决定展示guide的meomo，还是初始化uuid;由于setData 异步，所以这里需要直接传入实例
    const getGuideMemo = async () => {
        // 是否完成引导
        const isFinishGuide = await window.electronAPI.getConfig('isFinishGuide')
        console.log('isFinishGuide', isFinishGuide)
        if (!isFinishGuide) {
            //展示引导memo
            const guideMemo = await window.electronAPI.getGuideMemo()
            editor.update(() => {
                const root = $getRoot();
                root.clear();
                // 创建root
                root.append($createParagraphNode());
                const initialEditorState = editor.parseEditorState(guideMemo.content_json);
                editor.setEditorState(initialEditorState);
            })

            setCurrentUuid(guideMemo.uuid)
            // 设置为已引导
            const configParams: ConfigParams = {
                key: 'isFinishGuide',
                value: true,
                type: 'boolean'
            }
            window.electronAPI.setConfig(configParams)
        }
    }

    // 新建草稿
    const addNewDraft = () => {
        // 保存现在的内容
        scheduleSave(lastSavedRef.current);
        setCurrentUuid(uuidv4());
        // 清空编辑器内容
        editor.update(() => {
            const root = $getRoot();
            root.clear();
        });

        notification.show('The previous draft has been saved', {
            severity: 'success',
        });
    }

    // 防抖保存
    const AUTOSAVE_WAIT_MS = 200;
    const { run: scheduleSave } = useDebounceFn(
        async (payload: { title?: string; contentJson: string; contentText: string }) => {
            // 内容为空则跳过
            // if (!payload.contentText) return;
            // 若无变更则跳过
            if (payload.contentJson === lastSavedRef.current.contentJson) return
            try {
                window.electronAPI.saveSticky({
                    uuid: currentUuid,
                    title: payload.title,
                    content: payload.contentText,
                    contentJson: payload.contentJson, // 这里已经是字符串化
                });
                lastSavedRef.current = payload;
                // 如需提示可开启：message.success('已自动保存');
            } catch (error) {
                const msg = error instanceof Error ? error.message : '保存失败';
                console.error(msg);
            }
        },
        { wait: AUTOSAVE_WAIT_MS }
    );

    // 注册Shitf+A 新建便利贴
    useKeyPress(isMac ? 'meta.n' : 'alt.n', () => {
        addNewDraft();
    })


    return <div className="scrollbar-thin!  rounded-xl h-full font-mono  leading-relaxed text-gray-700 ">
        <RichTextPlugin
            contentEditable={
                <ContentEditable style={{
                    width: '100%',
                    maxHeight: 'calc(100vh - 64px)',
                    minHeight: '240px',
                    overflow: 'auto',
                    outline: 'none',
                    boxSizing: 'border-box',
                    scrollbarColor: 'rgba(0, 0, 0, 0.5) transparent',
                    scrollbarWidth: 'none',
                    paddingBottom: '40px', // 增加底部內邊距，方便點擊跳出代碼塊
                    // scrollbarColor: '#888 #f1f1f1',
                }} />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={Placeholder}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />

        <TabIndentationPlugin />
        <ListPlugin hasStrictIndent={false} />
        <TablePlugin />
        <TableKeyboardPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <MarkdownPastePlugin />
        <CodeHighlightPlugin />
        <CodeActionPlugin />
        <MermaidPlugin />
        <PickerPlugin />
        {/* <AiPickerPlugin /> */}
        <TabFocusPlugin />
        <CheckListPlugin />
        <MathPlugin />
        <AutoPastePlugin />
        <BlockTipPlugin />
        <OnChangePlugin onChange={(editorState) => {
            // 获取纯文本内容
            const plain = editorState.read(() => $getRoot().getTextContent());
            const json = editorState.toJSON();
            scheduleSave({ contentJson: JSON.stringify(json), contentText: plain });
        }} />
    </div>
}


export default EditorContext;

