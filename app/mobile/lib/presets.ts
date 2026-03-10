import {
    GraduationCap,
    TrendingUp,
    Code,
    Feather,
    Scale,
} from "lucide-react-native";
import { Model } from "./types";

export const PRESET_ICONS = {
    academic: GraduationCap,
    finance: TrendingUp,
    programming: Code,
    writer: Feather,
    legal: Scale,
};

export interface PresetDefinition {
    label: string;
    description: string;
    system_prompt: string;
    // Keywords to look for in model name/id/description.
    keywords: string[];
}

export const PRESETS: Record<string, PresetDefinition> = {
    academic: {
        label: "Academic",
        description: "Highest context for long papers",
        system_prompt: "You are an elite academic council. Analyze the prompt with rigorous logic, relying on empirical data, peer-reviewed standards, and deep reasoning. Focus on clarity, citations (if applicable), and avoiding logical fallacies.",
        keywords: ["r1", "think", "claude", "pro", "flash"],
    },
    finance: {
        label: "Finance",
        description: "Deep analysis & reporting",
        system_prompt: "You are a council of senior financial analysts. Provide quantitative, objective, and risk-adjusted analysis. Focus on market conditions, financial metrics, and strategic business implications.",
        keywords: ["finance", "r1", "qwen", "llama", "analyze"],
    },
    programming: {
        label: "Coding",
        description: "Code generation & review",
        system_prompt: "You are a council of expert software engineers. Provide clean, efficient, and well-documented code. Focus on best practices, security, and performance. Explain your technical decisions clearly.",
        keywords: ["coder", "code", "dev", "instruct", "qwen"],
    },
    writer: {
        label: "Writer",
        description: "Creative writing & roleplay",
        system_prompt: "You are a council of creative writers and storytellers. Focus on narrative flow, character development, evocative language, and thematic depth. Be creative, engaging, and expressive.",
        keywords: ["hermes", "writer", "story", "creative", "mistral", "gemma"],
    },
    legal: {
        label: "Legal",
        description: "Document analysis",
        system_prompt: "You are a council of expert legal professionals. Analyze the text for liabilities, compliance, contractual obligations, and legal risks. Be precise, objective, and highlight potential loopholes or ambiguities.",
        keywords: ["legal", "devstral", "flash", "law", "glm"],
    },
};

/**
 * Randomly shuffles an array.
 */
function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function generateDynamicPreset(presetId: string, availableModels: Model[]): { chairman: string; members: string[]; system_prompt: string } | null {
    const preset = PRESETS[presetId];
    if (!preset || availableModels.length === 0) return null;

    // Just take the first 5 models regardless of the preset
    const selectedModels = availableModels.slice(0, Math.min(5, availableModels.length));
    
    if (selectedModels.length === 0) return null;

    const chairman = selectedModels[0].id;
    const members = selectedModels.map(m => m.id);

    return {
        chairman,
        members,
        system_prompt: preset.system_prompt
    };
}
