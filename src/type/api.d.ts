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
    content_json: string;
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
type ConfigType = 'isFinishGuide'