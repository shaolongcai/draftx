
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, LexicalEditor, $getNodeByKey } from 'lexical';
import { ReactElement, useState, MouseEvent, useEffect, useMemo } from 'react';
import { Menu, MenuItem, Stack, Typography, TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import { CURRENCY_MAP, fetchExchangeRate, isValidCurrency } from '../utils/currencyUtils';

function CurrencyConversionComponent({
    originalValue,
    originalUnit,
    targetUnit,
    nodeKey,
    editor
}: {
    originalValue: number;
    originalUnit: string;
    targetUnit: string;
    nodeKey: NodeKey;
    editor: LexicalEditor;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [rate, setRate] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const open = Boolean(anchorEl);

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchExchangeRate(originalUnit, targetUnit).then(r => {
            if (active) {
                setRate(r);
                setLoading(false);
                if (r !== null) {
                    editor.update(() => {
                        const node = $getNodeByKey(nodeKey);
                        if ($isCurrencyConversionNode(node) && node.__rate !== r) {
                            node.setRate(r);
                        }
                    });
                }
            }
        });
        return () => { active = false; };
    }, [originalUnit, targetUnit, editor, nodeKey]);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setSearchQuery(''); // Reset search on open
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (newUnit: string) => {
        if (newUnit === targetUnit) {
            handleClose();
            return;
        }
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isCurrencyConversionNode(node)) {
                node.setTargetUnit(newUnit);
            }
        });
        handleClose();
    };

    const filteredCurrencies = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return Object.entries(CURRENCY_MAP).filter(([code, name]) => 
            code.toLowerCase().includes(query) || name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const resultValue = rate !== null ? (originalValue * rate).toFixed(2) : null;

    return (
        <span className="inline-flex items-center mx-1 select-none">
            <Stack
                direction="row"
                alignItems="center"
                onClick={handleClick}
                sx={{
                    cursor: 'pointer',
                    ml: 0.5,
                    color: '#d97706', // Match UnitConversionNode style
                    fontWeight: 'bold',
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: 1
                    }
                }}
            >
                {loading ? (
                    <CircularProgress size={16} sx={{ mr: 0.5, color: '#d97706' }} />
                ) : (
                    <Typography component="span" sx={{ fontWeight: 'bold' }}>
                        {resultValue !== null ? resultValue : '?'} {targetUnit}
                    </Typography>
                )}
                <KeyboardArrowDownIcon fontSize="small" />
            </Stack>
            
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: 300,
                        width: 250,
                    },
                }}
            >
                <div style={{ padding: '8px 16px', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Search currency..."
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        onKeyDown={(e) => e.stopPropagation()} // Prevent editor from capturing keys
                    />
                </div>
                {filteredCurrencies.map(([code, name]) => (
                    <MenuItem 
                        key={code} 
                        onClick={() => handleSelect(code)}
                        selected={code === targetUnit}
                    >
                        <Stack direction="row" justifyContent="space-between" width="100%">
                            <Typography variant="body2" fontWeight="bold">{code}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120, ml: 1 }}>
                                {name}
                            </Typography>
                        </Stack>
                    </MenuItem>
                ))}
                {filteredCurrencies.length === 0 && (
                    <MenuItem disabled>
                        <Typography variant="caption">No currencies found</Typography>
                    </MenuItem>
                )}
            </Menu>
        </span>
    );
}

export class CurrencyConversionNode extends DecoratorNode<ReactElement> {
    __originalValue: number;
    __originalUnit: string;
    __targetUnit: string;
    __rate: number | null;

    static getType(): string {
        return 'currency-conversion-node';
    }

    static clone(node: CurrencyConversionNode): CurrencyConversionNode {
        return new CurrencyConversionNode(
            node.__originalValue,
            node.__originalUnit,
            node.__targetUnit,
            node.__rate,
            node.__key
        );
    }

    constructor(
        originalValue: number,
        originalUnit: string,
        targetUnit: string,
        rate: number | null = null,
        key?: NodeKey
    ) {
        super(key);
        this.__originalValue = originalValue;
        this.__originalUnit = originalUnit;
        this.__targetUnit = targetUnit;
        this.__rate = rate;
    }

    static importJSON(serializedNode: any): CurrencyConversionNode {
        return $createCurrencyConversionNode(
            serializedNode.originalValue,
            serializedNode.originalUnit,
            serializedNode.targetUnit,
            serializedNode.rate
        );
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'currency-conversion-node',
            version: 1,
            originalValue: this.__originalValue,
            originalUnit: this.__originalUnit,
            targetUnit: this.__targetUnit,
            rate: this.__rate,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'currency-conversion-node';
        return span;
    }

    updateDOM(): boolean {
        return false;
    }

    setTargetUnit(unit: string): void {
        const writable = this.getWritable();
        writable.__targetUnit = unit;
        // Reset rate when unit changes so it fetches again
        writable.__rate = null;
    }

    setRate(rate: number): void {
        const writable = this.getWritable();
        writable.__rate = rate;
    }

    getTextContent(): string {
        if (this.__rate !== null) {
            const val = (this.__originalValue * this.__rate).toFixed(2);
            return `${val} ${this.__targetUnit}`;
        }
        return `${this.__originalValue} ${this.__originalUnit} = ? ${this.__targetUnit}`;
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement {
        return (
            <CurrencyConversionComponent
                originalValue={this.__originalValue}
                originalUnit={this.__originalUnit}
                targetUnit={this.__targetUnit}
                nodeKey={this.getKey()}
                editor={editor}
            />
        );
    }

    isInline(): boolean {
        return true;
    }

    isKeyboardSelectable(): boolean {
        return false;
    }
}

export function $createCurrencyConversionNode(
    originalValue: number,
    originalUnit: string,
    targetUnit: string,
    rate: number | null = null
): CurrencyConversionNode {
    return new CurrencyConversionNode(originalValue, originalUnit, targetUnit, rate);
}

export function $isCurrencyConversionNode(
    node: LexicalNode | null | undefined
): node is CurrencyConversionNode {
    return node instanceof CurrencyConversionNode;
}
