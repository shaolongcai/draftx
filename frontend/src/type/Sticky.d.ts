

// 搜索结果
type StickyResult = {
    id: number;
    uuid: string;
    title: string;
    content: string;
    content_string: string;
    created_at: string;
    modified_at: string;
    score: number; //相关性
    snippet?: string;
}