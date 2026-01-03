import Database from 'better-sqlite3'
import pathConfig from '../core/pathConfigs.js'
import path from 'path'
import { logger } from '../core/logger.js'
// import { pinyin } from "pinyin-pro";
import { createAIToolsDb, createConfigDb, createStickysDb, createStickysFtsDb } from './schrma.js'

let db: Database.Database | null = null


/**
 * 初始化数据库并返回一个连接实例。
 * 如果表不存在，则会创建它。
 */
export function initializeDatabase(): Database.Database {
    try {
        if (db) {
            return db
        }
        // 确保数据库所在的目录存在
        const dbDirectory = pathConfig.get('database')
        const dbPath = path.join(dbDirectory, 'metaData.db')
        logger.info(`数据库地址：${dbPath}`)
        db = new Database(dbPath) // verbose 用于在开发时打印SQL语句

        // 优化数据库性能
        db.pragma('journal_mode = WAL') // 提升并发写入性能
        db.pragma('synchronous = NORMAL') // 在大多数情况下是安全且高效的

        //创建表
        try {
            createStickysDb(db)
        } catch (error) {
            logger.error(`创建表失败: ${JSON.stringify(error)}`)
        }
        // try {
        //     createStickysFtsDb(db)
        // } catch (error) {
        //     logger.error(`FTS表创建失败: ${JSON.stringify(error)}`)
        // }
        try {
            createConfigDb(db)
        } catch (error) {
            logger.error(`创建表失败3: ${JSON.stringify(error)}`)
        }
        try {
            createAIToolsDb(db)
        } catch (error) {
            logger.error(`创建表失败4: ${JSON.stringify(error)}`)
        }

        // 添加新的字段
        // addColumn()
        // 插入默认配置
        // const insertConfig = db.prepare(`
        //   INSERT OR IGNORE INTO user_config (config_key, config_value, config_type, description) 
        //   VALUES (?, ?, ?, ?)
        // `)
        // 设置默认配置值
        // insertConfig.run('last_index_time', '0', 'number', '上次索引时间戳') // 配置key、值、类型、描述
        // insertConfig.run('index_interval', '3600000', 'number', '索引周期（毫秒，默认1小时）')
        // insertConfig.run('last_index_file_count', '0', 'number', '上次索引的文件数量')
        // insertConfig.run('ignored_folders', '[]', 'json', '忽略索引的文件夹列表')
        // insertConfig.run('ignore_hidden_files', 'false', 'boolean', '是否忽略隐藏文件')

        return db
    } catch (error) {
        logger.error(`数据库初始化失败:${JSON.stringify(error)}`)
        throw new Error(`数据库初始化失败:${JSON.stringify(error)}`)
    }
}


/**
 * 获取配置值
 * @param key 配置键名
 * @returns 配置值，如果不存在返回null
 */
export function getConfig(key: ConfigName | string): any {
    try {
        const db = getDatabase()
        const stmt = db.prepare('SELECT config_value, config_type FROM user_config WHERE config_key = ?')
        const result = stmt.get(key) as { config_value: string; config_type: string } | undefined

        if (!result) return null

        // 根据类型转换值
        switch (result.config_type) {
            case 'number':
                return Number(result.config_value)
            case 'boolean':
                return result.config_value === 'true'
            case 'json':
                return JSON.parse(result.config_value)
            default:
                return result.config_value
        }
    } catch (error) {
        logger.error(`获取配置失败: ${key}, ${error}`)
        return null
    }
}

/**
 * 设置配置值
 * @param key 配置键名
 * @param value 配置值
 * @param type 数据类型
 */
export function setConfig(key: string, value: any, type: 'boolean' | 'string' | 'number' | 'json' = 'string'): boolean {
    try {
        const db = getDatabase()
        let configValue: string

        // 根据类型转换值为字符串
        switch (type) {
            case 'json':
                configValue = JSON.stringify(value)
                break
            default:
                configValue = String(value)
        }

        const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_config (config_key, config_value, config_type, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
        stmt.run(key, configValue, type)
        return true
    } catch (error) {
        logger.error(`设置配置失败: ${key}, ${error}`)
        return false
    }
}

/**
 * 获取所有配置
 */
export function getAllConfigs(): Record<string, any> {
    try {
        const db = getDatabase()
        const stmt = db.prepare('SELECT config_key, config_value, config_type FROM user_config')
        const results = stmt.all() as Array<{ config_key: string; config_value: string; config_type: string }>

        const configs: Record<string, any> = {}
        results.forEach(row => {
            switch (row.config_type) {
                case 'number':
                    configs[row.config_key] = Number(row.config_value)
                    break
                case 'boolean':
                    configs[row.config_key] = row.config_value === 'true'
                    break
                case 'json':
                    configs[row.config_key] = JSON.parse(row.config_value)
                    break
                default:
                    configs[row.config_key] = row.config_value
            }
        })
        return configs
    } catch (error) {
        logger.error(`获取所有配置失败: ${error}`)
        return {}
    }
}


/**
 * 获取数据库连接实例。
 * 如果连接未初始化，会先进行初始化。
 */
export function getDatabase(): Database.Database {
    if (!db) {
        return initializeDatabase()
    }
    return db
}