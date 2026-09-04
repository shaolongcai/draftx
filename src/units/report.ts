import { logger } from "../core/logger.js";
import { getConfig } from "../database/sqlite.js";
import * as os from 'os';

// 构建Markdown内容
const buildMarkdownContent = (data: any) => {
    let content = `DraftX 信息\n`;
    for (const [key, value] of Object.entries(data)) {
        content += `> ${key}:<font color="comment">${value}</font>\n`;
    }
    return content;
};


/**
 * 向企业微信报告错误
 * 联网时报告
 */
export const reportErrorToWechat = async (error: any) => {

    try {
        const reportAgreement = getConfig('report_agreement') as boolean;
        logger.info(`用户是否同意报告,${getConfig('report_agreement')}`);
        //查看用户是否允许上传系统信息
        if (!reportAgreement && reportAgreement !== null) {
            return;
        }

        const systemInfo = {
            platform: os.platform(),        // 操作系统平台 (win32, darwin, linux)
            arch: os.arch(),                // CPU架构 (x64, arm64, ia32)
            release: os.release(),          // 系统版本号
            version: os.version(),          // 系统版本详细信息
            cpus: os.cpus().length,         // CPU核心数
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // 总内存(GB)
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),   // 可用内存(GB)
        };

        // 2. 获取更详细的系统信息（可选）
        // const detailedInfo = await si.osInfo();
        // const windowsVersion = {
        //     distro: detailedInfo.distro,           // Windows 10, Windows 11 等
        //     release: detailedInfo.release,         // 版本号
        //     codename: detailedInfo.codename,       // 代号
        //     platform: detailedInfo.platform,      // 平台
        //     arch: detailedInfo.arch                // 架构
        // };

        const enhancedError = {
            ...error,
            systemInfo: JSON.stringify(systemInfo),
            // WindowsVersion: JSON.stringify(windowsVersion),
        };

        const params = {
            "msgtype": "markdown",
            "markdown": {
                "content": buildMarkdownContent(enhancedError)
            }
        };
        const url = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=dbb06a64-caa9-4c40-bc30-5d7aa0f5e25d'
        //代理服务器
        const sendUrl = 'http://ai-lib.timefamily.cc:10090/common/proxy/post?url=' + encodeURIComponent(url);
        await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });
    } catch (error) {
        logger.error(`报告错误到企业微信失败: ${error}`);
    }
}