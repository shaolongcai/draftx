import { Card, Stack, Tooltip, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useKeyPress } from "ahooks";
import { v4 as uuidv4 } from 'uuid';
import { useNotifications } from "@toolpad/core/useNotifications";
import { useEvent } from "@/contexts/EvenContext";
import { HelpOutline } from "@mui/icons-material";
import dayjs from "dayjs";
import Vditor from "vditor";
import "vditor/dist/index.css";


interface EditorContextProps {
    getDeleteDay: (date: string) => void;
}
/**
 * 内容编辑器
 */
const EditorContext: React.FC<EditorContextProps> = ({
    getDeleteDay,
}) => {

    const [vd, setVd] = useState<Vditor>();
    const lastSavedRef = useRef<{ title?: string; contentText: string }>({ title: '', contentText: '' }); // 上次已保存
    const currentUuidRef = useRef<string>('')

    const { loadStickys$ } = useEvent();
    const notification = useNotifications();

    // 初始化编辑器
    useEffect(() => {
        const vditor = new Vditor('vditor', {
            toolbar:[],
            toolbarConfig: {
                hide: true,
                pin:true
            },
            minHeight: 320,
            // typewriterMode: true,
            placeholder: 'Markdown input supported...',
            input: (value: string) => {

                // 提取标题：从第一个 # 到下一个换行
                const titleMatch = value.match(/^#\s*(.*?)\s*$/m);
                const title = titleMatch ? titleMatch[1].trim() : undefined;
                // 触发保存
                save(value, title);
            },
            preview: {
                theme: {
                    current: 'editorTheme', // 文件名称
                    path: './content-theme/',
                }
            },
            after: () => {
                // vditor.setValue("`Vditor` 最小代码示例");
                setVd(vditor);
            },
        });
        // Clear the effect
        return () => {
            vd?.destroy();
            setVd(undefined);
        };
    }, []);



    // 初始化uuid
    useEffect(() => {
        // setCurrentUuid(uuidv4());
        console.log('初始化了新的uuid')
        currentUuidRef.current = uuidv4()
    }, []);

    // 监听加载新的便利贴
    loadStickys$.useSubscription((sticky) => {
        // 新增天数
        window.electronAPI.addDeleteDay(sticky.id);
        getDeleteDay(sticky.deleted_at)

        // 插入新的便利贴内容
        try {
            console.log('sticky.content', sticky);
            // 清空编辑器内容
            vd?.setValue('');
            // 创建root
            vd.insertMD(sticky.content);
            // setCurrentUuid(sticky.uuid);
             console.log('当前的uuid',sticky.uuid)
            currentUuidRef.current = sticky.uuid
        } catch (error) {
            console.log('解析失败，插入空段落', error);
        }
    })

    const save = async (contentText: string, title?: string) => {
        // 内容为空则跳过
        if (!contentText) return;
        console.log('save')
        // 若无变更则跳过
        if (contentText === lastSavedRef.current.contentText) return
        try {
            window.electronAPI.saveSticky({
                uuid: currentUuidRef.current,
                title: title,
                content: contentText,
            });
            console.log('已自动保存', { title, contentText });
            // 如需提示可开启：message.success('已自动保存');
        } catch (error) {
            const msg = error instanceof Error ? error.message : '保存失败';
            console.error(msg);
        }
    }

    // 注册Shitf+A 新建便利贴
    useKeyPress('shift.enter', () => {
        save(lastSavedRef.current.contentText, lastSavedRef.current.title);
        const newUuid = uuidv4();
        // setCurrentUuid(newUuid);
        currentUuidRef.current = newUuid
        // 清空编辑器内容
        vd?.setValue(''); 
        vd.blur(); // 要失焦，否则会多一个空格
        notification.show('The sticky has been saved', {
            severity: 'success',
        });
    })

    return <div id="vditor" className="vditor" />

}



const Editor2 = () => {

    const [deletedAt, setDeletedAt] = useState<number>();

    return <Card className="relative" >
        <EditorContext getDeleteDay={(deletedAt) => {
            // 换成与今天的差距
            const diff = dayjs(deletedAt).diff(dayjs(), 'day');
            setDeletedAt(diff);
        }} />
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