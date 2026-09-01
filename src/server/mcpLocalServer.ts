import { createServer } from 'http';
import { getNotes, saveNote } from '../database/repositories.js';
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

                    // 1. 搜索/获取笔记能力
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
                    // 2. 添加笔记能力（content 为 markdown 原文，直接写 md 文件）
                    else if (data.action === 'add_draft') {
                        const uuid = crypto.randomUUID();
                        const content = typeof data.content === 'string' ? data.content : '';
                        const result = saveNote({
                            uuid: uuid,
                            content: content,
                            title: data.title || '来自 AI 的笔记'
                        });
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, uuid, path: result && 'path' in result ? result.path : undefined }));
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
