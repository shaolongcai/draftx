/**
 * 按修改时间的人性化规则格式化：
 * - 1 分钟内：刚刚
 * - 1 小时内：X 分钟前修改
 * - 1~24 小时：X 小时前修改
 * - 24 小时外 2 天内：昨天修改
 * - 2 天~7 天：X 天前修改
 * - 超过 7 天：具体日期（随当前语言本地化，如 Aug 18, 2026）
 */
export const formatModifiedTime = (
    /** 文件修改时间（毫秒时间戳） */
    mtime: number,
    t: (key: string, params?: Record<string, string | number>) => string,
    language: string,
): string => {
    const diffMs = Date.now() - mtime;
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return t('app.list.justNow');
    if (minutes < 60) return t(minutes === 1 ? 'app.list.minuteAgo' : 'app.list.minutesAgo', { count: minutes });

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t(hours === 1 ? 'app.list.hourAgo' : 'app.list.hoursAgo', { count: hours });

    const days = Math.floor(hours / 24);
    if (days < 2) return t('app.list.yesterday');
    if (days < 7) return t('app.list.daysAgo', { count: days });

    return new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(mtime));
};
