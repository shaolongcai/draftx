import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, LexicalEditor, $getNodeByKey, $createNodeSelection, $setSelection } from 'lexical';
import { ReactElement, useState, MouseEvent } from 'react';
import { Menu, MenuItem, Stack, Typography, useTheme } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { convertUnit, getAvailableUnits, UnitType } from '../utils/unitConversion';

function UnitConversionComponent({
    originalValue,
    originalUnit,
    targetValue,
    targetUnit,
    nodeKey,
    editor
}: {
    originalValue: number;
    originalUnit: string;
    targetValue: number;
    targetUnit: string;
    nodeKey: NodeKey;
    editor: LexicalEditor;
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const theme = useTheme()
    const open = Boolean(anchorEl);

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isUnitConversionNode(node)) {
                const nodeSelection = $createNodeSelection();
                nodeSelection.add(nodeKey);
                $setSelection(nodeSelection);
            }
        });
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (newUnit: string) => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isUnitConversionNode(node)) {
                node.setTargetUnit(newUnit);
            }
        });
        handleClose();
    };

    const availableUnits = getAvailableUnits(originalUnit);

    return (
        <span className="inline-flex items-center mx-1 select-none">
            {/* 移除原始数值和等号的显示，只保留结果 */}
            <Stack
                direction="row"
                alignItems="center"
                onClick={handleClick}
                sx={{
                    cursor: 'pointer',
                    ml: 0.5,
                    color: '#d97706', // Amber-600 like color
                    fontWeight: 'bold',
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: 1
                    }
                }}
            >
                <Typography component="span" sx={{ fontWeight: 'bold' }} color={theme.palette.primary.main}>
                    {targetValue} {targetUnit}
                </Typography>
                <KeyboardArrowDownIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
            </Stack>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                disableScrollLock={true}
                autoFocus={false}
                disableEnforceFocus={true}
                disableRestoreFocus={true}
                MenuListProps={{
                    'aria-labelledby': 'unit-select-button',
                }}
            >
                {availableUnits.map((unit) => (
                    <MenuItem
                        key={unit}
                        onClick={() => handleSelect(unit)}
                        selected={unit === targetUnit}
                    >
                        {unit}
                    </MenuItem>
                ))}
            </Menu>
        </span>
    );
}

export class UnitConversionNode extends DecoratorNode<ReactElement> {
    __originalValue: number;
    __originalUnit: string;
    __targetUnit: string;
    __result: string; // Add result string for comparison

    static getType(): string {
        return 'unit-conversion-node';
    }

    static clone(node: UnitConversionNode): UnitConversionNode {
        return new UnitConversionNode(
            node.__originalValue,
            node.__originalUnit,
            node.__targetUnit,
            node.__key
        );
    }

    constructor(
        originalValue: number,
        originalUnit: string,
        targetUnit: string,
        key?: NodeKey
    ) {
        super(key);
        this.__originalValue = originalValue;
        this.__originalUnit = originalUnit;
        this.__targetUnit = targetUnit;
        // Pre-calculate result string for easier comparison/updates
        const val = convertUnit(originalValue, originalUnit, targetUnit);
        this.__result = `${val} ${targetUnit}`;
    }

    static importJSON(serializedNode: any): UnitConversionNode {
        return $createUnitConversionNode(
            serializedNode.originalValue,
            serializedNode.originalUnit,
            serializedNode.targetUnit
        );
    }

    exportJSON(): any {
        return {
            ...super.exportJSON(),
            type: 'unit-conversion-node',
            version: 1,
            originalValue: this.__originalValue,
            originalUnit: this.__originalUnit,
            targetUnit: this.__targetUnit,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        span.className = 'unit-conversion-node';
        return span;
    }

    updateDOM(): boolean {
        return true;
    }

    setTargetUnit(unit: string): void {
        const writable = this.getWritable();
        writable.__targetUnit = unit;
        const val = convertUnit(this.__originalValue, this.__originalUnit, unit);
        writable.__result = `${val} ${unit}`;
    }

    decorate(editor: LexicalEditor, config: EditorConfig): ReactElement {
        const targetValue = convertUnit(this.__originalValue, this.__originalUnit, this.__targetUnit);

        return (
            <UnitConversionComponent
                originalValue={this.__originalValue}
                originalUnit={this.__originalUnit}
                targetValue={targetValue}
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

export function $createUnitConversionNode(
    originalValue: number,
    originalUnit: string,
    targetUnit: string
): UnitConversionNode {
    return new UnitConversionNode(originalValue, originalUnit, targetUnit);
}

export function $isUnitConversionNode(
    node: LexicalNode | null | undefined
): node is UnitConversionNode {
    return node instanceof UnitConversionNode;
}
