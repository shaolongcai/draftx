import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pkg from 'node-machine-id';
import pathConfig from './pathConfigs.js';
import { getConfig } from '../database/sqlite.js';
import { logger } from './logger.js';

const { machineId } = pkg;

export interface LicenseData {
    payload: string;
    signature: string;
}

export interface LicensePayload {
    code: string;
    deviceHash: string;
    [key: string]: any;
}


/**
 * 验证许可证
 * @returns 解密后的数据
 */
export const verifyLicense = async (): Promise<boolean> => {
    try {
        // 向数据库查询许可证
        const licenseDataString = getConfig('licenseData') as string;
        if (!licenseDataString) {
            logger.error('LICENSE_NOT_FOUND'); // 许可证不存在
            return false
        }
        const licenseData = JSON.parse(licenseDataString) as LicenseData;

        const resourcesPath = pathConfig.get('resources') as string;
        const publicKeyPath = path.join(resourcesPath, 'license-public.pem');

        if (!fs.existsSync(publicKeyPath)) {
            throw new Error(`公钥文件不存在: ${publicKeyPath}`);
        }

        const PUBLIC_KEY = fs.readFileSync(publicKeyPath, 'utf-8');

        const payload = Buffer.from(licenseData.payload, 'base64');
        const signature = Buffer.from(licenseData.signature, 'base64');

        // 验证签名
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(payload);
        verifier.end();

        if (!verifier.verify(PUBLIC_KEY, signature)) {
            throw new Error('LICENSE_SIGNATURE_INVALID'); // 签名无效
        }

        // 解析数据
        const data = JSON.parse(payload.toString()) as LicensePayload;

        // 验证机器码
        const currentMachineId = await machineId(true);
        if (data.deviceHash !== currentMachineId) {
            throw new Error('DEVICE_HASH_MISMATCH'); // 机器码不匹配
        }

        return true;

    } catch (error) {
        logger.error(`verifyLicense failed: ${error}`);
        return false;
    }
};