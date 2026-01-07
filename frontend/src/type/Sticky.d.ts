

// 搜索结果
type DraftResult = {
    id: number;
    uuid: string;
    title: string;
    content: string;
    content_json: string;
    created_at: string;
    modified_at: string;
    score: number; //相关性
    snippet?: string;
    deleted_at: string;
}