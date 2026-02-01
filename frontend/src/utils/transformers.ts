import { TextMatchTransformer, TRANSFORMERS } from "@lexical/markdown";
import { $isCurrencyConversionNode, CurrencyConversionNode } from "../nodes/CurrencyConversionNode";

export const CURRENCY_CONVERSION: TextMatchTransformer = {
    dependencies: [CurrencyConversionNode],
    export: (node) => {
        if (!$isCurrencyConversionNode(node)) {
            return null;
        }
        return node.getTextContent();
    },
    importRegExp: /nothing/, 
    regExp: /nothing/,
    replace: (textNode) => {
        // No import implementation
    },
    trigger: '$', 
    type: 'text-match',
};

export const CUSTOM_TRANSFORMERS = [
    ...TRANSFORMERS,
    CURRENCY_CONVERSION
];
