/**
 * 发送消息到前端的channel类型
 */
type ChannelType = 'download-progress';



/**
 * 保存笔记参数（内容即 markdown 原文，写入 .md 文件）
 */
type NoteParmas = {
    uuid: string;
    title?: string;
    /** markdown 原文；空字符串表示删除该笔记 */
    content: string;
    /** 已有笔记的文件路径（可选，通常由后端根据 uuid 解析） */
    path?: string;
}

/** @deprecated 旧版 Lexical 存储参数，保留仅为兼容残留引用 */
type StickyParmas = {
    uuid: string;
    title?: string;
    content: string;
}



/**
 * 设置配置时填写的参数
 */
type ConfigParams = {
    key: string, // 配置项的key
    value: any, // 配置项的值
    type?: 'boolean' | 'string' | 'number', // 配置值的类型，默认是string
}
/**
 * 配置种类,每多一个，这里手工添加
 * @param isFinishGuide  是否已经完成引导配置，完成则不再需要配置
 */
type ConfigType = 'isFinishGuide' | 'launchShortcut';