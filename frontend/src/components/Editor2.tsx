import { Box, Button, Card, Stack, Tooltip, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useKeyPress } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { HelpOutline } from "@mui/icons-material";
import dayjs, { ConfigType } from "dayjs";
// import Vditor from "vditor";
// import "vditor/dist/index.css";
import { ConfigParams } from "@/type/electron";
import { EventEmitter } from "ahooks/lib/useEventEmitter";
import { ModuleParser, ModuleBlock } from "@/utils/moduleParser";

interface EditorContextProps {
    getDeleteDay: (date: string) => void;
}
/**
 * 内容编辑器
 */
const EditorContext = ({
    getDeleteDay,
}) => {

    // const [vd, setVd] = useState<Vditor>();
    // const lastSavedRef = useRef<{ title?: string; contentText: string }>({ title: '', contentText: '' }); // 上次已保存
    // const currentUuidRef = useRef<string>('')

    // const { loadStickys$, refreshContent$ } = useEvent();
    // const notification = useNotifications();

    // // 初始化编辑器
    // useEffect(() => {
    //     const vditor = new Vditor('vditor', {
    //         toolbar: [],
    //         toolbarConfig: {
    //             hide: true,
    //         },
    //         mode: 'ir',
    //         // minHeight: 320,
    //         // typewriterMode: true,
    //         placeholder: 'Markdown input supported...',
    //         input: (value: string) => {
    //             // 使用模块解析器检测模块
    //             const parseResult = ModuleParser.parse(value);

    //             // 检查是否正在编写模块
    //             const writingStatus = ModuleParser.isWritingModule(value);
    //             console.log('writingStatus', writingStatus)
    //             if (parseResult.hasModules) {
    //                 // 结束时，才会检查到模块
    //                 console.log('检测到的模块:', parseResult.modules);
    //                 // 处理每个模块
    //                 parseResult.modules.forEach(module => {
    //                     const validation = ModuleParser.validateModule(module);
    //                     if (validation.valid) {
    //                         console.log(`✓ ${module.type} 模块有效:`, module.content);
    //                     } else {
    //                         console.warn(`✗ ${module.type} 模块无效:`, validation.error);
    //                     }
    //                 });
    //             }

    //             if (writingStatus.isWriting) {
    //                 console.log(`正在编写 ${writingStatus.moduleType} 模块...`);
    //             }

    //             // const htmlS = vditor.html2md(`<span style="color: red;">${value}</span>`)
    //             // vditor.insertValue(htmlS)
    //             // 触发保存
    //             save(value, '');
    //             // 触发刷新内容事件
    //             refreshContent$.emit(value)
    //         },
    //         preview: {
    //             theme: {
    //                 current: 'editorTheme', // 文件名称
    //                 path: './content-theme/',
    //             },
    //             markdown: {
    //                 mark: true,
    //                 sanitize: false,
    //                 autoSpace: false,
    //             },
    //         },
    //         after: () => {
    //             // vditor.setValue("`Vditor` 最小代码示例");
    //             setVd(vditor);
    //             getGuideMemo(vditor)

    //         },
    //     });
    //     // Clear the effect
    //     return () => {
    //         vd?.destroy();
    //         setVd(undefined);
    //     };
    // }, []);


    // // 决定展示guide的meomo，还是初始化uuid;由于setData 异步，所以这里需要直接传入实例
    // const getGuideMemo = async (vd: Vditor) => {
    //     // 是否完成引导
    //     const isFinishGuide = await window.electronAPI.getConfig('isFinishGuide')
    //     console.log('isFinishGuide', isFinishGuide)
    //     if (!isFinishGuide) {
    //         //展示引导memo
    //         const guideMemo = await window.electronAPI.getGuideMemo()
    //         getDeleteDay(guideMemo.deleted_at)
    //         // 清空编辑器内容
    //         vd?.setValue('');
    //         // 创建root
    //         vd.insertMD(guideMemo.content);
    //         currentUuidRef.current = guideMemo.uuid
    //         // 设置为已引导
    //         const configParams: ConfigParams = {
    //             key: 'isFinishGuide',
    //             value: true,
    //             type: 'boolean'
    //         }
    //         window.electronAPI.setConfig(configParams)
    //     }
    //     else {
    //         // 清空编辑器，初始化uuid
    //         // vd?.setValue('');
    //         vd?.insertValue(`<span style="color: red; font-size: 20px;">红色大字</span>`);
    //         currentUuidRef.current = uuidv4()
    //     }
    // }

    // // 监听加载新的便利贴
    // loadStickys$.useSubscription((sticky) => {
    //     // 新增天数
    //     getDeleteDay(sticky.deleted_at)

    //     // 插入新的便利贴内容
    //     try {
    //         // 清空编辑器内容
    //         vd?.setValue('');
    //         // 创建root
    //         vd.insertMD(sticky.content);
    //         // setCurrentUuid(sticky.uuid);
    //         console.log('当前的uuid', sticky.uuid)
    //         currentUuidRef.current = sticky.uuid
    //     } catch (error) {
    //         console.log('解析失败，插入空段落', error);
    //     }
    // })

    // const save = async (contentText: string, title?: string) => {
    //     // 内容为空则跳过
    //     if (!contentText) return;
    //     // 若无变更则跳过
    //     if (contentText === lastSavedRef.current.contentText) return
    //     try {
    //         window.electronAPI.saveSticky({
    //             uuid: currentUuidRef.current,
    //             title: title,
    //             content: contentText,
    //             contentJson: JSON.stringify({
    //                 title: title,
    //                 content: contentText,
    //             }),
    //         });
    //         console.log('已自动保存', { title, contentText });
    //         // 如需提示可开启：message.success('已自动保存');
    //     } catch (error) {
    //         const msg = error instanceof Error ? error.message : '保存失败';
    //         console.error(msg);
    //     }
    // }

    // // 注册Shitf+A 新建便利贴
    // useKeyPress('shift.enter', () => {
    //     save(lastSavedRef.current.contentText, lastSavedRef.current.title);
    //     const newUuid = uuidv4();
    //     // setCurrentUuid(newUuid);
    //     currentUuidRef.current = newUuid
    //     // 清空编辑器内容
    //     vd?.setValue('');
    //     vd.blur(); // 要失焦，否则会多一个空格
    //     notification.show('The sticky has been saved', {
    //         severity: 'success',
    //     });
    //     getDeleteDay(null); //重置删除天数
    // })

    // return <div id="vditor" className="vditor" />

}



interface EditorProps {
    handleAITools: () => void;
    showAITools: boolean;
}
const Editor2: React.FC<EditorProps> = ({
    handleAITools,
    showAITools,
}) => {

    const [deletedAt, setDeletedAt] = useState<number>();

    return <Card className="relative min-h-96 flex flex-col" >
        {/* AI工具入口 */}
        <Button variant='contained'
            size='medium'
            className="absolute right-4 z-10 text-white opacity-25 hover:opacity-100"
            onClick={handleAITools}
        >
            {showAITools ? 'Close' : 'AI Tools'}
        </Button>
        {/* <EditorContext
            getDeleteDay={(deletedAt) => {
                // 换成与今天的差距
                const diff = dayjs(deletedAt).diff(dayjs(), 'day');
                setDeletedAt(diff);
            }}
        /> */}
        {/* 模块提示 */}
        <Typography variant="bodyMedium" color="textSecondary" sx={{ color: 'rgba(0, 0, 0, 0.25)' }}>
            The math keyword also enablesconversions.
        </Typography>
        <Box flex={1}></Box>
        <Stack direction='row' justifyContent='space-between' alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center" >
                <Typography variant="bodySmall" color="textSecondary">
                    {/* 删除的天数，+3天是因为点击后会加3天删除时间，修改增加的删除时间时，需要同步更改这里 */}
                    Deleted in {deletedAt ? deletedAt + 3 : 7} days
                </Typography>
                <Tooltip title="Each view adds 3 days to deletion">
                    <HelpOutline fontSize="small" className="cursor-pointer" color='action' />
                </Tooltip>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" >
                <span className="border border-text-secondary border-gray-300  rounded px-2 py-1 text-xs leading-none">
                    ⇧
                </span>
                <Typography variant="bodySmall" color="textSecondary">+</Typography>
                <span className="border border-gray-300 rounded px-2 py-1 text-xs leading-none">
                    ↵
                </span>
                <Typography variant="bodySmall" color="textSecondary" className="pl-1">
                    New memo
                </Typography>
            </Stack>
        </Stack>
    </Card>
}

export default Editor2
