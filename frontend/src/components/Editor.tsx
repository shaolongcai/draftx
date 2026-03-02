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
import { HorizontalRuleNode } from '@/nodes/HorizontalRuleNode';
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
import PickerPlugin from "@/plugin/PickerPlugin";
import { MathPlugin } from "@/plugin/MathPlugin";
import { AutoPastePlugin } from "@/plugin/AutoPastePlugin";
import { BlockTipPlugin } from "@/plugin/BlockTipPlugin";
import { ConfigParams } from "@/type/electron";
import { historyStack } from "@/utils/histroyStack";
import RandomPlugin from "@/plugin/RandomPlugin";
import { CalculatePlugin } from "@/plugin/CalculatePlugin";
import { UnitConversionPlugin } from "@/plugin/UnitConversionPlugin";
import { CurrencyConversionPlugin } from "@/plugin/CurrencyConversionPlugin";
import { StatisticsPlugin } from "@/plugin/StatisticsPlugin";
import { $isHeadingNode } from "@lexical/rich-text";
import { RequestPlugin } from "@/plugin/RequestPlugin";
// import { useSettings } from '@/contexts/SettingContext';


function Placeholder() {
    return <Box sx={{
        color: '#ccc',
        // overflow: 'hidden',
        position: 'absolute',
        top: '24px',
        fontSize: '16px',
        userSelect: 'none',
        display: 'inline-block',
        pointerEvents: 'none',
    }}>Press / for quick input</Box>;
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
    const isMac = window.electronUtils?.platform === 'darwin' || /macintosh|mac os x/i.test(navigator.userAgent); //考虑放到context中

    // 初始化
    useEffect(() => {
        const init = async () => {
            // 获取当前草稿uuid
            const uuid = await window.electronAPI.getConfig('currentUuid');
            if (uuid) {
                // 读取草稿
                const draft = await window.electronAPI.getDraftByUuid(uuid)
                console.log('读取缓存草稿', draft);
                if (draft) {
                    setCurrentUuid(uuid);
                    // 解析草稿内容
                    const initialEditorState = editor.parseEditorState(draft.content_json);
                    editor.setEditorState(initialEditorState);
                    // 记录该草稿到草稿历史
                    historyStack.push(uuid);
                    return
                }
            }
            // 当前没有草稿，则生成新的uuid
            const newUuid = uuidv4();
            setCurrentUuid(newUuid);
            window.electronAPI.setConfig({ key: 'currentUuid', value: newUuid, type: 'string' });
        }
        init()
        getGuideMemo();
        getUpdateDraft();
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
        window.electronAPI.setConfig({ key: 'currentUuid', value: sticky.uuid, type: 'string' });
        // 压栈
        historyStack.push(sticky.uuid);
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
        if (!isFinishGuide) {
            //展示引导memo
            const guideMemo = await window.electronAPI.getDraftByUuid('guide');
            // 压栈
            historyStack.push(guideMemo.uuid);
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
            window.electronAPI.setConfig({ key: 'currentUuid', value: guideMemo.uuid, type: 'string' });
        }
    }


    // 决定展示update的草稿，还是初始化uuid;由于setData 异步，所以这里需要直接传入实例
    const getUpdateDraft = async () => {
        // 通过将更新后的版本号与数据库版本号（之前的版本作对比）
        const currentVesion = await window.electronAPI.getAppVersion();
        console.log('当前版本', currentVesion);
        const oldVersion = await window.electronAPI.getConfig('version') as string;
        // 如果数据库没版本号，则代表新用户
        if (!oldVersion) {
            // 初始化版本号
            window.electronAPI.setConfig({ key: 'version', value: currentVesion, type: 'string' });
            return;
        }
        if (currentVesion !== oldVersion) {
            //展示更新memo
            const updateMemo = await window.electronAPI.getDraftByUuid('update');
            // 压栈
            historyStack.push(updateMemo.uuid);
            editor.update(() => {
                const root = $getRoot();
                root.clear();
                // 创建root
                root.append($createParagraphNode());
                const initialEditorState = editor.parseEditorState(updateMemo.content_json);
                editor.setEditorState(initialEditorState);
            })

            setCurrentUuid(updateMemo.uuid)
            // 设置当前版本号覆盖数据库版本号
            const configParams: ConfigParams = {
                key: 'version',
                value: currentVesion,
                type: 'string'
            }
            window.electronAPI.setConfig(configParams)
            window.electronAPI.setConfig({ key: 'currentUuid', value: updateMemo.uuid, type: 'string' });
        }
    }

    // 新建草稿
    const addNewDraft = () => {
        const uuid = uuidv4();
        // 添加到历史堆栈
        historyStack.push(uuid);
        // 保存现在的内容
        scheduleSave(lastSavedRef.current);
        window.electronAPI.setConfig({ key: 'currentUuid', value: uuid, type: 'string' });
        setCurrentUuid(uuid);
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
                <ContentEditable
                    spellCheck={false}
                    style={{
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
        <CalculatePlugin />
        <UnitConversionPlugin />
        <CurrencyConversionPlugin />
        <StatisticsPlugin />
        <RequestPlugin />
        <RandomPlugin />
        <TabFocusPlugin />
        <CheckListPlugin />
        {/* <MathPlugin /> */}
        <AutoPastePlugin />
        <BlockTipPlugin />
        <OnChangePlugin onChange={(editorState) => {
            // 获取纯文本内容
            const plain = editorState.read(() => $getRoot().getTextContent());
            // 获取标题
            const title = editorState.read(() => {
                const root = $getRoot();
                // 遍历根节点的子节点，寻找第一个 h1
                const children = root.getChildren();
                for (const child of children) {
                    if ($isHeadingNode(child) && child.getTag() === 'h1') {
                        return child.getTextContent();
                    }
                }
            });
            const json = editorState.toJSON();
            scheduleSave({ contentJson: JSON.stringify(json), contentText: plain, title });
        }} />
    </div>
}


export default EditorContext;