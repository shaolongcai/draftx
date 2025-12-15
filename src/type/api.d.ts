/**
 * 发送消息到前端的channel类型
 */
type ChannelType = 'index-progress' | 'system-info';



/**
 * 保存便利贴参数
 */
type StickyParmas = {
    uuid: string;
    title?: string;
    content: string;
    contentString: string;
}
