import { useEvent } from "@/contexts/EvenContext";
import { Card, Paper, Stack, TextField } from "@mui/material"
import { useEffect, useRef, useState } from "react";
// import { useTranslation } from '@/contexts/I18nContext';

interface Props {
    onSearch: (keyword: string) => void;
}

const Search: React.FC<Props> = ({
    onSearch,
}) => {

    const [searchValue, setSearchValue] = useState(''); //搜索的关键词
    // const { t } = useTranslation();
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
        elevation={1}
        className="px-4 py-1 mx-3"
    >
        <Stack direction="row" spacing={2} alignItems="center">
            <TextField
                inputRef={inputRef}
                slotProps={{
                    htmlInput: {
                        autoComplete: 'off',
                        autoFocus: true,
                    }
                }}
                fullWidth
                placeholder='Input any keyword'
                variant="outlined"
                value={searchValue}
                onChange={(event) => handleSearch(event.target.value)}
                sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
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
                            color: '#666F8D'
                        }
                    },
                }}
            />
        </Stack>
    </Card>
}

export default Search