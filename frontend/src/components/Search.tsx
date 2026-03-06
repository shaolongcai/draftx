import { useEvent } from "@/contexts/EvenContext";
import { Card,  TextField, useTheme } from "@mui/material"
import {  useRef, useState } from "react";
import { useTranslation } from '@/contexts/I18nContext';

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

    return <Card
        id='search-panel'
        elevation={0}
        className="px-0 py-0  border "
        style={{
            borderColor: `${theme.palette.primary.main}40`
        }}
    >
            <TextField
                inputRef={inputRef}
                slotProps={{
                    htmlInput: {
                        autoComplete: 'off',
                        autoFocus: true,
                    }
                }}
                fullWidth
                placeholder={t('app.list.placeholder')}
                variant="outlined"
                value={searchValue}
                onChange={(event) => handleSearch(event.target.value)}
                sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                        fontSize: '14px',
                        height: '56px',
                        '& fieldset': {
                            borderWidth: '0px',
                        },
                        '&:hover fieldset': {
                            borderColor: '#0f5baa',
                        },
                        '&.Mui-focused fieldset': {
                            borderWidth: '0px',
                        },
                        '& .MuiOutlinedInput-input': {
                            color: theme.palette.text.primary,
                        }
                    },
                }}
            />
      
    </Card>
}

export default Search