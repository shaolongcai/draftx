
import { useTheme } from '@mui/material';
import { type EditorThemeClasses } from 'lexical';


export const theme: EditorThemeClasses = {
    paragraph:  'editor-paragraph',
    heading: {
        h1: 'editor-h1',
        h2: 'editor-h2',
        h3: 'editor-h3',
    },
    quote: 'editor-quote',
    code: 'editor-code',
    text: {
        code: 'editor-text-code',
        bold: 'editor-text-bold',
    },
    codeHighlight: {
        atrule: 'editor-tokenAttr',
        attr: 'editor-tokenAttr',
        boolean: 'editor-tokenProperty',
        builtin: 'editor-tokenSelector',
        cdata: 'editor-tokenComment',
        char: 'editor-tokenSelector',
        class: 'editor-tokenFunction',
        'class-name': 'editor-tokenFunction',
        comment: 'editor-tokenComment',
        constant: 'editor-tokenProperty',
        deleted: 'editor-tokenProperty',
        doctype: 'editor-tokenComment',
        entity: 'editor-tokenOperator',
        function: 'editor-tokenFunction',
        important: 'editor-tokenVariable',
        inserted: 'editor-tokenSelector',
        keyword: 'editor-tokenAttr',
        namespace: 'editor-tokenVariable',
        number: 'editor-tokenProperty',
        operator: 'editor-tokenOperator',
        prolog: 'editor-tokenComment',
        property: 'editor-tokenProperty',
        punctuation: 'editor-tokenPunctuation',
        regex: 'editor-tokenVariable',
        selector: 'editor-tokenSelector',
        string: 'editor-tokenSelector',
        symbol: 'editor-tokenProperty',
        tag: 'editor-tokenProperty',
        url: 'editor-tokenOperator',
        variable: 'editor-tokenVariable',
    },
    list: {
        nested: {
            listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
        listitemChecked: 'editor-listItemChecked',
        listitemUnchecked: 'editor-listItemUnchecked',
        olDepth: [
            'editor-list-ol1',
            'editor-list-ol2',
            'editor-list-ol3',
        ],
        ulDepth: [
            'editor-list-ul1',
            'editor-list-ul2',
            'editor-list-ul3',
        ],
    },
    table: 'editor-table',
    tableCell: 'editor-tableCell',
    tableCellHeader: 'editor-tableCellHeader',
    tableCellSelected: 'editor-tableCellSelected',
    tableSelection: 'editor-tableSelection',

}
