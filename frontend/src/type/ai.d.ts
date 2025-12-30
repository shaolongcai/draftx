
/**
 * 保存AI工具时
 */
interface AITool {
    id?: number;
    name: string;
    prompt: string;
    emoji?: string;
}

/**
 * 获取的AI工具的字段
 * 继承AITool的所有属性，id变为必填，并添加时间戳
 */
interface AIToolItem extends Omit<AITool, 'id'> {
    id: number;
    created_at: string;
    updated_at: string;
}