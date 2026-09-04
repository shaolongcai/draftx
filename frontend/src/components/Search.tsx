import { useEvent } from "@/contexts/EvenContext";
import { useTranslation } from '@/contexts/I18nContext';
import { Search as SearchIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material";
import { useRef, useState } from "react";

interface Props {
    onSearch: (keyword: string) => void;
}

const Search: React.FC<Props> = ({
    onSearch,
}) => {

    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    const { t } = useTranslation();

    const theme = useTheme()
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { loadStickys$ } = useEvent();

    loadStickys$.useSubscription(() => {
        setSearchValue('');
        onSearch('');
    })

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchValue(value)
        onSearch(value);
    }

    // 圆角胶囊搜索框：放大镜图标 + 无边框输入
    return <div
        id='search-panel'
        className="flex items-center gap-2 rounded-full px-4"
        style={{
            border: '1px solid #E1E0DA',
            height: '44px',
        }}
    >
        <SearchIcon sx={{ fontSize: 20, color: '#867A6C', flexShrink: 0 }} />
        <input
            ref={inputRef}
            autoComplete="off"
            autoFocus
            className="flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-[#867A6C99]"
            style={{ color: theme.palette.text.primary }}
            placeholder={t('app.list.placeholder')}
            value={searchValue}
            onChange={(event) => handleSearch(event.target.value)}
        />
    </div>
}

export default Search
