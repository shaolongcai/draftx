

// 笔记（元数据 + 可选正文）
// 列表/搜索时仅含元数据；getDraftByUuid 返回时附带 md 正文 content
type DraftResult = {
    id: number;
    uuid: string;
    /** 相对 notes 目录的文件路径，如 "guide.md" */
    path: string;
    title: string;
    /** 文件修改时间（毫秒时间戳） */
    mtime: number;
    created_at: string;
    /** markdown 正文（仅 getDraftByUuid 返回） */
    content?: string;
    /** 搜索相关性得分 */
    score?: number;
    /** 搜索命中摘要（含 <mark> 高亮） */
    snippet?: string;
}
