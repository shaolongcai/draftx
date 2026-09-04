import { createServer } from 'http';
import { deleteNoteByUuid, getNotes, getNoteByUuid, getNoteByPath, saveNote } from '../database/repositories.js';
import { logger } from '../core/logger.js';
import crypto from 'crypto';

export function startLocalServer() {
    const server = createServer((req, res) => {
        // 设置跨域和响应头
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'POST' && req.url === '/api/mcp') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);

                    // 1. 搜索/获取笔记列表（仅元数据 + 预览，正文用 get_draft 按 uuid/path 读取）
                    if (data.action === 'get_drafts') {
                        // 如果 data.query 为空，getNotes 内部会自动返回全部
                        const notes = getNotes(data.query, data.limit || 50, {
                            createdAfter: data.createdAfter,
                            createdBefore: data.createdBefore,
                            modifiedAfter: data.modifiedAfter,
                            modifiedBefore: data.modifiedBefore
                        });
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, data: notes }));
                    }
                    // 2. 读取单篇笔记完整内容（按 uuid 或 path，返回 md 原文）
                    else if (data.action === 'get_draft') {
                        const note = typeof data.uuid === 'string' && data.uuid
                            ? getNoteByUuid(data.uuid)
                            : typeof data.path === 'string' && data.path
                                ? getNoteByPath(data.path)
                                : null;
                        if (!note) {
                            res.writeHead(404);
                            res.end(JSON.stringify({ success: false, error: '笔记不存在' }));
                            return;
                        }
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, data: note }));
                    }
                    // 3. 新增/更新笔记（content 为 markdown 原文；传 uuid 则覆盖更新对应 .md 文件）
                    else if (data.action === 'add_draft') {
                        const uuid = typeof data.uuid === 'string' && data.uuid ? data.uuid : crypto.randomUUID();
                        const content = typeof data.content === 'string' ? data.content : '';
                        const result = saveNote({
                            uuid: uuid,
                            content: content,
                            title: data.title || '来自 AI 的笔记'
                        });
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, uuid, path: result && 'path' in result ? result.path : undefined }));
                    }
                    // 4. 删除笔记（按 uuid，删除 .md 文件及索引）
                    else if (data.action === 'delete_draft') {
                        if (typeof data.uuid !== 'string' || !data.uuid) {
                            res.writeHead(400);
                            res.end(JSON.stringify({ success: false, error: '缺少 uuid 参数' }));
                            return;
                        }
                        // 先确认笔记存在，再删除
                        if (!getNoteByUuid(data.uuid)) {
                            res.writeHead(404);
                            res.end(JSON.stringify({ success: false, error: '笔记不存在' }));
                            return;
                        }
                        deleteNoteByUuid(data.uuid);
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, uuid: data.uuid }));
                    }
                    else {
                        res.writeHead(400);
                        res.end(JSON.stringify({ success: false, error: '未知操作' }));
                    }
                } catch (error: any) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            });
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'Not Found' }));
        }
    });

    // 监听本地固定端口，不暴露到外网
    server.listen(37212, '127.0.0.1', () => {
        logger.info('MCP Local Bridge Server running on http://127.0.0.1:37212');
    });
}
